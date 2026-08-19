import uuid

import httpx
import jwt
from fastapi import HTTPException, Request
from jwt import PyJWKClient

from core.config import CLERK_FRONTEND_API, CLERK_SECRET_KEY

jwks_client = PyJWKClient(f"https://{CLERK_FRONTEND_API}/.well-known/jwks.json")


def verify_clerk_token(req: Request) -> str:
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


async def fetch_clerk_email(clerk_id: str) -> str | None:
    """Look up a user's real email from Clerk's Backend API. Returns None on any failure."""
    if not CLERK_SECRET_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=5.0) as http_client:
            resp = await http_client.get(
                f"https://api.clerk.com/v1/users/{clerk_id}",
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
            )
        if resp.status_code != 200:
            return None
        data = resp.json()
        emails = data.get("email_addresses") or []
        primary_id = data.get("primary_email_address_id")
        for addr in emails:
            if addr.get("id") == primary_id:
                return addr.get("email_address")
        return emails[0]["email_address"] if emails else None
    except Exception as e:
        print(f"Failed to fetch Clerk email for {clerk_id}: {e}")
        return None


async def ensure_user_exists(pool, clerk_id: str) -> str:
    """
    Profile.user_id and DraftedPitch.user_id are foreign keys to User.id (a UUID).
    This helper looks up or creates the User row for the given Clerk ID and returns
    the internal UUID that should be used as user_id in other tables.
    """
    user = await pool.fetchrow('SELECT id FROM "User" WHERE clerk_id = $1', clerk_id)
    if user:
        return user['id']

    email = await fetch_clerk_email(clerk_id) or f"{clerk_id}@users.devleap.ai.invalid"
    db_user_id = str(uuid.uuid4())
    await pool.execute(
        'INSERT INTO "User" (id, clerk_id, email, tier, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
        db_user_id, clerk_id, email, "Starter"
    )
    return db_user_id
