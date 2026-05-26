# Stripe Sandbox Setup Guide

To fully test the checkout flow, you need to use the Stripe CLI to forward events to your local backend.

## Prerequisites
1. Download and install the [Stripe CLI](https://docs.stripe.com/stripe-cli).
2. Login to the CLI:
   ```bash
   stripe login
   ```

## 1. Run the Webhook Forwarder
In a new terminal window, tell Stripe to forward events to your FastAPI backend:

```bash
stripe listen --forward-to localhost:8000/api/v1/billing/webhook
```

**Important**: The output will contain a Webhook Secret that looks like `whsec_...`. Copy this value!

## 2. Update Environment Variables
Update your `backend/.env` file with the secret you just got:

```
STRIPE_WEBHOOK_SECRET=whsec_your_copied_secret
```

## 3. Test a Payment
Now you can go to the Frontend pricing page (`/pricing`) and click **Upgrade to Pro**.
Use the following test card details when you reach the Stripe Checkout page:
- **Card number**: `4242 4242 4242 4242`
- **MM/YY**: Any future date (e.g. `12/30`)
- **CVC**: Any 3 digits (e.g. `123`)

## 4. Trigger Events Manually (Optional)
If you just want to test your webhook handler without using the frontend checkout, you can trigger events directly from the CLI:

```bash
stripe trigger checkout.session.completed
```
