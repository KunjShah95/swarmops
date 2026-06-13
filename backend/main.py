from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import json
import os

# Import routers
from api.issues import router as issues_router
from api.stream import router as stream_router
from api.prs import router as prs_router
from api.runs import router as runs_router
from database import init_db
from config import get_settings, get_cors_origins
from services.llm import get_llm_service

settings = get_settings()

# ── Startup diagnostics ──────────────────────────────────────────────
def _log_startup_warnings():
    """Print warnings if critical config is missing."""
    llm = get_llm_service()

    if not settings.github_token:
        print(
            "[WARN]  GITHUB_TOKEN is not set. "
            "GitHub API calls will use unauthenticated requests (60/hr rate limit). "
            "Set it in .env or your environment."
        )
    if not llm.is_available:
        print(
            "[WARN]  No LLM provider configured. "
            "All agent output will use smart fallback (mock data). "
            "Set LLM_PROVIDER and at least one API key in .env (in project root)."
        )
    if not os.path.exists(".env") and not os.path.exists("../.env"):
        print(
            "[INFO]  No .env file found. "
            "Create one in the PROJECT ROOT from .env.example:\n"
            "         copy .env.example .env"
        )
    print(f"[OK]    LLM service available: {llm.is_available}")
    print(f"[OK]    GitHub configured: {bool(settings.github_token)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and log diagnostics on startup."""
    init_db()
    print("[OK] Database initialized")
    _log_startup_warnings()
    yield


app = FastAPI(
    title="SwarmOps API",
    description="Autonomous DevOps Agent Swarm Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - allows frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(issues_router, prefix="/api")
app.include_router(stream_router, prefix="/api")
app.include_router(prs_router, prefix="/api")
app.include_router(runs_router, prefix="/api")


@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers and Docker."""
    llm = get_llm_service()
    return {
        "status": "ok",
        "service": "swarmops-backend",
        "version": "1.0.0",
        "llm": {
            "available": llm.is_available,
            "providers": llm.providers,
            "mode": "live" if llm.is_available else "fallback",
        },
        "github_configured": bool(settings.github_token),
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to SwarmOps API", "docs": "/docs", "health": "/health"}
