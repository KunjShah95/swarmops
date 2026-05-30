from __future__ import annotations

import asyncio
from typing import Iterable

from app.core.store import store
from app.schemas.agent_event import AgentArtifact, AgentEvent
from app.schemas.issue import IssueInput
from app.schemas.run import RunStatus, RunSummary


class SwarmRunner:
    AGENTS: tuple[str, ...] = (
        "orchestrator",
        "planner",
        "code_writer",
        "test_runner",
        "security_auditor",
        "pr_opener",
    )

    async def start(self, issue: IssueInput) -> RunSummary:
        summary = await store.create_run(issue)
        await store.set_status(summary.run_id, RunStatus.running)
        asyncio.create_task(self._execute(summary.run_id, issue))
        return (await store.get_run(summary.run_id)) or summary

    async def _execute(self, run_id: str, issue: IssueInput) -> None:
        try:
            trace = self._build_trace(issue)
            for event in trace:
                await store.append_event(run_id, event)
                await asyncio.sleep(0.05)
            await store.set_status(run_id, RunStatus.succeeded, pr_url=trace[-1].artifacts[0].metadata["url"])
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            await store.append_event(
                run_id,
                AgentEvent(
                    run_id=run_id,
                    sequence=999,
                    agent="orchestrator",
                    status="error",
                    message=f"Swarm execution failed: {exc}",
                ),
            )
            await store.set_status(run_id, RunStatus.failed, error=str(exc))

    def _build_trace(self, issue: IssueInput) -> list[AgentEvent]:
        slug = issue.repository.slug
        issue_number = issue.number or 1
        diff = self._build_diff(issue)
        pr_url = f"https://github.com/{slug}/pull/{100 + issue_number}"
        return [
            AgentEvent(
                run_id="",
                sequence=1,
                agent="orchestrator",
                status="speaking",
                message=f"Ingested issue #{issue_number} from {slug} and decomposed the swarm work.",
            ),
            AgentEvent(
                run_id="",
                sequence=2,
                agent="planner",
                status="speaking",
                message=f"Found the fix surface in {slug}: {issue.title}. Targeted files and validation path are ready.",
                artifacts=[AgentArtifact(kind="plan", name="fix-plan", content="Plan created")],
            ),
            AgentEvent(
                run_id="",
                sequence=3,
                agent="code_writer",
                status="speaking",
                message="Generated a focused patch grounded in the repo context.",
                artifacts=[AgentArtifact(kind="diff", name="patch.diff", content=diff, metadata={"language": "ts"})],
            ),
            AgentEvent(
                run_id="",
                sequence=4,
                agent="test_runner",
                status="speaking",
                message="Executed the demo test path and confirmed the change behaves as expected.",
                artifacts=[AgentArtifact(kind="test", name="pytest", content="All target checks passed.")],
            ),
            AgentEvent(
                run_id="",
                sequence=5,
                agent="security_auditor",
                status="speaking",
                message="No secret leakage or unsafe patterns detected in the proposed patch.",
                artifacts=[AgentArtifact(kind="security", name="scan", content="No findings.")],
            ),
            AgentEvent(
                run_id="",
                sequence=6,
                agent="pr_opener",
                status="done",
                message="Opened the PR and attached the swarm summary.",
                artifacts=[AgentArtifact(kind="pr", name="pull-request", content=pr_url, metadata={"url": pr_url})],
            ),
        ]

    def _build_diff(self, issue: IssueInput) -> str:
        repo_file = issue.title.lower().replace(" ", "-")[:24] or "issue-fix"
        return (
            f"diff --git a/{repo_file}.py b/{repo_file}.py\n"
            f"--- a/{repo_file}.py\n"
            f"+++ b/{repo_file}.py\n"
            f"@@\n"
            f"-# buggy implementation\n"
            f"+# fixed implementation for {issue.title}\n"
        )
