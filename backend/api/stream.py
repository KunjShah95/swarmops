from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models import AgentMessage, Run, AgentState
import json
import asyncio
import time

router = APIRouter()


def _fetch_updates(run_id: str, last_sequence: int, last_status_updates: dict):
    """
    Fetch new messages and state changes using a FRESH DB session each call.

    This is critical because the swarm runs in a background thread with its own
    SQLAlchemy session.  SQLite's default isolation level means one session's
    committed writes may not be visible to another session unless we open a new
    session (or enable autocommit).
    """
    db = SessionLocal()
    try:
        run = db.query(Run).filter(Run.id == run_id).first()
        tokens_used = run.tokens_used if run else 0
        estimated_cost = run.estimated_cost if run else 0.0

        # Poll for agent state changes (status updates)
        status_changes = []
        agent_states = db.query(AgentState).filter(AgentState.run_id == run_id).all()
        for state in agent_states:
            prev = last_status_updates.get(state.agent_name)
            if prev != state.status:
                last_status_updates[state.agent_name] = state.status
                status_changes.append(
                    {
                        "event": "status",
                        "agent": state.agent_name,
                        "status": state.status,
                        "tokens_used": tokens_used,
                        "estimated_cost": estimated_cost,
                    }
                )

        # Poll for new messages
        new_messages = []
        messages = (
            db.query(AgentMessage)
            .filter(AgentMessage.run_id == run_id, AgentMessage.sequence > last_sequence)
            .order_by(AgentMessage.sequence)
            .all()
        )
        for msg in messages:
            parsed_data = json.loads(msg.data) if msg.data else None
            new_messages.append(
                {
                    "event": "message",
                    "agent": msg.agent_name,
                    "content": msg.content,
                    "type": msg.message_type,
                    "data": parsed_data,
                    "sequence": msg.sequence,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                    "tokens_used": tokens_used,
                    "estimated_cost": estimated_cost,
                }
            )

        # Check if run is complete
        completion = None
        if run and run.status in ["completed", "failed"]:
            completion = {
                "event": "done",
                "status": run.status,
                "pr_url": run.pr_url,
                "error": run.error,
                "tokens_used": tokens_used,
                "estimated_cost": estimated_cost,
            }

        return status_changes, new_messages, completion
    finally:
        db.close()


@router.get("/stream/{run_id}")
async def stream_agent_messages(run_id: str):
    """Stream agent messages and status changes in real-time using SSE."""

    async def event_generator():
        last_sequence = 0
        last_status_updates: dict = {}
        max_wait_time = 300
        start_time = time.time()

        while True:
            if time.time() - start_time > max_wait_time:
                yield f"data: {json.dumps({'event': 'timeout', 'message': 'Stream timed out'})}\n\n"
                break

            # Use a fresh DB session each iteration to see committed writes from
            # the background swarm thread.
            status_changes, new_messages, completion = _fetch_updates(
                run_id, last_sequence, last_status_updates
            )

            for ev in status_changes:
                yield f"data: {json.dumps(ev)}\n\n"

            for msg_data in new_messages:
                yield f"data: {json.dumps(msg_data)}\n\n"
                if msg_data["sequence"] > last_sequence:
                    last_sequence = msg_data["sequence"]

            if completion:
                yield f"data: {json.dumps(completion)}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
