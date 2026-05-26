import os
import stripe
import jwt
from jwt import PyJWKClient
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from profiler.schema import DeveloperProfile
from profiler.github_ingest import clone_and_extract
from dotenv import load_dotenv
import json

# DB
from db import connect_db, disconnect_db, get_db
import uuid

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()

app = FastAPI(title="DevLeap AI - Unified Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Clerk JWKS for JWT verification
clerk_frontend_api = os.getenv("CLERK_FRONTEND_API", "actual-elephant-79.clerk.accounts.dev") 
jwks_client = PyJWKClient(f"https://{clerk_frontend_api}/.well-known/jwks.json")

def verify_clerk_token(req: Request):
    auth_header = req.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.split(" ")[1]
    
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        data = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return data.get("sub")
    except jwt.PyJWTError as e:
        print(f"JWT Verification Error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")

try:
    client = genai.Client()
except Exception as e:
    client = None
    print(f"Failed to initialize Gemini Client: {e}")


# --- Helper: ensure User row exists for a Clerk ID, return the DB UUID ---
async def ensure_user_exists(pool, clerk_id: str) -> str:
    """
    Profile.user_id and DraftedPitch.user_id are foreign keys to User.id (a UUID).
    This helper looks up or creates the User row for the given Clerk ID and returns
    the internal UUID that should be used as user_id in other tables.
    """
    user = await pool.fetchrow('SELECT id FROM "User" WHERE clerk_id = $1', clerk_id)
    if user:
        return user['id']
    
    db_user_id = str(uuid.uuid4())
    await pool.execute(
        'INSERT INTO "User" (id, clerk_id, email, tier, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
        db_user_id, clerk_id, f"{clerk_id}@devleap.ai", "Starter"
    )
    return db_user_id


# --- Profiler Endpoints ---

class IngestionRequest(BaseModel):
    repo_url: str
    user_id: str

class QuickProfileRequest(BaseModel):
    github_username: str
    user_id: str

@app.post("/api/v1/ingest")
async def ingest_repository(request: IngestionRequest, current_user_id: str = Depends(verify_clerk_token)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API client not configured.")
    pool = get_db()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not connected.")
    
    # Resolve Clerk ID -> internal DB user UUID
    db_user_id = await ensure_user_exists(pool, current_user_id)
    
    try:
        repo_content = clone_and_extract(request.repo_url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(e)}")
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"Analyze this repository content and extract the developer's skills, architecture patterns, and a summary suitable for a recruiter. Be thorough and specific:\n\n{repo_content[:500000]}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DeveloperProfile,
            ),
        )
        profile_data = json.loads(response.text)
        await pool.execute(
            'INSERT INTO "Profile" (id, user_id, skills_json, architecture_json, summary_json, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
            str(uuid.uuid4()), db_user_id,
            json.dumps(profile_data.get("skills", [])),
            json.dumps(profile_data.get("architecture_diagrams", [])),
            json.dumps(profile_data.get("summary", {}))
        )
        return {"status": "success", "profile": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/quick-profile")
async def quick_profile(request: QuickProfileRequest, current_user_id: str = Depends(verify_clerk_token)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API client not configured.")
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
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"Analyze this GitHub profile repository and extract the developer's skills, architecture patterns, and a recruiter-ready summary:\n\n{repo_content[:500000]}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DeveloperProfile,
            ),
        )
        profile_data = json.loads(response.text)
        await pool.execute(
            'INSERT INTO "Profile" (id, user_id, github_username, skills_json, architecture_json, summary_json, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
            str(uuid.uuid4()), db_user_id, request.github_username,
            json.dumps(profile_data.get("skills", [])),
            json.dumps(profile_data.get("architecture_diagrams", [])),
            json.dumps(profile_data.get("summary", {}))
        )
        return {"status": "success", "profile": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Broker Endpoints ---

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

@app.post("/api/v1/draft-pitch")
async def draft_pitch_from_url(request: DraftPitchRequest, current_user_id: str = Depends(verify_clerk_token)):
    """
    Accept a job URL, fetch the user's latest profile from DB,
    use Gemini to analyze the job posting and cross-reference with the profile,
    then draft a personalized pitch.
    """
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API client not configured.")
    pool = get_db()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not connected.")
    
    db_user_id = await ensure_user_exists(pool, current_user_id)
    
    # Fetch user's latest profile
    latest_profile = await pool.fetchrow(
        'SELECT skills_json, architecture_json, summary_json FROM "Profile" WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        db_user_id
    )
    
    if not latest_profile:
        raise HTTPException(status_code=400, detail="No profile found. Please run the Profiler first to ingest a repository.")
    
    profile_context = json.dumps({
        "skills": json.loads(latest_profile["skills_json"] or "[]"),
        "architecture": json.loads(latest_profile["architecture_json"] or "[]"),
        "summary": json.loads(latest_profile["summary_json"] or "{}"),
    })
    
    prompt = f"""You are an expert recruiter AI agent. You have two inputs:

1. A developer's technical profile (extracted from their GitHub repositories):
{profile_context}

2. A job posting URL the developer wants to apply to:
{request.job_url}

Your tasks:
- **IMPORTANT: Use your Google Search capabilities to find and read the content of the job posting at the provided URL.**
- Identify the exact job title and company name from the job posting.
- Analyze the requirements, technical stack, and responsibilities listed in the job description.
- Draft a highly personalized, technical pitch message (300-500 words) from the developer to the hiring manager.
- The pitch MUST highlight specific skills, projects, and architecture decisions from the developer's profile that directly map to the technical requirements found in the job posting.
- Be professional, concise, and confident. Do not make up skills the developer does not have.

Respond in this exact JSON format:
{{
  "job_title": "the actual job title",
  "company": "the actual company name", 
  "pitch_message": "the full pitch message text"
}}
"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                tools=[{'google_search': {}}],
            ),
        )
        result = json.loads(response.text)
        job_title = result.get("job_title", "Unknown Role")
        company = result.get("company", "Unknown Company")
        pitch_message = result.get("pitch_message", response.text)
        
        pitch_id = str(uuid.uuid4())
        await pool.execute(
            'INSERT INTO "DraftedPitch" (id, user_id, job_title, company, pitch_message, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
            pitch_id, db_user_id, job_title, company, pitch_message, "pending"
        )
        return {
            "status": "success",
            "pitch": {
                "id": pitch_id,
                "job_title": job_title,
                "company": company,
                "pitch_message": pitch_message,
                "status": "pending"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/jobs/find")
async def find_matching_jobs(current_user_id: str = Depends(verify_clerk_token)):
    """
    Look up the user's latest profile, then use Gemini + Google Search to
    find 3-5 active job postings that match their technical skills.
    """
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API client not configured.")
    pool = get_db()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not connected.")
    
    db_user_id = await ensure_user_exists(pool, current_user_id)
    
    # Fetch user's latest profile
    latest_profile = await pool.fetchrow(
        'SELECT skills_json, architecture_json, summary_json FROM "Profile" WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        db_user_id
    )
    
    if not latest_profile:
        raise HTTPException(status_code=400, detail="No profile found. Please run the Profiler first to ingest a repository.")
    
    profile_context = json.dumps({
        "skills": json.loads(latest_profile["skills_json"] or "[]"),
        "summary": json.loads(latest_profile["summary_json"] or "{}"),
    })
    
    prompt = f"""You are an expert technical recruiter AI.
The following is a developer's technical profile:
{profile_context}

Your tasks:
- **Use your Google Search capabilities to find 3 to 5 ACTUAL, ACTIVE remote software engineering job postings** that strongly match the developer's skills.
- Search sites like LinkedIn, Greenhouse, Lever, BuiltIn, or company career pages.
- For each job, provide the exact job title, the company name, the URL to the job posting, and a 1-sentence rationale explaining why this developer is a strong fit.
- Ensure the URLs are real and valid.

Respond in this exact JSON format:
{{
  "jobs": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "url": "https://link-to-job",
      "match_rationale": "Short explanation of fit."
    }}
  ]
}}
"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                tools=[{'google_search': {}}],
            ),
        )
        result = json.loads(response.text)
        return {"status": "success", "jobs": result.get("jobs", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/match")
async def match_and_draft_pitch(request: MatchRequest, current_user_id: str = Depends(verify_clerk_token)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API client not configured.")
    pool = get_db()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not connected.")
    
    db_user_id = await ensure_user_exists(pool, current_user_id)
        
    prompt = f"""
    You are an expert recruiter and technical sourcer. 
    Review the following developer profile (in JSON format) and the job description.
    
    Developer Profile:
    {request.profile_json}
    
    Job Description:
    {request.job_description.model_dump_json()}
    
    Draft a highly personalized, technical pitch message from the developer to the hiring manager for this job.
    The message should be concise, professional, and highlight how the developer's specific skills and projects (from the profile) match the job requirements.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        pitch_id = str(uuid.uuid4())
        await pool.execute(
            'INSERT INTO "DraftedPitch" (id, user_id, job_title, company, pitch_message, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
            pitch_id, db_user_id, request.job_description.title,
            request.job_description.company, response.text, "pending"
        )
        return {"status": "success", "pitch": {"id": pitch_id, "job_title": request.job_description.title, "company": request.job_description.company, "pitch_message": response.text, "status": "pending"}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- User Data Endpoints (for dashboard, per-account) ---

@app.get("/api/v1/me")
async def get_current_user(current_user_id: str = Depends(verify_clerk_token)):
    """Get the current user's data, profiles, and pitches."""
    pool = get_db()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not connected.")
    
    db_user_id = await ensure_user_exists(pool, current_user_id)
    
    user = await pool.fetchrow('SELECT id, clerk_id, email, tier, stripe_cus_id, created_at FROM "User" WHERE id = $1', db_user_id)
    profiles = await pool.fetch('SELECT id, github_username, skills_json, architecture_json, summary_json, created_at FROM "Profile" WHERE user_id = $1 ORDER BY created_at DESC', db_user_id)
    pitches = await pool.fetch('SELECT id, job_title, company, pitch_message, status, created_at FROM "DraftedPitch" WHERE user_id = $1 ORDER BY created_at DESC', db_user_id)
    
    return {
        "user": dict(user) if user else None,
        "profiles": [dict(p) for p in profiles],
        "pitches": [dict(p) for p in pitches],
        "stats": {
            "repos_ingested": len(profiles),
            "pitches_drafted": len(pitches),
            "pitches_pending": len([p for p in pitches if p["status"] == "pending"]),
        }
    }


# --- Billing / Stripe Endpoints ---

class CheckoutSessionRequest(BaseModel):
    user_id: str
    plan_id: str = "price_pro_broker"

@app.post("/api/v1/billing/create-checkout-session")
async def create_checkout_session(request: CheckoutSessionRequest, current_user_id: str = Depends(verify_clerk_token)):
    if request.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to act on behalf of this user.")
    pool = get_db()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not connected.")
    try:
        db_user_id = await ensure_user_exists(pool, current_user_id)
            
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'unit_amount': 2900,
                        'product_data': {
                            'name': 'Pro Broker Tier',
                            'description': 'Unlimited GitHub Repos, Architecture Extraction, Live LinkedIn Job Matching, 100 Autonomous Pitches/mo',
                        },
                        'recurring': {
                            'interval': 'month',
                        },
                    },
                    'quantity': 1,
                },
            ],
            metadata={"user_id": db_user_id, "clerk_id": current_user_id},
            mode='subscription',
            success_url="http://localhost:3000/dashboard?success=true",
            cancel_url="http://localhost:3000/pricing?canceled=true",
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/billing/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get("metadata", {}).get("user_id")
        if user_id:
            pool = get_db()
            if pool:
                await pool.execute(
                    'UPDATE "User" SET tier = $1, stripe_cus_id = $2, updated_at = NOW() WHERE id = $3',
                    "Pro Broker", session.get("customer"), user_id
                )
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        customer_id = subscription.get("customer")
        if customer_id:
            pool = get_db()
            if pool:
                await pool.execute(
                    'UPDATE "User" SET tier = $1, updated_at = NOW() WHERE stripe_cus_id = $2',
                    "Starter", customer_id
                )
            
    return {"status": "success"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "gemini_configured": client is not None,
        "db_connected": get_db() is not None,
        "version": "0.4.0",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
