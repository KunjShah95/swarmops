from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Run, AgentMessage, AgentState
from swarm import swarm_orchestrator
import asyncio
import uuid
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()


class IssueRequest(BaseModel):
    """Request to trigger agent swarm on a GitHub issue."""

    github_url: str  # e.g., "https://github.com/owner/repo/issues/42"
    repo: str  # e.g., "owner/repo"
    issue_number: int


@router.post("/issues")
async def trigger_swarm(request: IssueRequest, db: Session = Depends(get_db)):
    """Trigger agent swarm to fix a GitHub issue."""

    # Generate unique run ID
    run_id = str(uuid.uuid4())

    # Create run record
    run = Run(
        id=run_id,
        github_issue_url=request.github_url,
        github_repo=request.repo,
        issue_number=request.issue_number,
        status="pending",
        current_agent="orchestrator",
    )
    db.add(run)

    # Initialize agent states
    agents = [
        "orchestrator",
        "planner",
        "code_writer",
        "test_runner",
        "security_auditor",
        "pr_opener",
    ]

    for agent_name in agents:
        agent_state = AgentState(
            id=str(uuid.uuid4()), run_id=run_id, agent_name=agent_name, status="idle"
        )
        db.add(agent_state)

    db.commit()

    # Start agent swarm in a separate background thread to prevent blocking the
    # main event loop thread with blocking operations (like PyGithub and LLM chat).
    import threading

    def run_swarm_in_thread():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(
                swarm_orchestrator.execute(run_id, request.repo, request.issue_number)
            )
        except Exception as exc:
            # Last-resort catch: if swarm_orchestrator.execute() itself throws
            # (e.g. before its own try/except kicks in), mark the run as failed
            # in the DB so the SSE stream sees it.
            print(f"[FAIL] Unhandled exception in swarm thread: {exc}")
            try:
                from database import SessionLocal
                fail_db = SessionLocal()
                run_record = fail_db.query(Run).filter(Run.id == run_id).first()
                if run_record:
                    run_record.status = "failed"
                    run_record.error = f"Unhandled thread exception: {exc}"
                    fail_db.commit()
                fail_db.close()
            except Exception as db_err:
                print(f"[FAIL] Could not update run status after failure: {db_err}")
        finally:
            loop.close()

    threading.Thread(target=run_swarm_in_thread, daemon=True).start()

    return {
        "run_id": run_id,
        "status": "started",
        "message": "Agent swarm initiated",
        "issue_url": request.github_url,
    }


@router.get("/issues/{run_id}")
async def get_run_status(run_id: str, db: Session = Depends(get_db)):
    """Get status of a specific agent run."""
    run = db.query(Run).filter(Run.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # Get agent states
    agent_states = db.query(AgentState).filter(AgentState.run_id == run_id).all()

    return {
        "run_id": run.id,
        "status": run.status,
        "current_agent": run.current_agent,
        "pr_url": run.pr_url,
        "created_at": run.created_at,
        "completed_at": run.completed_at,
        "agents": [
            {
                "name": state.agent_name,
                "status": state.status,
                "confidence": state.confidence,
            }
            for state in agent_states
        ],
    }
