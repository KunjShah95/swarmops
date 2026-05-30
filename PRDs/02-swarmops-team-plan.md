# SwarmOps — Simplified Implementation Plan

**Project:** SwarmOps — Autonomous DevOps Agent Swarm
**Team Split:**
- **You:** Backend (FastAPI + AutoGen) + Database
- **Friend:** AI Agents + Frontend (React Dashboard)

---

## Team Task Board

### Your Tasks (Backend + DB)

| Day | Task | Status |
|-----|------|--------|
| 1 | Set up Python project, FastAPI scaffold, SQLite DB | ☐ |
| 1 | GitHub OAuth setup (PyGithub) | ☐ |
| 2 | Build Orchestrator agent (reads GitHub issue) | ☐ |
| 2 | Build Planner agent (uses Azure AI Search for RAG) | ☐ |
| 3 | Build Code Writer agent (generates diff) | ☐ |
| 3 | Build Test Runner agent (runs tests in sandbox) | ☐ |
| 4 | Build Security Auditor agent (scans code) | ☐ |
| 4 | Build PR Opener agent (creates GitHub PR) | ☐ |
| 4 | Wire all 5 agents into AutoGen GroupChat | ☐ |
| 5 | SSE endpoint for streaming agent messages to frontend | ☐ |
| 6 | Deploy backend to Azure Container Apps | ☐ |
| 7 | End-to-end testing + bug fixes | ☐ |

### Friend's Tasks (AI + Frontend)

| Day | Task | Status |
|-----|------|--------|
| 1 | Set up Azure OpenAI + Azure AI Search (free tiers) | ☐ |
| 1 | Scaffold React + Vite project | ☐ |
| 2 | Design agent system prompts (all 5 agents) | ☐ |
| 2 | Build AgentChat streaming panel | ☐ |
| 3 | Build DiffViewer (Monaco Editor) | ☐ |
| 3 | Build TestResults component | ☐ |
| 4 | Build SecurityReport component | ☐ |
| 4 | Build PRStatus component | ☐ |
| 5 | Zustand store + SSE connection hook | ☐ |
| 5 | Wire frontend to backend SSE endpoint | ☐ |
| 6 | Deploy frontend to Azure Static Web Apps | ☐ |
| 7 | UI polish + demo prep | ☐ |

---

## Simplified Architecture

```
GitHub Issue ──► FastAPI Backend ──► AutoGen GroupChat ──► GitHub PR
                      │
                ┌─────┴─────┐
                ▼           ▼
           SQLite DB    React Dashboard
                        (agent chat stream)
```

### What We're Simplifying (for 1 week hackathon)

| Original | Simplified | Why |
|----------|-----------|-----|
| Azure Cosmos DB | **SQLite** | No Azure account needed, zero config, works locally |
| Azure Service Bus | **In-memory queue** | FastAPI async handles concurrency fine for demo |
| Azure API Management | **Direct webhook** | GitHub webhook → FastAPI endpoint |
| Azure Key Vault | **.env file** | Hackathon speed > production security |
| Azure AI Search | **Azure AI Search (free tier)** | Friend handles this — only needs 1 Azure account |
| Azure Container Apps | **Local + optional deploy** | Demo works locally, deploy is bonus |
| Azure Static Web Apps | **Local + optional deploy** | Same |

---

## Backend Simplified Plan (Your Side)

### Tech Stack

```
FastAPI (Python 3.11+)
├── AutoGen 0.4+        — Agent orchestration
├── Azure OpenAI GPT-4o — All LLM calls (friend sets up)
├── PyGithub            — GitHub API
├── SQLite + SQLAlchemy  — Database (no Azure needed)
├── uvicorn             — Server
└── python-dotenv       — .env config
```

### Day 1: Scaffold

```
swarmops/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── config.py            # .env loading
│   ├── database.py          # SQLite setup
│   ├── models.py            # DB models
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base.py          # BaseAgent class
│   │   ├── orchestrator.py  # Reads issue, decomposes
│   │   ├── planner.py       # Designs fix
│   │   ├── code_writer.py   # Generates code
│   │   ├── test_runner.py   # Runs tests
│   │   ├── security.py      # Scans for vulns
│   │   └── pr_opener.py     # Opens PR
│   ├── swarm.py             # AutoGen GroupChat config
│   ├── api/
│   │   ├── issues.py        # POST /api/issues
│   │   ├── stream.py        # GET /api/stream/{run_id}
│   │   └── prs.py           # GET /api/prs
│   ├── services/
│   │   ├── github.py        # GitHub API wrapper
│   │   └── openai.py        # Azure OpenAI wrapper
│   ├── .env                 # Credentials (gitignored)
│   └── requirements.txt
├── frontend/                # Friend builds this
└── README.md
```

### Day 1 Tasks (Detailed)

1. **Create Python project:**
   ```bash
   mkdir swarmops && cd swarmops
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install fastapi uvicorn autogen azure-openai pygithub sqlalchemy python-dotenv
   ```

2. **Create `.env`:**
   ```
   GITHUB_TOKEN=ghp_your_token_here
   AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
   AZURE_OPENAI_KEY=your_key_here
   AZURE_OPENAI_DEPLOYMENT=gpt-4o
   ```

3. **Create `main.py`:**
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   from api import issues, stream, prs
   
   app = FastAPI(title="SwarmOps API")
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173"],  # Vite dev server
       allow_methods=["*"],
       allow_headers=["*"],
   )
   
   app.include_router(issues.router, prefix="/api")
   app.include_router(stream.router, prefix="/api")
   app.include_router(prs.router, prefix="/api")
   
   @app.get("/health")
   async def health():
       return {"status": "ok"}
   ```

4. **Create SQLite database:**
   ```python
   # database.py
   from sqlalchemy import create_engine
   from sqlalchemy.ext.declarative import declarative_base
   from sqlalchemy.orm import sessionmaker
   
   engine = create_engine("sqlite:///swarmops.db")
   SessionLocal = sessionmaker(bind=engine)
   Base = declarative_base()
   
   def get_db():
       db = SessionLocal()
       try:
           yield db
       finally:
           db.close()
   ```

5. **Create DB models:**
   ```python
   # models.py
   from sqlalchemy import Column, String, DateTime, Integer, Text, Float
   from sqlalchemy.sql import func
   from database import Base
   
   class Run(Base):
       __tablename__ = "runs"
       id = Column(String, primary_key=True)
       github_issue_url = Column(String)
       status = Column(String, default="pending")  # pending, running, completed, failed
       current_agent = Column(String)
       pr_url = Column(String)
       created_at = Column(DateTime, server_default=func.now())
       completed_at = Column(DateTime, nullable=True)
   
   class AgentMessage(Base):
       __tablename__ = "agent_messages"
       id = Column(String, primary_key=True)
       run_id = Column(String)
       agent_name = Column(String)
       content = Column(Text)
       message_type = Column(String)  # plan, code, test, security, pr, status
       sequence = Column(Integer)
       timestamp = Column(DateTime, server_default=func.now())
   
   class AgentState(Base):
       __tablename__ = "agent_states"
       id = Column(String, primary_key=True)
       run_id = Column(String)
       agent_name = Column(String)
       status = Column(String, default="idle")  # idle, thinking, speaking, waiting
       output = Column(Text, nullable=True)  # JSON string
   ```

### Day 2-4: Build Agents

Each agent follows this pattern:
```python
# agents/base.py
class BaseAgent:
    def __init__(self, name: str):
        self.name = name
    
    async def think(self, context: dict) -> dict:
        """Override in subclass. Returns agent output."""
        raise NotImplementedError
    
    def to_autogen(self):
        """Convert to AutoGen agent for GroupChat."""
        return autogen.AssistantAgent(
            name=self.name,
            system_prompt=self.system_prompt,
            llm_config=azure_openai_config,
        )
```

### Day 5: SSE Streaming

```python
# api/stream.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from database import SessionLocal
from models import AgentMessage
import json

router = APIRouter()

@router.get("/stream/{run_id}")
async def stream_agent_messages(run_id: str):
    async def event_generator():
        db = SessionLocal()
        last_sequence = 0
        
        while True:
            messages = db.query(AgentMessage).filter(
                AgentMessage.run_id == run_id,
                AgentMessage.sequence > last_sequence
            ).order_by(AgentMessage.sequence).all()
            
            for msg in messages:
                data = {
                    "agent": msg.agent_name,
                    "content": msg.content,
                    "type": msg.message_type,
                    "sequence": msg.sequence,
                }
                yield f"data: {json.dumps(data)}\n\n"
                last_sequence = msg.sequence
            
            # Check if run is complete
            from models import Run
            run = db.query(Run).filter(Run.id == run_id).first()
            if run and run.status in ["completed", "failed"]:
                yield f"data: {json.dumps({'event': 'done', 'status': run.status})}\n\n"
                break
            
            await asyncio.sleep(0.5)  # Poll every 500ms
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

---

## Frontend Simplified Plan (Friend's Side)

### Tech Stack

```
React 18 + Vite
├── Tailwind CSS     — Styling
├── Zustand          — State management
├── Monaco Editor    — Code diff display
├── EventSource API  — SSE streaming
└── shadcn/ui        — UI components
```

### Day 1: Scaffold
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install zustand @monaco-editor/react
```

### Day 2-5: Build Components

**Key components to build:**

| Component | What It Does | Priority |
|-----------|-------------|----------|
| `AgentChat.tsx` | Streaming agent conversation (hero component) | Critical |
| `DiffViewer.tsx` | Monaco code diff display | Critical |
| `AgentCard.tsx` | Agent status indicator | High |
| `TestResults.tsx` | Test pass/fail display | Medium |
| `SecurityReport.tsx` | Vulnerability findings | Medium |
| `PRStatus.tsx` | PR link + status | High |

### AgentChat.tsx (Hero Component)

```tsx
// hooks/useAgentStream.ts
import { useEffect, useState } from 'react'
import { agentStore } from '../store/agentStore'

export function useAgentStream(runId: string | null) {
  const { addMessage, updateStatus } = agentStore()
  
  useEffect(() => {
    if (!runId) return
    
    const eventSource = new EventSource(
      `http://localhost:8000/api/stream/${runId}`
    )
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.event === 'done') {
        eventSource.close()
        return
      }
      
      addMessage({
        agent: data.agent,
        content: data.content,
        type: data.type,
        timestamp: new Date(),
      })
      
      updateStatus(data.agent, 'speaking')
    }
    
    return () => eventSource.close()
  }, [runId])
}
```

### Zustand Store

```typescript
// store/agentStore.ts
import { create } from 'zustand'

interface AgentMessage {
  agent: string
  content: string
  type: string
  timestamp: Date
}

interface AgentState {
  messages: AgentMessage[]
  agentStatuses: Record<string, string>
  addMessage: (msg: AgentMessage) => void
  updateStatus: (agent: string, status: string) => void
}

export const agentStore = create<AgentState>((set) => ({
  messages: [],
  agentStatuses: {
    orchestrator: 'idle',
    planner: 'idle',
    code_writer: 'idle',
    test_runner: 'idle',
    security: 'idle',
    pr_opener: 'idle',
  },
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg]
  })),
  updateStatus: (agent, status) => set((state) => ({
    agentStatuses: { ...state.agentStatuses, [agent]: status }
  })),
}))
```

---

## Azure Setup (Friend Handles This)

### Step-by-Step Azure Free Account Setup

1. **Create Azure account:** https://azure.microsoft.com/free (gets you $200 free credit)
2. **Create Azure OpenAI resource:**
   - Go to Azure Portal → Create Resource → Azure OpenAI
   - Choose East US region
   - Deploy GPT-4o model
3. **Create Azure AI Search resource:**
   - Go to Azure Portal → Create Resource → Azure AI Search
   - Choose Basic tier (free for 1 month)
4. **Get credentials for backend:**
   - Send these to you for `.env`:
     - `AZURE_OPENAI_ENDPOINT`
     - `AZURE_OPENAI_KEY`
     - `AZURE_OPENAI_DEPLOYMENT` (the deployment name you chose)

### Free Tier Limits (Should Be Enough for Demo)

| Service | Free Tier | Usage in Demo |
|---------|----------|---------------|
| Azure OpenAI | $200 credit | ~100 GPT-4o calls per demo |
| Azure AI Search | 50MB, 3 indexes | 1 repo index |
| Azure Container Apps | 180,000 vCPU-seconds | Optional deploy |
| Azure Static Web Apps | Free | 1 frontend |

---

## Demo Flow (1 Week)

```
Day 1: Both set up projects, Azure accounts
Day 2: You build orchestrator + planner agents, friend builds chat panel
Day 3: You build code writer + test runner, friend builds diff viewer
Day 4: You build security + PR opener, wire all agents, friend builds remaining UI
Day 5: You build SSE streaming, friend wires frontend to backend
Day 6: Integration testing, bug fixes, optional Azure deploy
Day 7: Demo recording, README, pitch prep
```

---

## Communication Protocol

### Daily Sync (5 min)
- **Morning:** What are you working on today?
- **End of day:** What did you finish? Any blockers?

### Handoff Points

| Day | You Hand Off To Friend | Friend Hands Off To You |
|-----|----------------------|------------------------|
| 2 | Agent output schemas | — |
| 3 | — | — |
| 4 | SSE message format | — |
| 5 | API endpoints for frontend | Azure OpenAI credentials |
| 6 | Deployed backend URL | — |

### Message Format for Agents (Shared Agreement)

```json
{
  "agent": "planner",
  "content": "Found issue in src/config.ts:42 — typo in DATABASE_URL",
  "type": "plan",
  "data": {
    "files": ["src/config.ts:42"],
    "risk": "low"
  }
}
```

---

## What to Google (Quick Reference)

| You Need | Search Query |
|----------|-------------|
| FastAPI CORS setup | "fastapi cors middleware" |
| AutoGen GroupChat | "autogen groupchat example" |
| SQLAlchemy SQLite | "sqlalchemy sqlite fastapi" |
| PyGithub PR creation | "pygithub create pull request" |
| SSE streaming FastAPI | "fastapi server sent events" |
| Azure OpenAI Python | "azure openai python quickstart" |
