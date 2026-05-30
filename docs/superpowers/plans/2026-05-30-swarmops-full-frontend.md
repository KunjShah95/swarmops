# SwarmOps Full Frontend Implementation Plan

**Goal:** Build complete frontend with 10 pages (landing through settings) in minimal enterprise style

**Architecture:** Feature-based React SPA with lazy loading, React Router, shared Layout component, existing Zustand store

**Tech Stack:** React 18, Vite, Tailwind CSS, Zustand, React Router v6, Monaco Editor

## File Structure

```
frontend/src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router setup
├── index.css                   # Tailwind + theme
├── Layout.tsx                  # Shared layout (Nav + Footer)
├── pages/
│   ├── Landing.tsx             # Marketing page (hero, features, how it works, CTA)
│   ├── Dashboard.tsx           # Main app (existing code moved here)
│   ├── History.tsx             # Runs list
│   ├── RunDetail.tsx           # Single run detail
│   ├── PRs.tsx                 # PR history
│   ├── Pricing.tsx             # Pricing tiers
│   ├── Login.tsx               # Sign in
│   ├── Signup.tsx              # Sign up
│   ├── Docs.tsx                # Documentation
│   ├── About.tsx               # Team / hackathon info
│   └── Settings.tsx            # User settings
├── store/
│   └── agentStore.ts           # Existing - add runs history
├── hooks/
│   └── useAgentStream.ts       # Existing
└── components/                 # Existing shared components
    ├── AgentChat.tsx
    ├── AgentCard.tsx
    ├── DiffViewer.tsx
    ├── TestResults.tsx
    ├── SecurityReport.tsx
    └── PRStatus.tsx

backend/
├── api/
│   ├── runs.py                 # NEW: GET /api/runs, GET /api/runs/stats
├── main.py                     # Add runs router
```

---

### Phase 1A: Backend APIs

**Files:**
- Create: `backend/api/runs.py`
- Modify: `backend/main.py`

Add `GET /api/runs` (list all runs with pagination, status filter) and `GET /api/runs/stats` (total runs, success rate, avg time).

```python
# backend/api/runs.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
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
```

### Phase 1B: Frontend Foundation (Router + Layout)

**Files:**
- Install: `react-router-dom`
- Create/Modify: `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/Layout.tsx`, `frontend/src/index.css`

Set up React Router with lazy-loaded pages and a shared Layout (Nav bar + Footer). Nav items: Features, Pricing, Docs, Sign In, Get Started (CTA). Dashboard route is protected.

### Phase 2 (parallel sub-agents):

**Page implementations:**
- Landing.tsx: Hero with animated grid bg, "GitHub Issue -> Fixed PR. Zero Humans." tagline, features grid, how-it-works flow, CTA section
- Dashboard.tsx: Move existing App.tsx content here, polish with loading states
- History.tsx: Table of runs from GET /api/runs, click to drill down
- RunDetail.tsx: Full detail from GET /api/issues/{run_id}
- PRs.tsx: PR list from GET /api/prs
- Pricing.tsx: Free/Pro/Enterprise tiers
- Login.tsx + Signup.tsx: Auth forms
- Docs.tsx: Static docs
- About.tsx: Team info
- Settings.tsx: Config form
