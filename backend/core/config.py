import os

from dotenv import load_dotenv

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
CORS_ORIGINS = list({"http://localhost:3000", "http://127.0.0.1:3000", FRONTEND_URL})

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

CLERK_FRONTEND_API = os.getenv("CLERK_FRONTEND_API", "actual-elephant-79.clerk.accounts.dev")
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

# ── Local LLM (LM Studio) ────────────────────────────────────────────────
# LM Studio exposes an OpenAI-compatible server, so any OpenAI-style client
# works against it. The API key is required by the protocol but ignored by
# LM Studio itself.
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:1234/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "lm-studio")
LLM_MODEL = os.getenv("LLM_MODEL", "google/gemma-4-e2b")

# Requests to a local model are CPU/GPU bound and far slower than a hosted
# API, so the timeout is generous.
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "600"))

# Repository text sent to the model, in characters. gemma-4-e2b advertises a
# 131k-token window, but a small quantised model degrades badly when the
# context is actually filled — and the answer still needs room. ~120k chars
# is roughly 30k tokens, which leaves plenty of headroom.
LLM_MAX_INPUT_CHARS = int(os.getenv("LLM_MAX_INPUT_CHARS", "120000"))

# ── Web search ───────────────────────────────────────────────────────────
# A local model has no web access, so job discovery needs a real search
# backend. "none" disables the feature honestly rather than letting the
# model invent postings.
SEARCH_PROVIDER = os.getenv("SEARCH_PROVIDER", "none").strip().lower()

SEARXNG_URL = os.getenv("SEARXNG_URL", "http://localhost:8888").rstrip("/")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
BRAVE_API_KEY = os.getenv("BRAVE_API_KEY")

SEARCH_TIMEOUT_SECONDS = float(os.getenv("SEARCH_TIMEOUT_SECONDS", "20"))

# Characters of fetched job-posting text handed to the model.
JOB_PAGE_MAX_CHARS = int(os.getenv("JOB_PAGE_MAX_CHARS", "20000"))

# Ingestion (git clone + a long local inference run) is the most expensive
# operation in the app, so it gets the tighter default budget.
INGEST_RATE_LIMIT = int(os.getenv("INGEST_RATE_LIMIT", "5"))
INGEST_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("INGEST_RATE_LIMIT_WINDOW_SECONDS", "3600"))

# Broker endpoints (draft-pitch, jobs/find, match) also run inference.
BROKER_RATE_LIMIT = int(os.getenv("BROKER_RATE_LIMIT", "20"))
BROKER_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("BROKER_RATE_LIMIT_WINDOW_SECONDS", "3600"))

# The contact form is public (no Clerk session), so it's keyed by IP rather
# than user id and kept tight -- there's no legitimate reason to submit it
# often.
CONTACT_RATE_LIMIT = int(os.getenv("CONTACT_RATE_LIMIT", "5"))
CONTACT_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("CONTACT_RATE_LIMIT_WINDOW_SECONDS", "3600"))
