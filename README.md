<div align="center">
  <img src="frontend/public/logo.png" alt="DevLeap AI Logo" width="120" />

  # DevLeap AI

  **Your commits already made the case.**

  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://gsap.com/)
</div>

---

## 🚀 Overview

**DevLeap AI** reads your GitHub repositories — not your résumé — and builds a technical profile from the source itself: skills with the exact file they're evidenced in, architecture diagrams, and a recruiter-ready summary. Point it at a job posting and it drafts outreach that cites the specific code behind every claim, then waits for you to approve it. Nothing is sent automatically.

### ✨ Key Features

- **🧠 Repository Ingestion:** Clones a public GitHub repo (or a whole profile), sends the source to an LLM, and extracts skills, Mermaid architecture diagrams, and a plain-language summary — each claim tied to the file it came from.
- **🎯 Job Matching & Pitch Drafting:** Paste a job URL and the broker agent reads the live posting and drafts a pitch grounded in your profile. "Find jobs for me" uses live web search (Tavily/SearXNG/Brave) to surface roles worth pitching.
- **📊 Dashboard:** Profiles, drafted pitches, and history in one place, all gated behind Clerk auth.
- **💳 Billing:** Stripe Checkout + webhooks for the Pro Broker tier (unlimited repos, live job matching, higher pitch budget).
- **✉️ Contact Form:** Public, unauthenticated endpoint with IP-based rate limiting, backed by its own table.
- **🚦 Rate Limiting:** Sliding-window limits per user/IP on ingestion, broker actions, and the contact form so no single account can exhaust the LLM budget.
- **🎬 Smooth Scroll:** GSAP `ScrollSmoother` + `ScrollTrigger` drive inertia scrolling, parallax, and reveal-on-scroll across the marketing pages (skipped entirely under `prefers-reduced-motion`).

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS v4 + custom CSS variables (light/dark themes)
- **Animation:** GSAP (`ScrollTrigger`, `ScrollSmoother`)
- **Authentication:** Clerk
- **Payments:** Stripe Checkout (client-side redirect)
- **Diagrams:** Mermaid.js (renders the architecture diagrams the backend generates)

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database Access:** `asyncpg` running raw SQL against PostgreSQL — Prisma is used only for schema authoring and migrations (`prisma migrate`), not as a runtime client
- **LLM:** Any OpenAI-compatible endpoint via the `openai` SDK — developed against a local model served by [LM Studio](https://lmstudio.ai/), not a hosted provider by default
- **Web Search:** Tavily, SearXNG, or Brave (configurable), used to power live job discovery
- **Auth:** Clerk JWT verification (`PyJWT` + JWKS)
- **Payments:** `stripe` Python SDK

---

## 📦 Project Structure

```text
DevLeap-AI/
├── frontend/                     # Next.js web application
│   ├── src/app/                  # Marketing pages (/, about, pricing, contact) + a
│   │                              #   (dashboard) route group (dashboard, profiler, broker, history, profile)
│   ├── src/components/           # Navigation, Footer, SmoothScroll, PitchReviewUI, etc.
│   ├── src/lib/                  # api.ts (backend client), theme, scroll-reveal hook
│   └── public/                   # Static assets & logo
│
└── backend/                      # FastAPI python application
    ├── main.py                   # App entrypoint, router registration, /health
    ├── core/                     # Config, auth (Clerk), LLM client, rate limiting, web search
    ├── profiler/                 # GitHub cloning + ingestion → developer profile
    ├── broker/                   # Job matching + pitch drafting
    ├── billing/                  # Stripe checkout + webhook handling
    ├── contact/                  # Public contact form endpoint
    ├── users/                    # Current-user/dashboard data
    ├── prisma/                   # schema.prisma + migrations (schema management only)
    ├── tests/                    # pytest suite
    └── requirements.txt
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+) and Python (v3.10+)
- A PostgreSQL database (see [Database Setup](#1-database-setup))
- Accounts/API keys: [Clerk](https://clerk.com/) (auth), [Stripe](https://stripe.com/) (billing), a search provider such as [Tavily](https://tavily.com/) (job discovery)
- An OpenAI-compatible LLM endpoint — either a hosted provider, or [LM Studio](https://lmstudio.ai/) running locally with a model loaded

### 1. Database Setup
```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL and the rest — see Environment Variables below
npx prisma migrate dev
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```
Check `http://localhost:8000/health` — it reports whether the DB, LLM, and search provider are all reachable.

### 3. Frontend Setup
```bash
cd frontend
cp .env.local.example .env.local   # fill in Clerk + Stripe publishable keys
npm install
npm run dev
```
The frontend runs at `http://localhost:3000` and expects the backend at `http://localhost:8000` unless `NEXT_PUBLIC_API_URL` says otherwise.

### Environment Variables

**`backend/.env`**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (asyncpg reads it directly) |
| `CLERK_SECRET_KEY`, `CLERK_FRONTEND_API` | Clerk JWT verification |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Billing + webhook signature verification |
| `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` | Any OpenAI-compatible endpoint (defaults target a local LM Studio server) |
| `SEARCH_PROVIDER`, `TAVILY_API_KEY` / `BRAVE_API_KEY` / `SEARXNG_URL` | Powers "Find jobs for me"; `SEARCH_PROVIDER=none` disables it honestly rather than letting the model invent postings |
| `FRONTEND_URL` | Allowed CORS origin for the deployed frontend |
| `INGEST_RATE_LIMIT`, `BROKER_RATE_LIMIT`, `CONTACT_RATE_LIMIT` (+ `*_WINDOW_SECONDS`) | Per-scope rate limit tuning |

**`frontend/.env.local`**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Checkout redirect |
| `NEXT_PUBLIC_API_URL` | Backend base URL — **required** once the backend isn't on `localhost:8000` |

### Running Tests
```bash
cd backend
pytest
```
(The frontend doesn't have a test suite yet.)

---

## 🌍 Deployment

The reference deployment:

1. **Database:** Postgres hosted on [Prisma Postgres](https://www.prisma.io/postgres) (or any managed Postgres — `asyncpg` doesn't care).
2. **Backend:** Render, built from `backend/Dockerfile` as a Docker web service. Set every variable from the table above in Render's Environment tab, plus `PORT` is provided automatically. Health check path: `/health`.
3. **Frontend:** Vercel, with `NEXT_PUBLIC_API_URL` pointed at the Render service (`NEXT_PUBLIC_*` vars are baked in at build time — changing one requires a redeploy, not just a restart).

**A real caveat:** if your LLM is a local LM Studio instance rather than a hosted API, the deployed backend can't reach `localhost` — you need to expose it via a tunnel (e.g. `cloudflared tunnel --url http://localhost:1234`) and point the deployed `LLM_BASE_URL` at the tunnel's public URL. Quick tunnels issue a new URL every restart and require your machine + LM Studio to stay running, so treat this as a demo setup, not a production one — swap in a hosted OpenAI-compatible provider for anything real.

---

<div align="center">
  Built by ZeonArc.
</div>
