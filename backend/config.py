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
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
