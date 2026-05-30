import pytest

from app.core.store import store
from app.schemas.agent_event import AgentEvent
from app.schemas.issue import IssueInput, RepositoryRef


@pytest.mark.asyncio
async def test_store_records_events():
    issue = IssueInput(title="Test", body="Body", number=1, repository=RepositoryRef(owner="a", name="b"))
    run = await store.create_run(issue)
    await store.append_event(
        run.run_id,
        AgentEvent(run_id=run.run_id, sequence=1, agent="planner", status="speaking", message="hello"),
    )
    fetched = await store.get_run(run.run_id)
    assert fetched is not None
    assert fetched.event_count == 1
