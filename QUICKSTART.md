# SwarmOps Team Quick Start

## Project: SwarmOps — Autonomous DevOps Agent Swarm

**Your Role:** Backend + Database  
**Friend's Role:** AI Agents + Frontend  
**Project Directory:** `C:\microsoft hackathon\swarmops`

---

## What's Been Scaffolded

### Backend (Your Part) ✅

| File | Purpose | Status |
|------|---------|--------|
| `main.py` | FastAPI app with CORS, routers | ✅ Ready |
| `config.py` | Settings from .env | ✅ Ready |
| `database.py` | SQLite + SQLAlchemy setup | ✅ Ready |
| `models.py` | DB models (Run, AgentMessage, AgentState) | ✅ Ready |
| `requirements.txt` | Dependencies | ✅ Ready |
| `.env.example` | Template for credentials | ✅ Ready |
| `api/issues.py` | POST to trigger swarm | ✅ Ready |
| `api/stream.py` | SSE for real-time streaming | ✅ Ready |
| `api/prs.py` | GET created PRs | ✅ Ready |
| `swarm.py` | Agent orchestration | ✅ Ready |
| `services/github.py` | GitHub API wrapper | ✅ Ready |
| `agents/base.py` | BaseAgent class + registry | ✅ Ready |
| `agents/orchestrator.py` | Reads issue, decomposes | ✅ Ready |
| `agents/planner.py` | Designs fix strategy | ✅ Ready |
| `agents/code_writer.py` | Generates code | ✅ Ready |
| `agents/test_runner.py` | Runs tests | ✅ Ready |
| `agents/security_auditor.py` | Scans for vulns | ✅ Ready |
| `agents/pr_opener.py` | Opens PR | ✅ Ready |

### Frontend (Friend's Part) ✅

| File | Purpose | Status |
|------|---------|--------|
| `package.json` | Dependencies | ✅ Ready |
| `vite.config.ts` | Vite config with proxy | ✅ Ready |
| `tailwind.config.js` | Tailwind theme | ✅ Ready |
| `src/main.tsx` | Entry point | ✅ Ready |
| `src/App.tsx` | Main dashboard | ✅ Ready |
| `src/store/agentStore.ts` | Zustand state | ✅ Ready |
| `src/hooks/useAgentStream.ts` | SSE connection | ✅ Ready |
| `src/components/AgentChat.tsx` | Streaming chat | ✅ Ready |
| `src/components/AgentCard.tsx` | Status cards | ✅ Ready |
| `src/components/DiffViewer.tsx` | Code diff | ✅ Ready |

---

## Your Next Steps (Backend)

### Step 1: Create .env File
```bash
cd swarmops/backend
cp .env.example .env
# Edit .env with your GitHub token
```

### Step 2: Get Azure OpenAI Credentials from Friend
Ask your friend for:
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_KEY`
- `AZURE_OPENAI_DEPLOYMENT`

### Step 3: Install & Run
```bash
cd swarmops/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Step 4: Test the API
```bash
# Health check
curl http://localhost:8000/health

# Trigger swarm (replace with real issue)
curl -X POST http://localhost:8000/api/issues \
  -H "Content-Type: application/json" \
  -d '{
    "github_url": "https://github.com/owner/repo/issues/42",
    "repo": "owner/repo",
    "issue_number": 42
  }'
```

---

## Friend's Next Steps (Frontend)

### Step 1: Setup Azure OpenAI
1. Create Azure account (free tier)
2. Deploy GPT-4o model
3. Get endpoint + key
4. Share with you for `.env`

### Step 2: Run Frontend
```bash
cd swarmops/frontend
npm install
npm run dev
```

### Step 3: Connect to Backend
The frontend is already configured to proxy `/api` to `localhost:8000`

---

## How It Works Together

```
1. You enter GitHub issue URL in frontend
2. Frontend POSTs to /api/issues
3. Backend creates run record in SQLite
4. Backend starts agent swarm (swarm.py)
5. Each agent runs sequentially:
   - Orchestrator → Planner → Code Writer → Test Runner → Security → PR Opener
6. Each agent saves messages to DB
7. Frontend streams messages via SSE (/api/stream/{run_id})
8. You see agents speaking in real-time!
```

---

## What Needs Your Code (Backend)

### Priority 1: Connect Real GitHub API
In `services/github.py`, the methods are stubbed out. You need to:
- Test `get_issue()` with a real repo
- Test `create_pull_request()` with a real repo
- Make sure your GitHub token has `repo` scope

### Priority 2: Add Azure OpenAI Calls
In each agent file, replace placeholder logic with actual OpenAI calls:
```python
# In agents/orchestrator.py (and others)
from openai import AzureOpenAI

client = AzureOpenAI(
    azure_endpoint=settings.azure_openai_endpoint,
    api_key=settings.azure_openai_key,
    api_version="2024-02-01"
)

response = client.chat.completions.create(
    model=settings.azure_openai_deployment,
    messages=[
        {"role": "system", "content": self.system_prompt},
        {"role": "user", "content": json.dumps(context)}
    ]
)
```

### Priority 3: Error Handling
Add try/except blocks around:
- GitHub API calls
- OpenAI API calls
- Database operations

---

## What Needs Friend's Code (Frontend)

### Priority 1: Polish UI
- Make it look hacker-cool (dark theme, neon accents)
- Add animations for agent messages
- Make AgentChat scroll smoothly

### Priority 2: Connect Monaco Editor
- Replace the simple diff display with actual Monaco Editor
- Show side-by-side diffs

### Priority 3: Add Test Results Component
- Show test pass/fail with visual indicators
- Display error messages nicely

---

## Daily Checklist

### Day 1 (Setup)
- [ ] You: Backend runs, health check passes
- [ ] You: Create `.env` with real GitHub token
- [ ] Friend: Azure OpenAI account created
- [ ] Friend: Frontend runs, shows input form

### Day 2 (Core Agents)
- [ ] You: Orchestrator + Planner agents working
- [ ] Friend: AgentChat streaming messages
- [ ] Friend: AgentCard showing statuses

### Day 3 (Code + Test)
- [ ] You: Code Writer + Test Runner working
- [ ] Friend: DiffViewer showing code changes
- [ ] Friend: TestResults component

### Day 4 (Security + PR)
- [ ] You: Security Auditor + PR Opener working
- [ ] You: Full end-to-end flow working
- [ ] Friend: SecurityReport + PRStatus components

### Day 5 (Integration)
- [ ] You: SSE streaming working perfectly
- [ ] Friend: All components wired together
- [ ] Both: Test full flow with real issue

### Day 6 (Polish)
- [ ] Both: Bug fixes, error handling
- [ ] Both: Optional Azure deploy
- [ ] Both: Demo script rehearsed

### Day 7 (Demo)
- [ ] Both: 2-min demo video recorded
- [ ] Both: README polished
- [ ] Both: 3-min pitch prepared

---

## Troubleshooting

### Backend won't start
```bash
# Check if .env exists
cat .env

# Check if dependencies installed
pip list | grep fastapi

# Run with explicit port
uvicorn main:app --reload --port 8000
```

### Frontend can't connect to backend
```bash
# Make sure backend is running
curl http://localhost:8000/health

# Check CORS settings in main.py
# Should allow http://localhost:5173
```

### Agents not running
```bash
# Check if run was created
curl http://localhost:8000/api/issues/{run_id}

# Check database
sqlite3 swarmops.db "SELECT * FROM runs;"
```

---

## Important Notes

1. **Never commit `.env`** — it has your GitHub token!
2. **Use a test repo** — Don't run on production repos during development
3. **GitHub token needs `repo` scope** — For creating branches and PRs
4. **Azure OpenAI has rate limits** — Don't spam requests during testing
5. **SQLite is file-based** — Delete `swarmops.db` to reset database

---

## Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com
- **AutoGen Docs:** https://microsoft.github.io/autogen
- **Azure OpenAI:** https://learn.microsoft.com/azure/ai-services/openai/
- **PyGithub:** https://pygithub.readthedocs.io
- **React + Vite:** https://vitejs.dev/guide/

---

## Good Luck! 🚀

You have a solid scaffold. Now it's time to connect the real APIs and make it work!
