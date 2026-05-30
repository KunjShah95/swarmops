from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Run

router = APIRouter()


@router.get("/prs/{run_id}")
async def get_pr_details(run_id: str, db: Session = Depends(get_db)):
    """Get PR details for a completed agent run."""
    run = db.query(Run).filter(Run.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if not run.pr_url:
        raise HTTPException(status_code=404, detail="No PR created yet for this run")

    return {
        "run_id": run.id,
        "pr_url": run.pr_url,
        "status": run.status,
        "created_at": run.created_at,
        "completed_at": run.completed_at,
    }


@router.get("/prs")
async def list_prs(limit: int = 10, offset: int = 0, db: Session = Depends(get_db)):
    """List all created PRs."""
    runs = (
        db.query(Run)
        .filter(Run.pr_url.isnot(None))
        .order_by(Run.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "prs": [
            {
                "run_id": run.id,
                "pr_url": run.pr_url,
                "issue_url": run.github_issue_url,
                "repo": run.github_repo,
                "created_at": run.created_at,
            }
            for run in runs
        ],
        "total": len(runs),
    }
