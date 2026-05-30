from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Autonomous DevOps Swarm"
    app_version: str = "0.1.0"
    api_prefix: str = "/api"
    cors_origins: List[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    demo_repo_url: str = "https://github.com/example/demo-repo"
    github_token: str | None = None
    azure_openai_endpoint: str | None = None
    azure_openai_api_key: str | None = None
    azure_openai_deployment: str = "gpt-4o"
    azure_ai_search_endpoint: str | None = None
    azure_ai_search_api_key: str | None = None
    azure_ai_search_index: str | None = None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
