from fastapi import APIRouter, Depends, HTTPException

from core.auth import ensure_user_exists, verify_clerk_token
from db import get_db

router = APIRouter(prefix="/api/v1", tags=["users"])


@router.get("/me")
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
