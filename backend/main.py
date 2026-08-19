from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from billing.router import router as billing_router
from broker.router import router as broker_router
from contact.router import router as contact_router
from core.config import CORS_ORIGINS, SEARCH_PROVIDER
from core.llm import llm_status
from core.websearch import search_available
from db import connect_db, disconnect_db, get_db
from profiler.router import router as profiler_router
from users.router import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(title="DevLeap AI - Unified Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiler_router)
app.include_router(broker_router)
app.include_router(billing_router)
app.include_router(users_router)
app.include_router(contact_router)


@app.get("/health")
async def health_check():
    llm = await llm_status()
    return {
        "status": "healthy",
        "llm_reachable": llm["reachable"],
        "llm_model_loaded": llm["model_loaded"],
        "llm_model": llm["model"],
        "search_provider": SEARCH_PROVIDER,
        "search_configured": search_available(),
        "db_connected": get_db() is not None,
        "version": "0.6.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
