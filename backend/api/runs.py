from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Run

router = APIRouter()


@router.get("/runs")
async def list_runs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Run).order_by(Run.created_at.desc())
    if status:
        query = query.filter(Run.status == status)
    total = query.count()
    runs = query.offset(offset).limit(limit).all()
    return {
        "runs": [
            {
                "run_id": r.id,
                "issue_url": r.github_issue_url,
                "repo": r.github_repo,
                "issue_number": r.issue_number,
                "status": r.status,
                "current_agent": r.current_agent,
                "pr_url": r.pr_url,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            }
            for r in runs
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/runs/stats")
async def get_run_stats(db: Session = Depends(get_db)):
    total = db.query(Run).count()
    completed = db.query(Run).filter(Run.status == "completed").count()
    failed = db.query(Run).filter(Run.status == "failed").count()
    running = db.query(Run).filter(Run.status == "running").count()
    return {"total": total, "completed": completed, "failed": failed, "running": running}
