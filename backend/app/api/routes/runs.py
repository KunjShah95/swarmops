from fastapi import APIRouter, HTTPException, status

from app.core.store import store
from app.schemas.issue import RunRequest
from app.services.swarm import SwarmRunner

router = APIRouter()
runner = SwarmRunner()


@router.post("/runs", status_code=status.HTTP_202_ACCEPTED)
async def start_run(payload: RunRequest) -> dict[str, object]:
    summary = await runner.start(payload.issue)
    return {"run": summary.model_dump(mode="json")}


@router.get("/runs")
async def list_runs() -> dict[str, object]:
    runs = await store.list_runs()
    return {"runs": [run.model_dump(mode="json") for run in runs]}


@router.get("/runs/{run_id}")
async def get_run(run_id: str) -> dict[str, object]:
    summary = await store.get_run(run_id)
    if summary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return {"run": summary.model_dump(mode="json")}
