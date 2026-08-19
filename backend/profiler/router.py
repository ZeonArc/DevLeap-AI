import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import ensure_user_exists
from core.config import (
    INGEST_RATE_LIMIT,
    INGEST_RATE_LIMIT_WINDOW_SECONDS,
    LLM_MAX_INPUT_CHARS,
)
from core.llm import LLMError, generate_json
from core.rate_limit import rate_limit
from db import get_db
from profiler.github_ingest import clone_and_extract
from profiler.schema import DeveloperProfile

router = APIRouter(prefix="/api/v1", tags=["profiler"])

PROFILE_SYSTEM = (
    "You are a technical profiler. You read source code and describe what the "
    "author demonstrably built, citing concrete files and technologies. You "
    "never claim a skill the code does not evidence. You reply with a single "
    "JSON object and nothing else."
)


class IngestionRequest(BaseModel):
    repo_url: str
    user_id: str


class QuickProfileRequest(BaseModel):
    github_username: str
    user_id: str


def _build_prompt(repo_content: str, lead_in: str) -> str:
    return (
        f"{lead_in}\n\n"
        "Return JSON with exactly these keys:\n"
        '  "skills": a list of {"name", "level", "context"} — level is one of '
        "Beginner, Intermediate, Advanced, Expert; context names the file or "
        "module where the skill is evidenced.\n"
        '  "architecture_diagrams": a list of {"title", "mermaid_code", '
        '"description"} — mermaid_code must be valid Mermaid.js syntax.\n'
        '  "summary": {"pitch", "key_features"} — pitch is a concise '
        "non-technical description; key_features is a list of strings.\n\n"
        f"Repository content:\n{repo_content[:LLM_MAX_INPUT_CHARS]}"
    )


async def _profile_and_store(
    pool,
    db_user_id: str,
    repo_content: str,
    lead_in: str,
    github_username: str | None = None,
) -> dict:
    """Run the model over repository text, persist the profile, return it."""
    try:
        profile_data = await generate_json(
            _build_prompt(repo_content, lead_in),
            schema=DeveloperProfile,
            system=PROFILE_SYSTEM,
        )
    except LLMError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    skills = json.dumps(profile_data.get("skills", []))
    architecture = json.dumps(profile_data.get("architecture_diagrams", []))
    summary = json.dumps(profile_data.get("summary", {}))

    if github_username is None:
        await pool.execute(
            'INSERT INTO "Profile" (id, user_id, skills_json, architecture_json, summary_json, created_at)'
            " VALUES ($1, $2, $3, $4, $5, NOW())",
            str(uuid.uuid4()), db_user_id, skills, architecture, summary,
        )
    else:
        await pool.execute(
            'INSERT INTO "Profile" (id, user_id, github_username, skills_json, architecture_json, summary_json, created_at)'
            " VALUES ($1, $2, $3, $4, $5, $6, NOW())",
            str(uuid.uuid4()), db_user_id, github_username, skills, architecture, summary,
        )

    return {"status": "success", "profile": json.dumps(profile_data)}


@router.post("/ingest")
async def ingest_repository(
    request: IngestionRequest,
    current_user_id: str = Depends(rate_limit("ingest", INGEST_RATE_LIMIT, INGEST_RATE_LIMIT_WINDOW_SECONDS)),
):
    pool = get_db()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not connected.")

    # Resolve Clerk ID -> internal DB user UUID
    db_user_id = await ensure_user_exists(pool, current_user_id)

    try:
        repo_content = clone_and_extract(request.repo_url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(e)}")

    return await _profile_and_store(
        pool,
        db_user_id,
        repo_content,
        "Analyse this repository and extract the developer's skills, "
        "architecture patterns, and a recruiter-ready summary. Be specific "
        "and cite files.",
    )


@router.post("/quick-profile")
async def quick_profile(
    request: QuickProfileRequest,
    current_user_id: str = Depends(rate_limit("ingest", INGEST_RATE_LIMIT, INGEST_RATE_LIMIT_WINDOW_SECONDS)),
):
    pool = get_db()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not connected.")

    # Resolve Clerk ID -> internal DB user UUID
    db_user_id = await ensure_user_exists(pool, current_user_id)

    repo_url = f"https://github.com/{request.github_username}/{request.github_username}"
    try:
        repo_content = clone_and_extract(repo_url)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Could not find repos for user: {request.github_username}.")

    return await _profile_and_store(
        pool,
        db_user_id,
        repo_content,
        "Analyse this GitHub profile repository and extract the developer's "
        "skills, architecture patterns, and a recruiter-ready summary.",
        github_username=request.github_username,
    )
