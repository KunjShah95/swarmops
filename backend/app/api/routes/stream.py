from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.core.store import store

router = APIRouter()


@router.get("/stream/{run_id}")
async def stream_run(run_id: str) -> StreamingResponse:
    summary = await store.get_run(run_id)
    if summary is None:
        raise HTTPException(status_code=404, detail="Run not found")

    async def event_generator():
        for event in await store.snapshot_events(run_id):
            yield f"data: {event.model_dump_json()}\n\n"

        queue = await store.subscribe(run_id)
        try:
            while True:
                event = await queue.get()
                yield f"data: {event.model_dump_json()}\n\n"
                if event.status in {"done", "error"}:
                    break
        finally:
            await store.unsubscribe(run_id, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
