from datetime import datetime, timezone
from enum import StrEnum

from pydantic import BaseModel, Field

from app.schemas.issue import IssueInput


class RunStatus(StrEnum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"


class RunSummary(BaseModel):
    run_id: str
    status: RunStatus
    issue: IssueInput
    current_agent: str | None = None
    pr_url: str | None = None
    diff: str | None = None
    error: str | None = None
    event_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
