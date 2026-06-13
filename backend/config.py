from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # LLM Provider priority list (comma-separated).
    # Tries providers in order: "openrouter,groq,gemini" or single like "gemini"
    # Supported: openrouter, groq, gemini, azure, bedrock
    llm_provider: str = ""

    # GitHub
    github_token: str = ""

    # --- OpenRouter (OpenAI-compatible, many models) ---
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o"

    # --- Groq (fast inference) ---
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-70b-versatile"

    # --- Google Gemini ---
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # --- Azure OpenAI (legacy) ---
    azure_openai_endpoint: str = ""
    azure_openai_key: str = ""
    azure_openai_deployment: str = "gpt-4o"

    # --- AWS Bedrock (legacy) ---
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    bedrock_model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"

    # Database
    database_url: str = "sqlite:///swarmops.db"

    # Backend
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # Frontend (for CORS)
    frontend_url: str = "http://localhost:3000"
    # Comma-separated allowed origins (production). Falls back to frontend_url if empty.
    cors_origins: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


# Common local-dev and Docker origins that should always be allowed.
_DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:80",
]


def get_cors_origins() -> list[str]:
    """Resolve CORS allowlist from CORS_ORIGINS or FRONTEND_URL."""
    settings = get_settings()
    if settings.cors_origins.strip():
        origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    else:
        origins = [settings.frontend_url]
    # Merge with defaults, de-duplicate while preserving order.
    seen: set[str] = set()
    merged: list[str] = []
    for o in origins + _DEFAULT_ORIGINS:
        if o not in seen:
            seen.add(o)
            merged.append(o)
    return merged
