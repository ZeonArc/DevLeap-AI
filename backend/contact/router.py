import uuid

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from core.config import CONTACT_RATE_LIMIT, CONTACT_RATE_LIMIT_WINDOW_SECONDS
from core.rate_limit import check_rate_limit
from db import get_db

router = APIRouter(prefix="/api/v1", tags=["contact"])


class ContactRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    message: str = Field(min_length=1, max_length=5000)


@router.post("/contact")
async def submit_contact_message(request: ContactRequest, req: Request):
    # No auth on this endpoint -- it's the public contact form -- so the
    # limiter keys off the caller's IP instead of a user id.
    client_ip = req.client.host if req.client else "unknown"
    check_rate_limit(f"contact:{client_ip}", CONTACT_RATE_LIMIT, CONTACT_RATE_LIMIT_WINDOW_SECONDS)

    pool = get_db()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not connected.")

    await pool.execute(
        'INSERT INTO "ContactMessage" (id, first_name, last_name, email, message, created_at)'
        " VALUES ($1, $2, $3, $4, $5, NOW())",
        str(uuid.uuid4()), request.first_name, request.last_name, request.email, request.message,
    )

    return {"status": "success"}
