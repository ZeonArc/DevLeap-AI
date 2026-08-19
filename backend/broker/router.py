import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import ensure_user_exists
from core.config import BROKER_RATE_LIMIT, BROKER_RATE_LIMIT_WINDOW_SECONDS
from core.llm import LLMError, generate_json, generate_text
from core.rate_limit import rate_limit
from core.websearch import (
    InvalidUrlError,
    SearchUnavailableError,
    fetch_page_text,
    search,
)
from db import get_db

router = APIRouter(prefix="/api/v1", tags=["broker"])

RECRUITER_SYSTEM = (
    "You are a technical recruiter writing on behalf of a developer. You only "
    "make claims supported by the developer's profile, and you never invent "
    "employers, URLs, or experience."
)


class JobDescription(BaseModel):
    title: str
    company: str
    description: str


class MatchRequest(BaseModel):
    profile_json: str
    job_description: JobDescription
    user_id: str


class DraftPitchRequest(BaseModel):
    job_url: str


async def _latest_profile(pool, db_user_id: str, include_architecture: bool) -> str:
    """Return the user's most recent profile as a JSON string for prompting."""
    row = await pool.fetchrow(
        'SELECT skills_json, architecture_json, summary_json FROM "Profile"'
        " WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        db_user_id,
    )

    if not row:
        raise HTTPException(
            status_code=400,
            detail="No profile found. Run the Profiler on a repository first.",
        )

    context = {
        "skills": json.loads(row["skills_json"] or "[]"),
        "summary": json.loads(row["summary_json"] or "{}"),
    }
    if include_architecture:
        context["architecture"] = json.loads(row["architecture_json"] or "[]")

    return json.dumps(context)


@router.post("/draft-pitch")
async def draft_pitch_from_url(
    request: DraftPitchRequest,
    current_user_id: str = Depends(rate_limit("broker", BROKER_RATE_LIMIT, BROKER_RATE_LIMIT_WINDOW_SECONDS)),
):
    """
    Read the job posting at the given URL and draft a pitch against the
    user's latest profile.

    The page is fetched server-side and handed to the model as text, so the
    model works from the real posting rather than guessing at the URL.
    """
    pool = get_db()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not connected.")

    db_user_id = await ensure_user_exists(pool, current_user_id)
    profile_context = await _latest_profile(pool, db_user_id, include_architecture=True)

    try:
        posting_text = await fetch_page_text(request.job_url)
    except InvalidUrlError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Could not read that job posting. The site may require a login or block automated readers.",
        )

    if len(posting_text) < 200:
        raise HTTPException(
            status_code=422,
            detail="That page had almost no readable text — it is probably rendered by JavaScript. Paste the description into the Match form instead.",
        )

    prompt = f"""A developer wants to apply for the role described below.

Developer profile (extracted from their repositories):
{profile_context}

Job posting text (fetched from {request.job_url}):
{posting_text}

Tasks:
- Read the posting and identify the exact job title and company name.
- Draft a 300-500 word pitch from the developer to the hiring manager.
- Tie specific skills, projects, and architecture decisions from the profile
  to the technical requirements in the posting.
- Do not claim any skill absent from the profile. If the posting is vague,
  stay concrete about what the developer has actually built.

Reply with JSON only:
{{"job_title": "...", "company": "...", "pitch_message": "..."}}"""

    try:
        result = await generate_json(prompt, system=RECRUITER_SYSTEM)
    except LLMError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    job_title = result.get("job_title") or "Unknown Role"
    company = result.get("company") or "Unknown Company"
    pitch_message = result.get("pitch_message") or ""

    if not pitch_message:
        raise HTTPException(status_code=502, detail="The model returned an empty pitch. Try again.")

    pitch_id = str(uuid.uuid4())
    await pool.execute(
        'INSERT INTO "DraftedPitch" (id, user_id, job_title, company, pitch_message, status, created_at)'
        " VALUES ($1, $2, $3, $4, $5, $6, NOW())",
        pitch_id, db_user_id, job_title, company, pitch_message, "pending",
    )

    return {
        "status": "success",
        "pitch": {
            "id": pitch_id,
            "job_title": job_title,
            "company": company,
            "pitch_message": pitch_message,
            "status": "pending",
        },
    }


@router.get("/jobs/find")
async def find_matching_jobs(
    current_user_id: str = Depends(rate_limit("broker", BROKER_RATE_LIMIT, BROKER_RATE_LIMIT_WINDOW_SECONDS)),
):
    """
    Search the web for live postings that match the user's profile.

    The search backend supplies the candidate roles; the model only ranks
    them and explains the fit. Any posting the model returns is checked back
    against the real search hits, so it cannot fabricate a listing or a link.
    """
    pool = get_db()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not connected.")

    db_user_id = await ensure_user_exists(pool, current_user_id)
    profile_context = await _latest_profile(pool, db_user_id, include_architecture=False)

    profile = json.loads(profile_context)
    skill_names = [s.get("name", "") for s in profile.get("skills", []) if s.get("name")]
    top_skills = ", ".join(skill_names[:5]) or "software engineering"
    query = f"remote {top_skills} engineer job openings"

    try:
        hits = await search(query, limit=10)
    except SearchUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    if not hits:
        return {"status": "success", "jobs": []}

    allowed = {h["url"]: h for h in hits if h.get("url")}
    listing = "\n".join(
        f'- url: {h["url"]}\n  title: {h["title"]}\n  snippet: {h["snippet"]}'
        for h in hits
        if h.get("url")
    )

    prompt = f"""Developer profile:
{profile_context}

Search results for live job postings:
{listing}

Pick the 3-5 results that genuinely match this developer and explain each fit
in one sentence. Use only URLs that appear verbatim in the list above — do not
invent or modify any URL. If fewer than three genuinely match, return only
those that do.

Reply with JSON only:
{{"jobs": [{{"title": "...", "company": "...", "url": "...", "match_rationale": "..."}}]}}"""

    try:
        result = await generate_json(prompt, system=RECRUITER_SYSTEM)
    except LLMError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    # Keep only postings that trace back to a real search hit.
    jobs = []
    for job in result.get("jobs", []):
        url = (job.get("url") or "").strip()
        if url not in allowed:
            continue
        jobs.append(
            {
                "title": job.get("title") or allowed[url]["title"],
                "company": job.get("company") or "Unknown",
                "url": url,
                "match_rationale": job.get("match_rationale") or "",
            }
        )

    return {"status": "success", "jobs": jobs}


@router.post("/match")
async def match_and_draft_pitch(
    request: MatchRequest,
    current_user_id: str = Depends(rate_limit("broker", BROKER_RATE_LIMIT, BROKER_RATE_LIMIT_WINDOW_SECONDS)),
):
    pool = get_db()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not connected.")

    db_user_id = await ensure_user_exists(pool, current_user_id)

    prompt = f"""Developer profile:
{request.profile_json}

Job description:
{request.job_description.model_dump_json()}

Draft a concise, professional pitch from the developer to the hiring manager.
Highlight how the developer's specific skills and projects match the listed
requirements. Do not claim any skill absent from the profile. Reply with the
message text only — no preamble, no JSON."""

    try:
        pitch_message = await generate_text(prompt, system=RECRUITER_SYSTEM)
    except LLMError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    pitch_id = str(uuid.uuid4())
    await pool.execute(
        'INSERT INTO "DraftedPitch" (id, user_id, job_title, company, pitch_message, status, created_at)'
        " VALUES ($1, $2, $3, $4, $5, $6, NOW())",
        pitch_id, db_user_id, request.job_description.title,
        request.job_description.company, pitch_message, "pending",
    )

    return {
        "status": "success",
        "pitch": {
            "id": pitch_id,
            "job_title": request.job_description.title,
            "company": request.job_description.company,
            "pitch_message": pitch_message,
            "status": "pending",
        },
    }
