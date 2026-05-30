# SwarmOps — Autonomous DevOps Agent Swarm

**Hackathon:** Microsoft Build with AI
**Theme:** Agent Swarms — Multi-Agent Orchestration with AutoGen + Azure
**Date:** 2026-05-30

---

## 1. Elevator Pitch

A swarm of 5 specialized AI agents reads a GitHub issue, plans the fix, writes code, runs tests, checks security, and opens a PR — fully autonomous. A live dashboard streams every agent "thought" in real time.

## 2. Architecture Decision

**Simplified approach** (per PRD `02-swarmops-team-plan.md`):

| Component | Choice | Rationale |
|-----------|--------|-----------|
| LLM | Azure OpenAI GPT-4o | Required for MS AI hackathon |
| RAG | Azure AI Search | Judge wow factor for grounded reasoning |
| Database | SQLite | Zero config, instant setup, local-first |
| Queue | In-memory (asyncio) | Fast iteration, no infra dependency |
| Auth | .env file | Hackathon speed > production security |
| Frontend hosting | Local + optional Azure Static Web Apps | Works without Azure deploy |
| Backend hosting | Local + optional Azure Container Apps | Demo locally, deploy if time |

## 3. System Architecture

```
GitHub Issue
    │ (webhook or manual POST)
    ▼
FastAPI Backend (localhost:8000)
    │
    ├── AutoGen GroupChat — 6 Agents
    │   ├── Orchestrator: reads issue, decomposes tasks
    │   ├── Planner: designs fix strategy (Azure AI Search RAG)
    │   ├── Code Writer: generates code diff
    │   ├── Test Runner: validates against test suite
    │   ├── Security Auditor: scans for vulnerabilities
    │   └── PR Opener: creates branch, commits, opens PR
    │
    ├── SQLite (swarmops.db) — run state + agent messages
    │
    └── SSE /api/stream/{run_id} — real-time agent message streaming
            │
            ▼
    React Dashboard (localhost:5173)
    ├── Agent Chat Panel (streaming via EventSource)
    ├── Code Diff Viewer (Monaco Editor)
    ├── Test Results
    ├── Security Report
    └── PR Status + Link
```

## 4. Agent Pipeline Flow

```
1. Orchestrator ← GitHub issue (title, body, labels)
2. Orchestrator → Planner (enriched context + repo info)
3. Planner → AI Search (query similar code patterns)
4. Planner → Code Writer (structured plan with file:line refs)
5. Code Writer → Test Runner (generated diff)
6. Test Runner → |← pass → Security Auditor
                    └→ fail → Code Writer (revise with error)
7. Security Auditor → |← pass → PR Opener
                        └→ fail → Code Writer (revise with findings)
8. PR Opener → GitHub (branch + commit + PR)
9. Orchestrator → SSE (final status + PR URL)
```

## 5. Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| API | FastAPI (Python 3.11+) |
| Agent Framework | AutoGen 0.4+ GroupChat |
| LLM | Azure OpenAI GPT-4o |
| Search | Azure AI Search |
| Database | SQLite + SQLAlchemy |
| GitHub | PyGithub |
| Run | uvicorn + python-dotenv |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 18 + Vite + TypeScript |
| State | Zustand |
| Styling | Tailwind CSS |
| SSE Client | EventSource API |
| Code Display | Monaco Editor (@monaco-editor/react) |
| UI | shadcn/ui |

## 6. Project Structure

```
C:\microsoft hackathon\
├── swarmops\
│   ├── backend\
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── agents\
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── orchestrator.py
│   │   │   ├── planner.py
│   │   │   ├── code_writer.py
│   │   │   ├── test_runner.py
│   │   │   ├── security.py
│   │   │   └── pr_opener.py
│   │   ├── api\
│   │   │   ├── __init__.py
│   │   │   ├── issues.py
│   │   │   ├── stream.py
│   │   │   └── prs.py
│   │   ├── services\
│   │   │   ├── __init__.py
│   │   │   ├── github.py
│   │   │   └── openai.py
│   │   ├── requirements.txt
│   │   └── .env
│   ├── frontend\
│   │   ├── src\
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── pages\
│   │   │   │   └── Dashboard.tsx
│   │   │   ├── components\
│   │   │   │   ├── AgentChat.tsx
│   │   │   │   ├── AgentCard.tsx
│   │   │   │   ├── DiffViewer.tsx
│   │   │   │   ├── TestResults.tsx
│   │   │   │   ├── SecurityReport.tsx
│   │   │   │   └── PRStatus.tsx
│   │   │   ├── hooks\
│   │   │   │   └── useAgentStream.ts
│   │   │   ├── store\
│   │   │   │   └── agentStore.ts
│   │   │   └── types\
│   │   │       └── index.ts
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── index.html
│   ├── README.md
│   └── .gitignore
├── PRDs\
│   ├── 01-autonomous-devops-swarm.md
│   ├── 01-autonomous-devops-swarm-implementation-plan.md
│   └── 02-swarmops-team-plan.md
└── docs\superpowers\specs\
    └── 2026-05-30-swarmops-design.md
```

## 7. Data Models (SQLite)

### Run
- `id` (UUID, PK)
- `github_issue_url` (str)
- `status` (pending → running → completed/failed)
- `current_agent` (str)
- `pr_url` (str, nullable)
- `created_at` (datetime)
- `completed_at` (datetime, nullable)

### AgentMessage
- `id` (UUID, PK)
- `run_id` (FK → Run)
- `agent_name` (str)
- `content` (text)
- `message_type` (plan/code/test/security/pr/status)
- `sequence` (int)
- `timestamp` (datetime)

### AgentState
- `id` (UUID, PK)
- `run_id` (FK → Run)
- `agent_name` (str)
- `status` (idle/thinking/speaking/waiting)
- `output` (json text, nullable)

## 8. Hallucination Guards

1. Planner output must reference real `file:line` paths (regex validated)
2. Code Writer diff must parse as valid syntax before broadcast
3. Test Runner must show real framework output (not hallucinated "PASSED")
4. Security Auditor must output `{passed: bool, findings: []}` structure
5. PR Opener must not touch `.env`, `secrets`, `credentials` files

## 9. Success Criteria

| Metric | Target |
|--------|--------|
| Agent cycle time | ≤60s issue → PR |
| Demo reliability | First-try success ≥90% |
| Working locally | `docker compose up` or manual start in < 2 min |
| Deployable to Azure | Optional — bicep templates ready if time permits |

## 10. Demo Flow

1. Show a GitHub issue with a known bug (typo in env var name)
2. Click "Auto-Fix" in React dashboard
3. Watch 5 agents appear in chat panel, stream their reasoning
4. See code diff appear in Monaco editor
5. See test results (47 passed, 0 failed)
6. See security report (no vulnerabilities)
7. See PR URL pop up — click to view on GitHub
8. Total time: 25–60 seconds
