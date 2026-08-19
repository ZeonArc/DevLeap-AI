import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from core.auth import ensure_user_exists, verify_clerk_token
from core.config import FRONTEND_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
from db import get_db

stripe.api_key = STRIPE_SECRET_KEY

router = APIRouter(prefix="/api/v1/billing", tags=["billing"])


class CheckoutSessionRequest(BaseModel):
    user_id: str
    plan_id: str = "price_pro_broker"


@router.post("/create-checkout-session")
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
            success_url=f"{FRONTEND_URL}/dashboard?success=true",
            cancel_url=f"{FRONTEND_URL}/pricing?canceled=true",
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
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
