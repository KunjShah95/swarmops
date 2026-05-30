from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4

from app.schemas.agent_event import AgentEvent
from app.schemas.issue import IssueInput
from app.schemas.run import RunStatus, RunSummary


@dataclass
class RunRecord:
    summary: RunSummary
    events: list[AgentEvent] = field(default_factory=list)
    subscribers: list[asyncio.Queue[AgentEvent]] = field(default_factory=list)


class RunStore:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._runs: dict[str, RunRecord] = {}

    async def create_run(self, issue: IssueInput) -> RunSummary:
        async with self._lock:
            run_id = uuid4().hex
            summary = RunSummary(run_id=run_id, status=RunStatus.queued, issue=issue)
            self._runs[run_id] = RunRecord(summary=summary)
            return summary

    async def get_run(self, run_id: str) -> RunSummary | None:
        async with self._lock:
            record = self._runs.get(run_id)
            return None if record is None else record.summary

    async def list_runs(self) -> list[RunSummary]:
        async with self._lock:
            return [record.summary for record in self._runs.values()]

    async def append_event(self, run_id: str, event: AgentEvent) -> None:
        async with self._lock:
            record = self._runs[run_id]
            record.events.append(event)
            record.summary.current_agent = event.agent
            record.summary.event_count = len(record.events)
            record.summary.updated_at = datetime.now(timezone.utc)
            if event.status == "done" and record.summary.status == RunStatus.running:
                record.summary.status = RunStatus.succeeded
            if event.status == "error":
                record.summary.status = RunStatus.failed
            for subscriber in list(record.subscribers):
                subscriber.put_nowait(event)

    async def set_status(self, run_id: str, status: RunStatus, **updates: object) -> None:
        async with self._lock:
            record = self._runs[run_id]
            record.summary.status = status
            for key, value in updates.items():
                if hasattr(record.summary, key):
                    setattr(record.summary, key, value)
            record.summary.updated_at = datetime.now(timezone.utc)

    async def snapshot_events(self, run_id: str) -> list[AgentEvent]:
        async with self._lock:
            return list(self._runs[run_id].events)

    async def subscribe(self, run_id: str) -> asyncio.Queue[AgentEvent]:
        queue: asyncio.Queue[AgentEvent] = asyncio.Queue()
        async with self._lock:
            self._runs[run_id].subscribers.append(queue)
        return queue

    async def unsubscribe(self, run_id: str, queue: asyncio.Queue[AgentEvent]) -> None:
        async with self._lock:
            record = self._runs.get(run_id)
            if record and queue in record.subscribers:
                record.subscribers.remove(queue)


store = RunStore()
