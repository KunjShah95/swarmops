from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import AgentMessage, Run, AgentState
import json
import asyncio
import time

router = APIRouter()


@router.get("/stream/{run_id}")
async def stream_agent_messages(run_id: str, db: Session = Depends(get_db)):
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

            # Poll for agent state changes (status updates)
            agent_states = db.query(AgentState).filter(AgentState.run_id == run_id).all()
            for state in agent_states:
                prev = last_status_updates.get(state.agent_name)
                if prev != state.status:
                    last_status_updates[state.agent_name] = state.status
                    status_data = {
                        "event": "status",
                        "agent": state.agent_name,
                        "status": state.status,
                    }
                    yield f"data: {json.dumps(status_data)}\n\n"

            # Poll for new messages
            messages = (
                db.query(AgentMessage)
                .filter(AgentMessage.run_id == run_id, AgentMessage.sequence > last_sequence)
                .order_by(AgentMessage.sequence)
                .all()
            )

            for msg in messages:
                parsed_data = json.loads(msg.data) if msg.data else None
                event_data = {
                    "event": "message",
                    "agent": msg.agent_name,
                    "content": msg.content,
                    "type": msg.message_type,
                    "data": parsed_data,
                    "sequence": msg.sequence,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                }
                yield f"data: {json.dumps(event_data)}\n\n"
                last_sequence = msg.sequence

            # Check if run is complete
            run = db.query(Run).filter(Run.id == run_id).first()
            if run and run.status in ["completed", "failed"]:
                completion_data = {
                    "event": "done",
                    "status": run.status,
                    "pr_url": run.pr_url,
                    "error": run.error,
                }
                yield f"data: {json.dumps(completion_data)}\n\n"
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
