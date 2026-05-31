from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

# Import routers
from api.issues import router as issues_router
from api.stream import router as stream_router
from api.prs import router as prs_router
from api.runs import router as runs_router
from database import init_db
from config import get_settings, get_cors_origins
from services.llm import get_llm_service

settings = get_settings()

app = FastAPI(
    title="SwarmOps API",
    description="Autonomous DevOps Agent Swarm Backend",
    version="1.0.0",
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


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    print("[OK] Database initialized")


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
