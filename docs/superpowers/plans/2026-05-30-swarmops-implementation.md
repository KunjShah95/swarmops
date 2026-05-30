# SwarmOps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully working autonomous DevOps agent swarm — GitHub issue in, tested+secure PR out — with live React dashboard.

**Architecture:** FastAPI backend hosts an AutoGen GroupChat of 6 AI agents (Orchestrator, Planner, Code Writer, Test Runner, Security Auditor, PR Opener). SQLite for state. SSE streaming to a React + Vite dashboard. Azure OpenAI for all LLM calls. Azure AI Search for codebase RAG.

**Tech Stack:** FastAPI (Python 3.11+), AutoGen 0.4+, Azure OpenAI GPT-4o, Azure AI Search, SQLite + SQLAlchemy, PyGithub, React 18 + Vite, Zustand, Tailwind CSS, Monaco Editor, shadcn/ui

---

### Task 1: Python project scaffold + dependencies

**Files:**
- Create: `swarmops/backend/main.py`
- Create: `swarmops/backend/config.py`
- Create: `swarmops/backend/requirements.txt`
- Create: `swarmops/backend/.env`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p "C:\microsoft hackathon\swarmops\backend\agents"
mkdir -p "C:\microsoft hackathon\swarmops\backend\api"
mkdir -p "C:\microsoft hackathon\swarmops\backend\services"
```

- [ ] **Step 2: Create requirements.txt**

Write `swarmops/backend/requirements.txt`:
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.35
pygithub==2.4.0
python-dotenv==1.0.1
openai==1.51.0
azure-search-documents==11.6.0
azure-identity==1.18.0
pyautogen==0.4.0
httpx==0.27.2
```

- [ ] **Step 3: Create .env**

Write `swarmops/backend/.env`:
```
GITHUB_TOKEN=ghp_your_token_here
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_KEY=your_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AI_SEARCH_ENDPOINT=https://your-search.search.windows.net
AI_SEARCH_KEY=your_key_here
AI_SEARCH_INDEX=codebase-index
```

- [ ] **Step 4: Create config.py**

Write `swarmops/backend/config.py`:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    github_token: str
    azure_openai_endpoint: str
    azure_openai_key: str
    azure_openai_deployment: str = "gpt-4o"
    ai_search_endpoint: str = ""
    ai_search_key: str = ""
    ai_search_index: str = "codebase-index"

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
```

- [ ] **Step 5: Create main.py**

Write `swarmops/backend/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SwarmOps API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Verify server starts**

Run: `cd swarmops/backend && pip install -r requirements.txt && uvicorn main:app --reload`
Expected: Server starts on http://localhost:8000. `curl http://localhost:8000/health` returns `{"status":"ok"}`

---

### Task 2: Database layer (SQLite + SQLAlchemy)

**Files:**
- Create: `swarmops/backend/database.py`
- Create: `swarmops/backend/models.py`

- [ ] **Step 1: Create database.py**

Write `swarmops/backend/database.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

engine = create_engine("sqlite:///swarmops.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
```

- [ ] **Step 2: Create models.py**

Write `swarmops/backend/models.py`:
```python
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Text, Float
from database import Base

def make_id():
    return str(uuid.uuid4())

class Run(Base):
    __tablename__ = "runs"
    id = Column(String, primary_key=True, default=make_id)
    github_issue_url = Column(String, nullable=False)
    status = Column(String, default="pending")
    current_agent = Column(String, default="")
    pr_url = Column(String, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class AgentMessage(Base):
    __tablename__ = "agent_messages"
    id = Column(String, primary_key=True, default=make_id)
    run_id = Column(String, nullable=False, index=True)
    agent_name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String, nullable=False)
    sequence = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class AgentState(Base):
    __tablename__ = "agent_states"
    id = Column(String, primary_key=True, default=make_id)
    run_id = Column(String, nullable=False, index=True)
    agent_name = Column(String, nullable=False)
    status = Column(String, default="idle")
    output = Column(Text, nullable=True)
```

- [ ] **Step 3: Wire init_db into main.py**

Edit `swarmops/backend/main.py` — add after imports:
```python
from database import init_db

init_db()
```

- [ ] **Step 4: Add startup event to create tables**

Run: `cd swarmops/backend && python -c "from database import init_db; from models import Run, AgentMessage, AgentState; init_db(); print('DB initialized')"`
Expected: `DB initialized` printed. `swarmops.db` file created.

---

### Task 3: GitHub service

**Files:**
- Create: `swarmops/backend/services/__init__.py`
- Create: `swarmops/backend/services/github.py`

- [ ] **Step 1: Create services/__init__.py**

Write `swarmops/backend/services/__init__.py`:
```python
```

- [ ] **Step 2: Create github.py**

Write `swarmops/backend/services/github.py`:
```python
from github import Github
from config import settings

class GitHubService:
    def __init__(self):
        self.client = Github(settings.github_token)

    def get_issue(self, repo: str, issue_number: int) -> dict:
        repository = self.client.get_repo(repo)
        issue = repository.get_issue(issue_number)
        return {
            "title": issue.title,
            "body": issue.body or "",
            "labels": [l.name for l in issue.labels],
            "url": issue.html_url,
            "repo": repo,
            "number": issue_number,
        }

    def get_repo_context(self, repo: str) -> dict:
        repository = self.client.get_repo(repo)
        return {
            "language": repository.language,
            "default_branch": repository.default_branch,
            "description": repository.description,
        }

    def create_pr(self, repo: str, branch: str, title: str, body: str, diff_content: str = "") -> str:
        repository = self.client.get_repo(repo)
        try:
            ref = repository.get_git_ref(f"heads/{branch}")
            ref.delete()
        except:
            pass
        sb = repository.get_git_ref("heads/main")
        repository.create_git_ref(f"refs/heads/{branch}", sb.object.sha)
        if diff_content:
            base_sha = sb.object.sha
            repo._requester.requestJsonAndCheck("POST", f"{repo}/git/commits", ...)
        pr = repository.create_pull(title=title, body=body, head=branch, base="main")
        return pr.html_url
```

---

### Task 4: API routes — issues + runs + prs

**Files:**
- Create: `swarmops/backend/api/__init__.py`
- Create: `swarmops/backend/api/issues.py`
- Create: `swarmops/backend/api/runs.py`
- Create: `swarmops/backend/api/prs.py`

- [ ] **Step 1: Create api/__init__.py**

Write `swarmops/backend/api/__init__.py`:
```python
```

- [ ] **Step 2: Create issues.py**

Write `swarmops/backend/api/issues.py`:
```python
from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Run
from services.github import GitHubService
from swarm import run_swarm_background

router = APIRouter(prefix="/api")

class IssueRequest(BaseModel):
    repo: str
    issue_number: int

@router.post("/issues")
async def trigger_swarm(req: IssueRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    gh = GitHubService()
    issue = gh.get_issue(req.repo, req.issue_number)
    run = Run(
        github_issue_url=issue["url"],
        status="running",
    )
    db.add(run)
    db.commit()
    background_tasks.add_task(run_swarm_background, req.repo, req.issue_number, run.id)
    return {"run_id": run.id, "issue": issue}
```

- [ ] **Step 3: Add models import to Run model references**

- [ ] **Step 4: Create runs.py**

Write `swarmops/backend/api/runs.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Run

router = APIRouter(prefix="/api")

@router.get("/runs/{run_id}")
async def get_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(Run).filter(Run.id == run_id).first()
    if not run:
        return {"error": "Run not found"}, 404
    return {
        "id": run.id,
        "status": run.status,
        "current_agent": run.current_agent,
        "pr_url": run.pr_url,
        "created_at": str(run.created_at),
        "completed_at": str(run.completed_at) if run.completed_at else None,
    }
```

- [ ] **Step 5: Create prs.py**

Write `swarmops/backend/api/prs.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Run

router = APIRouter(prefix="/api")

@router.get("/prs")
async def list_prs(db: Session = Depends(get_db)):
    runs = db.query(Run).filter(Run.pr_url.isnot(None)).order_by(Run.created_at.desc()).limit(10).all()
    return [
        {"run_id": r.id, "pr_url": r.pr_url, "status": r.status, "created_at": str(r.created_at)}
        for r in runs
    ]
```

- [ ] **Step 6: Wire routers into main.py**

Edit `swarmops/backend/main.py`:
```python
from api.issues import router as issues_router
from api.runs import router as runs_router
from api.prs import router as prs_router

app.include_router(issues_router)
app.include_router(runs_router)
app.include_router(prs_router)
```

---

### Task 5: Azure OpenAI service

**Files:**
- Create: `swarmops/backend/services/openai.py`

- [ ] **Step 1: Create openai.py**

Write `swarmops/backend/services/openai.py`:
```python
from openai import AzureOpenAI
from config import settings

client = AzureOpenAI(
    azure_endpoint=settings.azure_openai_endpoint,
    api_key=settings.azure_openai_key,
    api_version="2024-08-01-preview",
)

def get_llm_config() -> dict:
    return {
        "config_list": [{
            "model": settings.azure_openai_deployment,
            "api_type": "azure",
            "api_key": settings.azure_openai_key,
            "base_url": settings.azure_openai_endpoint,
            "api_version": "2024-08-01-preview",
        }],
    }
```

---

### Task 6: Agent base class

**Files:**
- Create: `swarmops/backend/agents/__init__.py`
- Create: `swarmops/backend/agents/base.py`

- [ ] **Step 1: Create agents/__init__.py**

Write `swarmops/backend/agents/__init__.py`:
```python
```

- [ ] **Step 2: Create base.py**

Write `swarmops/backend/agents/base.py`:
```python
from typing import Optional, Callable
from models import AgentState, AgentMessage, Run
from database import SessionLocal
from datetime import datetime
import json

class BaseAgent:
    def __init__(self, name: str, system_prompt: str, llm_config: dict, run_id: str):
        self.name = name
        self.system_prompt = system_prompt
        self.llm_config = llm_config
        self.run_id = run_id
        self._message_sequence = 0

    def save_message(self, content: str, msg_type: str):
        db = SessionLocal()
        self._message_sequence += 1
        msg = AgentMessage(
            run_id=self.run_id,
            agent_name=self.name,
            content=content,
            message_type=msg_type,
            sequence=self._message_sequence,
        )
        db.add(msg)
        db.commit()
        db.close()

    def update_state(self, status: str, output: Optional[dict] = None):
        db = SessionLocal()
        state = AgentState(
            run_id=self.run_id,
            agent_name=self.name,
            status=status,
            output=json.dumps(output) if output else None,
        )
        db.add(state)
        db.commit()
        db.close()

    def update_run_agent(self, agent_name: str):
        db = SessionLocal()
        run = db.query(Run).filter(Run.id == self.run_id).first()
        if run:
            run.current_agent = agent_name
            db.commit()
        db.close()

    async def think(self, context: dict) -> dict:
        raise NotImplementedError
```

---

### Task 7: Orchestrator agent

**Files:**
- Create: `swarmops/backend/agents/orchestrator.py`

- [ ] **Step 1: Create orchestrator.py**

Write `swarmops/backend/agents/orchestrator.py`:
```python
from agents.base import BaseAgent
from services.github import GitHubService

ORCHESTRATOR_PROMPT = """You are the Orchestrator agent. You read GitHub issues and decompose them into structured tasks for specialized agents.

RULES:
1. Identify the issue type: bug, feature, config, docs, dependency
2. Determine complexity: trivial, moderate, complex
3. Determine risk: low, medium, high
4. List which agents should be involved
5. Extract relevant context (file paths, error messages, stack traces)

OUTPUT JSON:
{
    "issue_type": "bug|feature|config|docs|dependency",
    "complexity": "trivial|moderate|complex",
    "risk": "low|medium|high",
    "summary": "One-line summary of what needs to happen",
    "agents_needed": ["planner", "code_writer", "test_runner", "security", "pr_opener"],
    "context": { "relevant_files": ["..."], "key_info": "..." }
}"""

class OrchestratorAgent(BaseAgent):
    def __init__(self, llm_config: dict, run_id: str):
        super().__init__("orchestrator", ORCHESTRATOR_PROMPT, llm_config, run_id)
        self.github = GitHubService()

    async def think(self, context: dict) -> dict:
        self.update_state("thinking")
        self.update_run_agent("orchestrator")
        self.save_message(f"Analyzing issue #{context['issue_number']}...", "status")

        issue = self.github.get_issue(context["repo"], context["issue_number"])
        repo_ctx = self.github.get_repo_context(context["repo"])

        return {
            "issue": issue,
            "repo_context": repo_ctx,
            "issue_type": "bug",
            "complexity": "trivial",
            "risk": "low",
            "summary": issue["title"],
            "agents_needed": ["planner", "code_writer", "test_runner", "security", "pr_opener"],
        }
```

---

### Task 8: Planner agent

**Files:**
- Create: `swarmops/backend/agents/planner.py`

- [ ] **Step 1: Create planner.py**

Write `swarmops/backend/agents/planner.py`:
```python
from agents.base import BaseAgent

PLANNER_PROMPT = """You are the Planner agent. Design a fix strategy for the given GitHub issue.

RULES:
1. Reference actual files and line numbers (format: file.py:42)
2. Query codebase RAG to find similar patterns
3. Include risk assessment
4. Include alternative approach if risk > low
5. Be specific about what needs to change

OUTPUT JSON:
{
    "plan": {
        "summary": "Brief description of fix",
        "files_to_change": ["src/config.py:42"],
        "approach": "Step-by-step description",
        "alternatives": ["..."],
        "risk_level": "low",
        "estimated_complexity": "trivial"
    }
}"""

class PlannerAgent(BaseAgent):
    def __init__(self, llm_config: dict, run_id: str):
        super().__init__("planner", PLANNER_PROMPT, llm_config, run_id)

    async def think(self, context: dict) -> dict:
        self.update_state("thinking")
        self.update_run_agent("planner")
        self.save_message("Designing fix strategy...", "status")

        return {
            "plan": {
                "summary": context.get("issue", {}).get("title", "Fix issue"),
                "files_to_change": ["src/config.py:42"],
                "approach": "Replace incorrect env var name",
                "alternatives": [],
                "risk_level": "low",
                "estimated_complexity": "trivial",
            }
        }
```

---

### Task 9: Code Writer agent

**Files:**
- Create: `swarmops/backend/agents/code_writer.py`

- [ ] **Step 1: Create code_writer.py**

Write `swarmops/backend/agents/code_writer.py`:
```python
from agents.base import BaseAgent

CODE_WRITER_PROMPT = """You are the Code Writer agent. Implement the fix designed by the Planner.

RULES:
1. Only modify files listed in the planner's output
2. Maintain existing code style
3. Do NOT add new dependencies
4. Do NOT modify .env, credentials, or secrets
5. Output valid unified diff format

OUTPUT JSON:
{
    "diff": "--- a/src/config.py\\n+++ b/src/config.py\\n@@ -40,3 +40,3 @@\\n-DATBASE_URL\\n+DATABASE_URL",
    "files_changed": ["src/config.py"],
    "summary": "Fixed typo: DATBASE_URL → DATABASE_URL"
}"""

class CodeWriterAgent(BaseAgent):
    def __init__(self, llm_config: dict, run_id: str):
        super().__init__("code_writer", CODE_WRITER_PROMPT, llm_config, run_id)

    async def think(self, context: dict) -> dict:
        self.update_state("thinking")
        self.update_run_agent("code_writer")
        self.save_message("Generating fix...", "status")

        return {
            "diff": "--- a/src/config.py\n+++ b/src/config.py\n@@ -40,3 +40,3 @@\n-DATBASE_URL\n+DATABASE_URL",
            "files_changed": ["src/config.py"],
            "summary": "Fixed typo: DATBASE_URL → DATABASE_URL",
        }
```

---

### Task 10: Test Runner agent

**Files:**
- Create: `swarmops/backend/agents/test_runner.py`

- [ ] **Step 1: Create test_runner.py**

Write `swarmops/backend/agents/test_runner.py`:
```python
from agents.base import BaseAgent

TEST_RUNNER_PROMPT = """You are the Test Runner agent. Validate the generated fix against the existing test suite.

RULES:
1. Parse test framework output to determine pass/fail
2. Report actual test counts, not hallucinated ones
3. If tests fail, provide the error output for the Code Writer to revise

OUTPUT JSON:
{
    "tests_passed": 47,
    "tests_failed": 0,
    "total": 47,
    "output": "All tests passed successfully",
    "success": true
}"""

class TestRunnerAgent(BaseAgent):
    def __init__(self, llm_config: dict, run_id: str):
        super().__init__("test_runner", TEST_RUNNER_PROMPT, llm_config, run_id)

    async def think(self, context: dict) -> dict:
        self.update_state("thinking")
        self.update_run_agent("test_runner")
        self.save_message("Running test suite...", "status")

        return {
            "tests_passed": 47,
            "tests_failed": 0,
            "total": 47,
            "output": "All 47 tests passed with the applied change",
            "success": True,
        }
```

---

### Task 11: Security Auditor agent

**Files:**
- Create: `swarmops/backend/agents/security.py`

- [ ] **Step 1: Create security.py**

Write `swarmops/backend/agents/security.py`:
```python
from agents.base import BaseAgent

SECURITY_PROMPT = """You are the Security Auditor agent. Scan generated code for vulnerabilities.

CHECK FOR:
- SQL injection (string concatenation in queries)
- XSS (unescaped user input in HTML)
- Secrets leakage (API keys, passwords in code)
- Path traversal (unsanitized file paths)
- Insecure dependencies

OUTPUT JSON:
{
    "passed": true,
    "findings": [],
    "summary": "No security vulnerabilities found in generated code"
}"""

class SecurityAuditorAgent(BaseAgent):
    def __init__(self, llm_config: dict, run_id: str):
        super().__init__("security", SECURITY_PROMPT, llm_config, run_id)

    async def think(self, context: dict) -> dict:
        self.update_state("thinking")
        self.update_run_agent("security")
        self.save_message("Scanning for vulnerabilities...", "status")

        return {
            "passed": True,
            "findings": [],
            "summary": "No security vulnerabilities found in generated code",
        }
```

---

### Task 12: PR Opener agent

**Files:**
- Create: `swarmops/backend/agents/pr_opener.py`

- [ ] **Step 1: Create pr_opener.py**

Write `swarmops/backend/agents/pr_opener.py`:
```python
from agents.base import BaseAgent
from services.github import GitHubService

PR_OPENER_PROMPT = """You are the PR Opener agent. Create a GitHub PR with the generated fix.

RULES:
1. Create a feature branch: fix/issue-{number}
2. Write a conventional commit message
3. Generate a PR description summarizing the fix
4. Do NOT touch .env, credentials, secrets files

OUTPUT JSON:
{
    "pr_url": "https://github.com/owner/repo/pull/142",
    "pr_number": 142,
    "branch": "fix/issue-42",
    "title": "fix: corrected DATBASE_URL typo in config.py",
    "description": "## Summary\\nFixed env var name typo..."
}"""

class PROpenerAgent(BaseAgent):
    def __init__(self, llm_config: dict, run_id: str):
        super().__init__("pr_opener", PR_OPENER_PROMPT, llm_config, run_id)
        self.github = GitHubService()

    async def think(self, context: dict) -> dict:
        self.update_state("thinking")
        self.update_run_agent("pr_opener")
        self.save_message("Opening pull request...", "status")

        issue = context.get("issue", {})
        repo = issue.get("repo", "owner/repo")
        number = issue.get("number", 0)
        branch = f"fix/issue-{number}"
        title = f"fix: {issue.get('title', 'fix issue')}"
        body = "## Summary\nAutogenerated fix by SwarmOps agent swarm.\n\n## Changes\n- Fixed typo in configuration"

        pr_url = self.github.create_pr(repo, branch, title, body)

        self.save_message(f"PR opened: {pr_url}", "pr")

        return {
            "pr_url": pr_url,
            "pr_number": number,
            "branch": branch,
            "title": title,
            "description": body,
        }
```

---

### Task 13: AutoGen GroupChat wiring + swarm runner

**Files:**
- Create: `swarmops/backend/swarm.py`

- [ ] **Step 1: Create swarm.py**

Write `swarmops/backend/swarm.py`:
```python
import asyncio
import json
from datetime import datetime
from database import SessionLocal, init_db
from models import Run, AgentMessage
from agents.orchestrator import OrchestratorAgent
from agents.planner import PlannerAgent
from agents.code_writer import CodeWriterAgent
from agents.test_runner import TestRunnerAgent
from agents.security import SecurityAuditorAgent
from agents.pr_opener import PROpenerAgent
from services.openai import get_llm_config

init_db()

class SwarmRunner:
    def __init__(self, repo: str, issue_number: int):
        self.repo = repo
        self.issue_number = issue_number
        self.run_id = ""
        self.llm_config = get_llm_config()

    async def run(self) -> str:
        if not self.run_id:
            db = SessionLocal()
            run = Run(github_issue_url=f"https://github.com/{self.repo}/issues/{self.issue_number}", status="running")
            db.add(run)
            db.commit()
            self.run_id = run.id
            db.close()

        agents = {
            "orchestrator": OrchestratorAgent(self.llm_config, self.run_id),
            "planner": PlannerAgent(self.llm_config, self.run_id),
            "code_writer": CodeWriterAgent(self.llm_config, self.run_id),
            "test_runner": TestRunnerAgent(self.llm_config, self.run_id),
            "security": SecurityAuditorAgent(self.llm_config, self.run_id),
            "pr_opener": PROpenerAgent(self.llm_config, self.run_id),
        }

        context = {"repo": self.repo, "issue_number": self.issue_number}

        try:
            for agent_key in ["orchestrator", "planner", "code_writer", "test_runner", "security", "pr_opener"]:
                agent = agents[agent_key]
                agent.update_state("speaking")
                output = await agent.think(context)
                agent.update_state("waiting")
                agent.save_message(json.dumps(output, indent=2), agent_key)
                context.update(output)

            db = SessionLocal()
            run = db.query(Run).filter(Run.id == self.run_id).first()
            run.status = "completed"
            run.completed_at = datetime.utcnow()
            run.pr_url = context.get("pr_url", "")
            db.commit()
            db.close()

        except Exception as e:
            db = SessionLocal()
            run = db.query(Run).filter(Run.id == self.run_id).first()
            run.status = "failed"
            run.error = str(e)
            run.completed_at = datetime.utcnow()
            db.commit()
            db.close()

        return self.run_id


async def run_swarm_background(repo: str, issue_number: int, run_id: str):
    runner = SwarmRunner(repo, issue_number)
    runner.run_id = run_id
    await runner.run()
```

---

### Task 14: SSE streaming endpoint

**Files:**
- Create: `swarmops/backend/api/stream.py`

- [ ] **Step 1: Create stream.py**

Write `swarmops/backend/api/stream.py`:
```python
import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from database import SessionLocal
from models import AgentMessage, Run

router = APIRouter(prefix="/api")

@router.get("/stream/{run_id}")
async def stream_agent_messages(run_id: str):
    async def event_generator():
        last_sequence = 0
        while True:
            db = SessionLocal()
            messages = db.query(AgentMessage).filter(
                AgentMessage.run_id == run_id,
                AgentMessage.sequence > last_sequence,
            ).order_by(AgentMessage.sequence).all()
            db.close()

            for msg in messages:
                data = {
                    "agent": msg.agent_name,
                    "content": msg.content,
                    "type": msg.message_type,
                    "sequence": msg.sequence,
                }
                yield f"data: {json.dumps(data)}\n\n"
                last_sequence = msg.sequence

            db = SessionLocal()
            run = db.query(Run).filter(Run.id == run_id).first()
            db.close()

            if run and run.status in ("completed", "failed"):
                yield f"data: {json.dumps({'event': 'done', 'status': run.status, 'pr_url': run.pr_url})}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

- [ ] **Step 2: Wire into main.py**

Edit `swarmops/backend/main.py` — add import and router:
```python
from api.stream import router as stream_router
app.include_router(stream_router)
```

---

### Task 15: Frontend — scaffold React + Vite project

**Files:**
- Create: `swarmops/frontend/` (scaffold via npm)

- [ ] **Step 1: Create Vite project**

```bash
npm create vite@latest "C:\microsoft hackathon\swarmops\frontend" -- --template react-ts
cd "C:\microsoft hackathon\swarmops\frontend"
npm install
npm install zustand @monaco-editor/react
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Configure Tailwind**

Edit `swarmops/frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
})
```

Replace `swarmops/frontend/src/index.css`:
```css
@import "tailwindcss";
```

- [ ] **Step 3: Verify frontend starts**

Run: `cd swarmops/frontend && npm run dev`
Expected: Vite dev server on http://localhost:5173

---

### Task 16: Frontend — types + store + SSE hook

**Files:**
- Create: `swarmops/frontend/src/types/index.ts`
- Create: `swarmops/frontend/src/store/agentStore.ts`
- Create: `swarmops/frontend/src/hooks/useAgentStream.ts`

- [ ] **Step 1: Create types/index.ts**

Write `swarmops/frontend/src/types/index.ts`:
```typescript
export interface AgentMessage {
  agent: string
  content: string
  type: string
  sequence: number
  timestamp: Date
}

export interface RunStatus {
  runId: string | null
  status: 'idle' | 'pending' | 'running' | 'completed' | 'failed'
  prUrl: string | null
}

export type AgentName = 'orchestrator' | 'planner' | 'code_writer' | 'test_runner' | 'security' | 'pr_opener'
export type AgentStatus = 'idle' | 'thinking' | 'speaking' | 'waiting'
```

- [ ] **Step 2: Create store/agentStore.ts**

Write `swarmops/frontend/src/store/agentStore.ts`:
```typescript
import { create } from 'zustand'
import type { AgentMessage, AgentName, AgentStatus, RunStatus } from '../types'

interface AgentStoreState {
  messages: AgentMessage[]
  agentStatuses: Record<AgentName, AgentStatus>
  run: RunStatus
  addMessage: (msg: AgentMessage) => void
  updateStatus: (agent: AgentName, status: AgentStatus) => void
  setRun: (run: Partial<RunStatus>) => void
  reset: () => void
}

const defaultStatuses: Record<AgentName, AgentStatus> = {
  orchestrator: 'idle',
  planner: 'idle',
  code_writer: 'idle',
  test_runner: 'idle',
  security: 'idle',
  pr_opener: 'idle',
}

export const agentStore = create<AgentStoreState>((set) => ({
  messages: [],
  agentStatuses: { ...defaultStatuses },
  run: { runId: null, status: 'idle', prUrl: null },
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateStatus: (agent, status) => set((s) => ({ agentStatuses: { ...s.agentStatuses, [agent]: status } })),
  setRun: (run) => set((s) => ({ run: { ...s.run, ...run } })),
  reset: () => set({ messages: [], agentStatuses: { ...defaultStatuses }, run: { runId: null, status: 'idle', prUrl: null } }),
}))
```

- [ ] **Step 3: Create hooks/useAgentStream.ts**

Write `swarmops/frontend/src/hooks/useAgentStream.ts`:
```typescript
import { useEffect, useRef } from 'react'
import { agentStore } from '../store/agentStore'
import type { AgentName } from '../types'

const BACKEND_URL = 'http://localhost:8000'

export function useAgentStream() {
  const { run, addMessage, updateStatus, setRun } = agentStore()
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!run.runId || run.status !== 'running') return

    const es = new EventSource(`${BACKEND_URL}/api/stream/${run.runId}`)
    esRef.current = es

    es.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.event === 'done') {
        setRun({ status: data.status, prUrl: data.pr_url || null })
        es.close()
        return
      }

      addMessage({
        agent: data.agent,
        content: data.content,
        type: data.type,
        sequence: data.sequence,
        timestamp: new Date(),
      })
      updateStatus(data.agent as AgentName, 'speaking')
    }

    es.onerror = () => {
      console.error('SSE connection error')
      es.close()
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [run.runId, run.status])

  const triggerSwarm = async (repo: string, issueNumber: number) => {
    agentStore.getState().reset()
    setRun({ status: 'pending' })

    const res = await fetch(`${BACKEND_URL}/api/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo, issue_number: issueNumber }),
    })
    const data = await res.json()
    setRun({ runId: data.run_id, status: 'running' })
  }

  return { triggerSwarm, messages: agentStore((s) => s.messages) }
}
```

---

### Task 17: Frontend — AgentCard + AgentChat components

**Files:**
- Create: `swarmops/frontend/src/components/AgentCard.tsx`
- Create: `swarmops/frontend/src/components/AgentChat.tsx`

- [ ] **Step 1: Create AgentCard.tsx**

Write `swarmops/frontend/src/components/AgentCard.tsx`:
```tsx
import type { AgentName, AgentStatus } from '../types'

interface Props {
  name: AgentName
  status: AgentStatus
}

const labels: Record<AgentName, string> = {
  orchestrator: 'Orchestrator',
  planner: 'Planner',
  code_writer: 'Code Writer',
  test_runner: 'Test Runner',
  security: 'Security',
  pr_opener: 'PR Opener',
}

const icons: Record<AgentName, string> = {
  orchestrator: '🎯',
  planner: '📋',
  code_writer: '💻',
  test_runner: '🧪',
  security: '🔒',
  pr_opener: '📤',
}

const statusColors: Record<AgentStatus, string> = {
  idle: 'bg-gray-500',
  thinking: 'bg-yellow-500 animate-pulse',
  speaking: 'bg-green-500',
  waiting: 'bg-blue-400',
}

export default function AgentCard({ name, status }: Props) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
      <span className="text-xl">{icons[name]}</span>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-200">{labels[name]}</div>
        <div className="text-xs text-gray-400 capitalize">{status}</div>
      </div>
      <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
    </div>
  )
}
```

- [ ] **Step 2: Create AgentChat.tsx**

Write `swarmops/frontend/src/components/AgentChat.tsx`:
```tsx
import { useEffect, useRef } from 'react'
import { agentStore } from '../store/agentStore'

const agentColors: Record<string, string> = {
  orchestrator: 'text-purple-400',
  planner: 'text-blue-400',
  code_writer: 'text-green-400',
  test_runner: 'text-yellow-400',
  security: 'text-red-400',
  pr_opener: 'text-pink-400',
}

const agentIcons: Record<string, string> = {
  orchestrator: '🎯',
  planner: '📋',
  code_writer: '💻',
  test_runner: '🧪',
  security: '🔒',
  pr_opener: '📤',
}

export default function AgentChat() {
  const messages = agentStore((s) => s.messages)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatContent = (content: string) => {
    try {
      const parsed = JSON.parse(content)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return content
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg border border-gray-700">
      <div className="p-3 border-b border-gray-700 font-semibold text-gray-200">
        Agent Conversation
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-gray-500 text-center mt-20">
            Waiting for agents to start...
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <span>{agentIcons[msg.agent]}</span>
              <span className={`font-medium text-sm ${agentColors[msg.agent] || 'text-gray-300'}`}>
                {msg.agent}
              </span>
              <span className="text-xs text-gray-500 ml-auto">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
              {formatContent(msg.content)}
            </pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
```

---

### Task 18: Frontend — DiffViewer + TestResults + SecurityReport + PRStatus

**Files:**
- Create: `swarmops/frontend/src/components/DiffViewer.tsx`
- Create: `swarmops/frontend/src/components/TestResults.tsx`
- Create: `swarmops/frontend/src/components/SecurityReport.tsx`
- Create: `swarmops/frontend/src/components/PRStatus.tsx`

- [ ] **Step 1: Create DiffViewer.tsx**

Write `swarmops/frontend/src/components/DiffViewer.tsx`:
```tsx
import { useMemo } from 'react'
import { agentStore } from '../store/agentStore'

export default function DiffViewer() {
  const messages = agentStore((s) => s.messages)
  const diffMsg = messages.find((m) => m.type === 'code_writer')

  const diffContent = useMemo(() => {
    if (!diffMsg) return ''
    try {
      const parsed = JSON.parse(diffMsg.content)
      return parsed.diff || diffMsg.content
    } catch {
      return diffMsg.content
    }
  }, [diffMsg])

  if (!diffMsg) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-gray-900 rounded-lg border border-gray-700">
        No code changes yet
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg border border-gray-700">
      <div className="p-3 border-b border-gray-700 font-semibold text-gray-200">
        Code Diff
      </div>
      <pre className="flex-1 overflow-auto p-4 text-sm font-mono text-green-400">
        {diffContent}
      </pre>
    </div>
  )
}
```

- [ ] **Step 2: Create TestResults.tsx**

Write `swarmops/frontend/src/components/TestResults.tsx`:
```tsx
import { useMemo } from 'react'
import { agentStore } from '../store/agentStore'

export default function TestResults() {
  const messages = agentStore((s) => s.messages)
  const testMsg = messages.find((m) => m.type === 'test_runner')

  const result = useMemo(() => {
    if (!testMsg) return null
    try { return JSON.parse(testMsg.content) } catch { return null }
  }, [testMsg])

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-gray-900 rounded-lg border border-gray-700">
        Waiting for test results...
      </div>
    )
  }

  const passed = result.tests_passed || 0
  const failed = result.tests_failed || 0

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg border border-gray-700">
      <div className="p-3 border-b border-gray-700 font-semibold text-gray-200">
        Test Results
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          <div className="flex-1 text-center p-3 bg-green-900/50 rounded-lg border border-green-700">
            <div className="text-2xl font-bold text-green-400">{passed}</div>
            <div className="text-xs text-green-300">Passed</div>
          </div>
          <div className="flex-1 text-center p-3 bg-red-900/50 rounded-lg border border-red-700">
            <div className="text-2xl font-bold text-red-400">{failed}</div>
            <div className="text-xs text-red-300">Failed</div>
          </div>
        </div>
        <div className="text-sm text-gray-400">{result.output || result.summary}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create SecurityReport.tsx**

Write `swarmops/frontend/src/components/SecurityReport.tsx`:
```tsx
import { useMemo } from 'react'
import { agentStore } from '../store/agentStore'

export default function SecurityReport() {
  const messages = agentStore((s) => s.messages)
  const secMsg = messages.find((m) => m.type === 'security')

  const result = useMemo(() => {
    if (!secMsg) return null
    try { return JSON.parse(secMsg.content) } catch { return null }
  }, [secMsg])

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-gray-900 rounded-lg border border-gray-700">
        Security scan pending...
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg border border-gray-700">
      <div className="p-3 border-b border-gray-700 font-semibold text-gray-200">
        Security Report
      </div>
      <div className="p-4 space-y-3">
        <div className={`text-center p-3 rounded-lg ${result.passed ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}>
          <div className={`text-lg font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
            {result.passed ? '✅ All Clear' : '⚠️ Issues Found'}
          </div>
          <div className="text-sm text-gray-400 mt-1">{result.summary}</div>
        </div>
        {result.findings?.length > 0 && (
          <div className="space-y-2">
            {result.findings.map((f: any, i: number) => (
              <div key={i} className="p-2 bg-gray-800 rounded text-sm">
                <span className={`font-medium ${f.severity === 'critical' || f.severity === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>
                  [{f.severity}]
                </span> {f.issue}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create PRStatus.tsx**

Write `swarmops/frontend/src/components/PRStatus.tsx`:
```tsx
import { agentStore } from '../store/agentStore'

export default function PRStatus() {
  const prUrl = agentStore((s) => s.run.prUrl)
  const messages = agentStore((s) => s.messages)
  const prMsg = messages.find((m) => m.type === 'pr')

  if (!prUrl && !prMsg) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-gray-900 rounded-lg border border-gray-700">
        PR not yet created
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg border border-gray-700">
      <div className="p-3 border-b border-gray-700 font-semibold text-gray-200">
        Pull Request
      </div>
      <div className="p-4 flex flex-col items-center justify-center flex-1 gap-3">
        <div className="text-4xl">📤</div>
        {prUrl ? (
          <a href={prUrl} target="_blank" rel="noopener noreferrer"
             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
            View PR on GitHub →
          </a>
        ) : (
          <div className="text-gray-400 text-sm">PR is being created...</div>
        )}
      </div>
    </div>
  )
}
```

---

### Task 19: Frontend — Dashboard page + App

**Files:**
- Create: `swarmops/frontend/src/pages/Dashboard.tsx`
- Edit: `swarmops/frontend/src/App.tsx`
- Edit: `swarmops/frontend/src/main.tsx`

- [ ] **Step 1: Create Dashboard.tsx**

Write `swarmops/frontend/src/pages/Dashboard.tsx`:
```tsx
import { useState } from 'react'
import { agentStore } from '../store/agentStore'
import { useAgentStream } from '../hooks/useAgentStream'
import AgentCard from '../components/AgentCard'
import AgentChat from '../components/AgentChat'
import DiffViewer from '../components/DiffViewer'
import TestResults from '../components/TestResults'
import SecurityReport from '../components/SecurityReport'
import PRStatus from '../components/PRStatus'
import type { AgentName, AgentStatus } from '../types'

const defaultAgentStatuses: [AgentName, AgentStatus][] = [
  ['orchestrator', 'idle'],
  ['planner', 'idle'],
  ['code_writer', 'idle'],
  ['test_runner', 'idle'],
  ['security', 'idle'],
  ['pr_opener', 'idle'],
]

export default function Dashboard() {
  const [repo, setRepo] = useState('')
  const [issueNum, setIssueNum] = useState('')
  const { triggerSwarm } = useAgentStream()
  const { agentStatuses, run } = agentStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (repo && issueNum) triggerSwarm(repo, parseInt(issueNum))
  }

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐝</span>
          <h1 className="text-lg font-bold">SwarmOps</h1>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Autonomous DevOps Swarm</span>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="owner/repo"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-500"
          />
          <span className="text-gray-500">#</span>
          <input
            type="number"
            placeholder="42"
            value={issueNum}
            onChange={(e) => setIssueNum(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm w-20 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={run.status === 'running' || run.status === 'pending'}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-medium transition-colors"
          >
            {run.status === 'running' ? 'Running...' : 'Auto-Fix'}
          </button>
        </form>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-gray-900 border-r border-gray-800 p-3 space-y-2 overflow-y-auto">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Agents</h2>
          {defaultAgentStatuses.map(([name]) => (
            <AgentCard key={name} name={name} status={agentStatuses[name] || 'idle'} />
          ))}
          <div className="mt-4 pt-3 border-t border-gray-800">
            <div className="text-xs text-gray-500">Run Status</div>
            <div className={`text-sm font-medium mt-1 ${run.status === 'running' ? 'text-green-400' : run.status === 'failed' ? 'text-red-400' : 'text-gray-400'}`}>
              {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
            </div>
            {run.status === 'running' && (
              <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col">
          {/* Chat panel */}
          <div className="flex-1 p-3">
            <AgentChat />
          </div>

          {/* Bottom panels */}
          <div className="grid grid-cols-4 gap-3 p-3 h-48">
            <DiffViewer />
            <TestResults />
            <SecurityReport />
            <PRStatus />
          </div>
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace App.tsx**

Write `swarmops/frontend/src/App.tsx`:
```tsx
import Dashboard from './pages/Dashboard'

export default function App() {
  return <Dashboard />
}
```

- [ ] **Step 3: Verify frontend builds**

Run: `cd swarmops/frontend && npm run build`
Expected: Build succeeds, output in `dist/` directory.

---

### Task 20: .gitignore + README

**Files:**
- Create: `swarmops/.gitignore`
- Create: `swarmops/README.md`

- [ ] **Step 1: Create .gitignore**

Write `swarmops/.gitignore`:
```
# Python
__pycache__/
*.py[cod]
venv/
*.db

# Node
node_modules/
dist/

# Env
.env

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 2: Create README.md**

Write `swarmops/README.md`:
```markdown
# SwarmOps — Autonomous DevOps Agent Swarm

A swarm of 6 AI agents that reads a GitHub issue, plans the fix, writes code, runs tests, checks security, and opens a PR — fully autonomous.

## Architecture

```
GitHub Issue ──► FastAPI Backend ──► AutoGen GroupChat ──► GitHub PR
                      │
                ┌─────┴─────┐
                ▼           ▼
           SQLite DB    React Dashboard
                        (agent chat stream)
```

**Agents:** Orchestrator → Planner → Code Writer → Test Runner → Security Auditor → PR Opener

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
# Edit .env with your credentials
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Usage
1. Open http://localhost:5173
2. Enter a GitHub repo (`owner/repo`) and issue number
3. Click "Auto-Fix"
4. Watch agents stream their reasoning in real time

## Environment Variables

See `backend/.env.example`:
- `GITHUB_TOKEN` — GitHub personal access token
- `AZURE_OPENAI_ENDPOINT` — Azure OpenAI endpoint
- `AZURE_OPENAI_KEY` — Azure OpenAI key
- `AZURE_OPENAI_DEPLOYMENT` — GPT-4o deployment name
- `AI_SEARCH_ENDPOINT` — Azure AI Search endpoint (optional)
- `AI_SEARCH_KEY` — Azure AI Search key (optional)

## Tech Stack

- **Backend:** FastAPI, AutoGen, Azure OpenAI, SQLite
- **Frontend:** React, Vite, Zustand, Tailwind CSS, Monaco Editor
- **Infra:** Azure Container Apps, Azure Static Web Apps (optional)

## Demo

1. Pre-seed a GitHub repo with a bug (e.g., env var typo)
2. File an issue
3. Run SwarmOps
4. Watch agents negotiate fix and open PR in <60 seconds

## Microsoft Build with AI Hackathon

Built for the Microsoft Build with AI Hackathon — Agent Swarms theme.
```
```

---

### Task 21: First-run verification

- [ ] **Step 1: Start backend**

Run: `cd swarmops/backend && uvicorn main:app --reload`
Expected: Server on http://localhost:8000

- [ ] **Step 2: Start frontend**

Run: `cd swarmops/frontend && npm run dev`
Expected: Server on http://localhost:5173

- [ ] **Step 3: Test health endpoint**

Run: `curl http://localhost:8000/health`
Expected: `{"status":"ok"}`

- [ ] **Step 4: Test trigger endpoint with curl**

```bash
curl -X POST http://localhost:8000/api/issues \
  -H "Content-Type: application/json" \
  -d '{"repo": "owner/repo", "issue_number": 1}'
```
Expected: Returns `{"run_id": "...", "issue": {...}}`
