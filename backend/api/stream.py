from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import AgentMessage, Run
import json
import asyncio
import time

router = APIRouter()


@router.get("/stream/{run_id}")
async def stream_agent_messages(run_id: str, db: Session = Depends(get_db)):
    """Stream agent messages in real-time using Server-Sent Events (SSE)."""

    async def event_generator():
        """Generate SSE events for agent messages."""
        last_sequence = 0
        max_wait_time = 300  # 5 minutes timeout
        start_time = time.time()

        while True:
            # Check for timeout
            if time.time() - start_time > max_wait_time:
                yield f"data: {json.dumps({'event': 'timeout', 'message': 'Stream timed out'})}\n\n"
                break

            # Get new messages since last poll
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
                # Send completion event
                completion_data = {
                    "event": "done",
                    "status": run.status,
                    "pr_url": run.pr_url,
                    "error": run.error,
                }
                yield f"data: {json.dumps(completion_data)}\n\n"
                break

            # Wait before next poll
            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering if applicable
        },
    )
