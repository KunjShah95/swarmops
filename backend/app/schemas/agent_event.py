from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field

AgentStatus = Literal["thinking", "speaking", "waiting", "done", "error"]


class AgentArtifact(BaseModel):
    kind: str
    name: str
    content: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AgentEvent(BaseModel):
    run_id: str
    sequence: int
    agent: str
    status: AgentStatus
    message: str
    artifacts: list[AgentArtifact] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
