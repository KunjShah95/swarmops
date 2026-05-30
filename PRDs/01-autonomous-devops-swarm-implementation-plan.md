# Implementation Plan: Autonomous DevOps Swarm

**Project:** Autonomous DevOps Swarm — Agent Swarm for Microsoft Build with AI Hackathon
**Architecture Reference:** See diagram in `architecture-diagram.png`
**Timeline:** 7 days

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend (React Dashboard)](#2-frontend-react-dashboard)
3. [Backend (FastAPI + AutoGen)](#3-backend-fastapi--autogen)
4. [Database (Azure Cosmos DB)](#4-database-azure-cosmos-db)
5. [AI/ML Layer](#5-aiml-layer)
6. [Infrastructure (Azure)](#6-infrastructure-azure)
7. [DevOps & Security](#7-devops--security)
8. [Day-by-Day Build Plan](#8-day-by-day-build-plan)
9. [File Structure](#9-file-structure)
10. [Environment Variables](#10-environment-variables)

---

## 1. Architecture Overview

```
GitHub Issue
    │ (webhook)
    ▼
Azure API Management ──► Azure Service Bus ──► Orchestrator Agent
                                                    │
                              ┌─────────────────────┘
                              ▼
                   AutoGen GroupChat — Agent Swarm
                   ┌─────────────────────────────────────┐
                   │ Planner ──► Code Writer ──► Test Runner │
                   │        ◄── RAG ◄── code-gen ◄── tests  │
                   │              ──► Security Auditor        │
                   │                   ──► PR Opener           │
                   └─────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Azure AI Layer   Azure Cosmos DB   Live Dashboard
        ├─ Semantic Kernel  (state/logs)   ├─ React SSE Stream
        ├─ Azure AI Search                  └─ React App (ACA)
        └─ Azure OpenAI GPT-4o
```

---

## 2. Frontend (React Dashboard)

### 2.1 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 18 + Vite | Fast build, HMR for demo iteration |
| State | Zustand | Lightweight agent state management |
| Styling | Tailwind CSS | Rapid UI prototyping |
| SSE Client | EventSource API | Real-time agent message streaming |
| Code Display | Monaco Editor | Diff viewer for generated code |
| UI Components | shadcn/ui | Pre-built component library |
| Hosting | Azure Static Web Apps | GitHub Actions auto-deploy |

### 2.2 Pages & Components

```
src/
├── App.tsx
├── main.tsx
├── pages/
│   └── Dashboard.tsx              # Main single-page app
├── components/
│   ├── layout/
│   │   ├── Header.tsx             # App title, GitHub repo selector
│   │   └── Sidebar.tsx            # Agent status panel
│   ├── agents/
│   │   ├── AgentChat.tsx          # Streaming agent conversation panel
│   │   ├── AgentCard.tsx          # Individual agent status card
│   │   └── AgentMessage.tsx       # Single message bubble with agent identity
│   ├── code/
│   │   ├── DiffViewer.tsx         # Monaco-based code diff display
│   │   └── FileTree.tsx           # Changed files tree
│   ├── tests/
│   │   ├── TestResults.tsx        # Test run results display
│   │   └── TestProgress.tsx       # Live test execution progress
│   ├── security/
│   │   └── SecurityReport.tsx     # Security audit findings
│   ├── pr/
│   │   ├── PRPreview.tsx          # PR description preview
│   │   └── PRStatus.tsx           # PR creation status + link
│   └── shared/
│       ├── LoadingSpinner.tsx
│       └── StatusBadge.tsx        # Agent status indicators
├── hooks/
│   ├── useAgentStream.ts          # SSE connection hook
│   └── useGitHubIssue.ts          # Issue fetching hook
├── services/
│   ├── api.ts                     # Backend API client
│   └── sse.ts                     # SSE connection manager
├── store/
│   └── agentStore.ts              # Zustand store for agent state
└── types/
    └── index.ts                   # TypeScript interfaces
```

### 2.3 Key Components Detail

#### AgentChat.tsx — The Hero Component
```typescript
// Real-time agent conversation panel
// Shows agents speaking in order with their reasoning
// Messages stream in via SSE
// Features:
// - Auto-scroll to latest message
// - Agent identity (name, avatar, color)
// - Collapsible reasoning sections
// - Inline code blocks for diffs
// - Status indicators (thinking, speaking, waiting)
```

#### DiffViewer.tsx — Monaco Integration
```typescript
// Monaco editor in diff mode
// Shows side-by-side code changes
// Highlights added/removed lines
// Fetches raw diff from backend
// Features:
// - Syntax highlighting per language
// - Line numbers
// - Inline comments placeholder
```

#### useAgentStream.ts — SSE Hook
```typescript
// Connects to backend SSE endpoint
// Parses incoming agent messages
// Updates Zustand store in real time
// Features:
// - Auto-reconnect on disconnect
// - Message buffering for rapid updates
// - Agent status tracking (idle → thinking → speaking)
```

### 2.4 Demo UI Layout

```
┌──────────────────────────────────────────────────────────┐
│ Header: Autonomous DevOps Swarm │ GitHub Issue: #42 │
├──────────┬───────────────────────────────────────────────┤
│ Sidebar  │ Main Content                                 │
│          │                                               │
│ 🔄 Orch  │ ┌─────────────────────────────────────────┐ │
│ 💭 Plan  │ │ Agent Chat Panel (streaming) │ │
│ 💻 Code  │ │ │ │
│ 🧪 Test  │ │ Orchestrator: "Analyzing issue #42..." │ │
│ 🔒 Sec   │ │ Planner: "Found matching pattern in │ │
│ 📤 PR    │ │ src/config.ts:42..." │ │
│          │ │ Code Writer: "Generating fix..." │ │
│ ─────── │ │ Test Runner: "All 47 tests pass ✅" │ │
│ Status   │ │ Security Auditor: "No vulnerabilities" │ │
│ Running  │ │ PR Opener: "PR #143 opened" │ │
│ 23s      │ └─────────────────────────────────────────┘ │
│          │                                               │
│          │ ┌──────────────────────┬──────────────────┐ │
│          │ │ Code Diff │ Test Results │ │
│          │ │ src/config.ts │ 47 passed │ │
│          │ │ - DB_URL → DB_URL │ 0 failed │ │
│          │ └──────────────────────┴──────────────────┘ │
│          │                                               │
│          │ ┌─────────────────────────────────────────┐ │
│          │ │ 🟢 PR #143 Open │ View on GitHub │ │
│          │ └─────────────────────────────────────────┘ │
└──────────┴───────────────────────────────────────────────┘
```

---

## 3. Backend (FastAPI + AutoGen)

### 3.1 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | FastAPI | Async REST API + SSE |
| Language | Python 3.11+ | AutoGen compatibility |
| Agent Framework | AutoGen 0.4+ | GroupChat orchestration |
| LLM | Azure OpenAI GPT-4o | All agent reasoning |
| Code Execution | Semantic Kernel | Safe code generation |
| Search | Azure AI Search | Codebase RAG |
| Queue | Azure Service Bus | Async issue ingestion |
| GitHub Integration | PyGithub | API calls |
| Package Manager | Poetry | Dependency management |

### 3.2 File Structure

```
backend/
├── pyproject.toml
├── Dockerfile
├── alembic.ini
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app + middleware
│   ├── config.py                  # Settings + env vars
│   ├── dependencies.py            # Dependency injection
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── issues.py          # POST /api/issues — trigger agent swarm
│   │   │   ├── runs.py            # GET /api/runs — agent run status
│   │   │   └── prs.py             # GET /api/prs — created PRs
│   │   └── sse.py                 # GET /api/stream/{run_id} — SSE endpoint
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base.py                # BaseAgent class
│   │   ├── orchestrator.py        # OrchestratorAgent — decomposition
│   │   ├── planner.py             # PlannerAgent — strategy + RAG
│   │   ├── code_writer.py         # CodeWriterAgent — implementation
│   │   ├── test_runner.py         # TestRunnerAgent — test validation
│   │   ├── security_auditor.py    # SecurityAuditorAgent — vulnerability scan
│   │   └── pr_opener.py           # PROpenerAgent — GitHub PR creation
│   ├── swarm/
│   │   ├── __init__.py
│   │   ├── group_chat.py          # AutoGen GroupChat configuration
│   │   ├── speaker_policy.py      # Custom speaker selection
│   │   └── message_bus.py         # Azure Service Bus wrapper
│   ├── services/
│   │   ├── __init__.py
│   │   ├── github.py              # GitHub API client
│   │   ├── search.py              # Azure AI Search client
│   │   ├── openai_client.py       # Azure OpenAI client
│   │   ├── cosmos.py              # Cosmos DB operations
│   │   └── service_bus.py         # Service Bus operations
│   ├── models/
│   │   ├── __init__.py
│   │   ├── agent_state.py         # Agent state model
│   │   ├── run.py                 # Run model
│   │   ├── issue.py               # Issue model
│   │   └── pr.py                  # PR model
│   └── utils/
│       ├── __init__.py
│       ├── prompts.py             # Agent system prompts
│       ├── guards.py              # Hallucination guard functions
│       └── parsers.py             # Output parsing utilities
└── tests/
    ├── __init__.py
    ├── test_agents.py
    └── test_api.py
```

### 3.3 Agent Implementation

#### BaseAgent Class
```python
# base.py
class BaseAgent:
    """Common interface for all swarm agents."""
    
    def __init__(self, name: str, system_prompt: str, llm_config: dict):
        self.name = name
        self.system_prompt = system_prompt
        self.llm_config = llm_config  # Azure OpenAI config
        self.state = AgentState.IDLE
    
    async def think(self, context: dict) -> AgentMessage:
        """Main reasoning method — subclasses override."""
        raise NotImplementedError
    
    def to_autogen_agent(self) -> autogen.Agent:
        """Convert to AutoGen-compatible agent."""
        raise NotImplementedError
```

#### OrchestratorAgent
```python
# orchestrator.py
class OrchestratorAgent(BaseAgent):
    """Reads GitHub issue, decomposes into agent tasks."""
    
    async def think(self, context: dict) -> AgentMessage:
        # 1. Fetch issue details from GitHub API
        # 2. Enrich with repo context (language, tests, CI config)
        # 3. Decompose into structured task queue
        # 4. Output: {tasks: [...], priority: "high", risk: "low"}
        pass
```

#### PlannerAgent
```python
# planner.py
class PlannerAgent(BaseAgent):
    """Designs fix strategy using codebase RAG."""
    
    def __init__(self, search_client: AzureAISearchClient):
        self.search_client = search_client
    
    async def think(self, context: dict) -> AgentMessage:
        # 1. Query Azure AI Search for similar code patterns
        # 2. Identify files to change (with line references)
        # 3. Design approach: what to change, why, alternatives
        # 4. Output: {plan: {files: [...], approach: "...", risk: "low"}}
        pass
```

#### CodeWriterAgent
```python
# code_writer.py
class CodeWriterAgent(BaseAgent):
    """Generates code fix using Semantic Kernel."""
    
    def __init__(self, semantic_kernel: SKKernel):
        self.kernel = semantic_kernel
    
    async def think(self, context: dict) -> AgentMessage:
        # 1. Read relevant files from repo (via GitHub API)
        # 2. Generate fix using Azure OpenAI
        # 3. Validate syntax via Semantic Kernel code plugin
        # 4. If syntax invalid → regenerate with error feedback
        # 5. Output: {diff: "...", files_changed: [...]}
        pass
```

#### TestRunnerAgent
```python
# test_runner.py
class TestRunnerAgent(BaseAgent):
    """Validates fix against existing test suite."""
    
    async def think(self, context: dict) -> AgentMessage:
        # 1. Clone branch locally (sandboxed)
        # 2. Apply generated diff
        # 3. Run test suite: pytest / npm test / etc.
        # 4. Capture output (pass/fail, error messages)
        # 5. If fails → send error back to CodeWriterAgent
        # 6. Output: {tests_passed: 47, tests_failed: 0, output: "..."}
        pass
```

#### SecurityAuditorAgent
```python
# security_auditor.py
class SecurityAuditorAgent(BaseAgent):
    """Scans generated code for vulnerabilities."""
    
    async def think(self, context: dict) -> AgentMessage:
        # 1. Pattern-based scan: SQLi, XSS, secrets, injection
        # 2. LLM heuristic scan: "are there security concerns?"
        # 3. Dependency check: no new vulnerable deps
        # 4. If issues found → send back to CodeWriterAgent
        # 5. Output: {passed: true, findings: [...]}
        pass
```

#### PROpenerAgent
```python
# pr_opener.py
class PROpenerAgent(BaseAgent):
    """Creates branch, commits, opens GitHub PR."""
    
    async def think(self, context: dict) -> AgentMessage:
        # 1. Create feature branch: fix/issue-{number}
        # 2. Apply diff to branch
        # 3. Commit with conventional commit message
        # 4. Push to GitHub
        # 5. Open PR with agent-generated description
        # 6. Output: {pr_url: "...", pr_number: 143}
        pass
```

### 3.4 AutoGen GroupChat Configuration

```python
# group_chat.py
from autogen import GroupChat, GroupChatManager

def create_swarm():
    """Configure the 5-agent swarm."""
    
    agents = [
        OrchestratorAgent(...),
        PlannerAgent(...),
        CodeWriterAgent(...),
        TestRunnerAgent(...),
        SecurityAuditorAgent(...),
        PROpenerAgent(...),
    ]
    
    group_chat = GroupChat(
        agents=agents,
        messages=[],
        max_round=15,           # Max agent turns
        speaker_selection_method="round_robin",  # or custom
        allow_repeat_speaker=False,
    )
    
    manager = GroupChatManager(
        groupchat=group_chat,
        llm_config=azure_openai_config,
    )
    
    return manager
```

### 3.5 SSE Streaming

```python
# sse.py
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

@app.get("/api/stream/{run_id}")
async def stream_agent_messages(run_id: str):
    """Stream agent messages to frontend via SSE."""
    
    async def event_generator():
        async for message in cosmos.get_agent_messages(run_id):
            data = {
                "agent": message.agent_name,
                "content": message.content,
                "timestamp": message.timestamp,
                "status": message.status,
            }
            yield f"data: {json.dumps(data)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )
```

### 3.6 Hallucination Guards

```python
# guards.py

class HallucinationGuard:
    """Validates agent outputs before passing to next agent."""
    
    @staticmethod
    def validate_planner_output(output: dict) -> bool:
        """Planner must include real file:line references."""
        for file_ref in output.get("files", []):
            if not re.match(r"^[\w/]+\.\w+:\d+", file_ref):
                return False
        return True
    
    @staticmethod
    def validate_code_output(diff: str) -> bool:
        """Code Writer output must be valid syntax."""
        # Try parsing with language-appropriate linter
        # Return False if syntax error
        pass
    
    @staticmethod
    def validate_test_output(output: dict) -> bool:
        """Test Runner must run actual tests, not hallucinate passing."""
        # Verify test output contains actual test framework output
        # Check for patterns like "PASSED", "FAILED", test counts
        pass
    
    @staticmethod
    def validate_security_output(output: dict) -> bool:
        """Security Auditor output must contain actionable findings."""
        # At minimum, report should have a "passed" boolean
        # and a "findings" list (even if empty)
        return "passed" in output and "findings" in output
    
    @staticmethod
    def validate_pr_output(output: dict) -> bool:
        """PR Opener must not touch sensitive files."""
        blocked_files = [".env", "credentials", "secrets", "*.key", "*.pem"]
        for file in output.get("files_changed", []):
            if any(blocked in file for blocked in blocked_files):
                return False
        return True
```

---

## 4. Database (Azure Cosmos DB)

### 4.1 Purpose

- Store agent run state (status, messages, artifacts)
- Log agent conversation history for replay
- Track GitHub issues processed
- Cache GitHub repo metadata

### 4.2 Data Models

```python
# models/run.py
class Run(BaseModel):
    """Tracks a single agent swarm execution."""
    id: str                          # UUID
    github_issue_url: str            # e.g., "owner/repo/issues/42"
    status: str                      # "pending" | "running" | "completed" | "failed"
    current_agent: str               # Which agent is currently active
    created_at: datetime
    completed_at: Optional[datetime]
    pr_url: Optional[str]            # Generated PR URL
    error: Optional[str]             # Error message if failed

# models/agent_state.py
class AgentState(BaseModel):
    """State of a single agent in a run."""
    id: str                          # UUID
    run_id: str                      # FK to Run
    agent_name: str                  # "planner", "code_writer", etc.
    status: str                      # "idle" | "thinking" | "speaking" | "waiting"
    current_task: Optional[str]      # What it's working on
    output: Optional[dict]           # Agent's output (diff, plan, etc.)
    confidence: float                # 0.0 - 1.0
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

# models/agent_message.py
class AgentMessage(BaseModel):
    """Single message in agent conversation."""
    id: str                          # UUID
    run_id: str                      # FK to Run
    agent_name: str                  # Who said it
    content: str                     # What they said
    message_type: str                # "plan" | "code" | "test" | "security" | "pr" | "status"
    timestamp: datetime
    sequence: int                    # Order in conversation

# models/issue.py
class Issue(BaseModel):
    """Tracks processed GitHub issues."""
    id: str                          # UUID
    github_url: str                  # Full issue URL
    repository: str                  # "owner/repo"
    issue_number: int
    title: str
    body: str
    labels: List[str]
    processed_at: datetime
    run_id: str                      # FK to Run that handled it
```

### 4.3 Cosmos DB Configuration

```python
# services/cosmos.py
from azure.cosmos import CosmosClient, PartitionKey

class CosmosService:
    def __init__(self):
        self.client = CosmosClient(
            os.environ["COSMOS_ENDPOINT"],
            os.environ["COSMOS_KEY"]
        )
        self.database = self.client.get_database_container("devops-swarm")
        
        # Containers
        self.runs = self.database.get_container("runs")
        self.agent_states = self.database.get_container("agent_states")
        self.messages = self.database.get_container("messages")
        self.issues = self.database.get_container("issues")
    
    async def create_run(self, run: Run) -> Run:
        """Create a new agent run."""
        await self.runs.create_item(run.dict())
        return run
    
    async def update_agent_state(self, state: AgentState):
        """Update agent state in real time."""
        await self.agent_states.upsert_item(state.dict())
    
    async def append_message(self, message: AgentMessage):
        """Append agent message to conversation log."""
        await self.messages.create_item(message.dict())
    
    async def get_run_messages(self, run_id: str) -> List[AgentMessage]:
        """Get all messages for a run (for SSE streaming)."""
        query = f"SELECT * FROM c WHERE c.run_id = '{run_id}' ORDER BY c.sequence ASC"
        return list(self.messages.query_items(query, enable_cross_partition_query=True))
```

---

## 5. AI/ML Layer

### 5.1 Azure OpenAI (GPT-4o)

| Agent | Model Config | Temperature | Max Tokens | Purpose |
|-------|-------------|-------------|------------|---------|
| Orchestrator | gpt-4o | 0.3 | 1024 | Issue decomposition |
| Planner | gpt-4o | 0.4 | 2048 | Strategy design |
| Code Writer | gpt-4o | 0.2 | 4096 | Code generation |
| Test Runner | gpt-4o | 0.3 | 1024 | Test result interpretation |
| Security Auditor | gpt-4o | 0.3 | 2048 | Vulnerability analysis |
| PR Opener | gpt-4o | 0.5 | 2048 | PR description writing |

### 5.2 Azure AI Search (Codebase RAG)

```python
# services/search.py
class CodebaseSearch:
    """Vector search over target repository codebase."""
    
    def __init__(self):
        self.client = SearchClient(
            endpoint=os.environ["AI_SEARCH_ENDPOINT"],
            index_name="codebase-index",
            credential=AzureKeyCredential(os.environ["AI_SEARCH_KEY"])
        )
    
    async def index_repo(self, repo_url: str):
        """Index a GitHub repository for RAG."""
        # 1. Clone repo
        # 2. Parse all source files
        # 3. Chunk into 512-token segments
        # 4. Generate embeddings via Azure OpenAI
        # 5. Upload to AI Search index
        pass
    
    async def search_similar_patterns(self, query: str, top_k: int = 5):
        """Find similar code patterns for Planner agent."""
        results = self.client.search(
            search_text=query,
            vector=await self.get_embedding(query),
            top=top_k,
            select=["file_path", "line_start", "code_chunk", "language"]
        )
        return [dict(r) for r in results]
```

### 5.3 Semantic Kernel (Code Execution)

```python
# Code execution plugin for Code Writer agent
import semantic_kernel as sk

kernel = sk.Kernel()

# Add code execution plugin (sandboxed)
kernel.add_plugin(
    PythonCodeExecutionPlugin(),
    plugin_name="code_execution"
)

# Add code validation plugin
kernel.add_plugin(
    CodeSyntaxValidator(),
    plugin_name="code_validator"
)
```

### 5.4 Agent System Prompts

```python
# utils/prompts.py

PLANNER_PROMPT = """
You are the Planner Agent in a DevOps swarm. Your job is to analyze a GitHub issue 
and design a fix strategy.

RULES:
1. You MUST reference actual files and line numbers from the codebase (no invented paths)
2. You MUST query the codebase search to find similar patterns
3. You MUST include a risk assessment (low/medium/high)
4. You MUST include an alternative approach if risk is medium or high

OUTPUT FORMAT (JSON):
{
    "plan": {
        "summary": "Brief description of the fix",
        "files_to_change": ["file.py:42", "config.json:10"],
        "approach": "Step-by-step description",
        "alternatives": ["Alternative approach if main fails"],
        "risk_level": "low|medium|high",
        "estimated_complexity": "trivial|moderate|complex"
    }
}
"""

CODE_WRITER_PROMPT = """
You are the Code Writer Agent in a DevOps swarm. You implement the fix designed by the Planner.

RULES:
1. You MUST only modify files listed in the Planner's output
2. You MUST maintain existing code style (indentation, naming conventions)
3. You MUST NOT add new dependencies unless absolutely necessary
4. You MUST NOT modify .env, credentials, or secrets files
5. You MUST validate your output syntax before broadcasting

OUTPUT FORMAT (JSON):
{
    "diff": "Unified diff format",
    "files_changed": ["file.py", "config.json"],
    "summary": "What was changed and why"
}
"""

SECURITY_AUDITOR_PROMPT = """
You are the Security Auditor Agent in a DevOps swarm. You scan generated code for vulnerabilities.

CHECK FOR:
- SQL injection (string concatenation in queries)
- XSS (unescaped user input in HTML)
- Secrets leakage (API keys, passwords, tokens in code)
- Unsafe deserialization (pickle, yaml.load without SafeLoader)
- Path traversal (unsanitized file paths)
- Insecure dependencies (known CVEs)

OUTPUT FORMAT (JSON):
{
    "passed": true|false,
    "findings": [
        {
            "severity": "critical|high|medium|low",
            "file": "file.py",
            "line": 42,
            "issue": "Description of vulnerability",
            "fix": "Suggested fix"
        }
    ]
}
"""
```

---

## 6. Infrastructure (Azure)

### 6.1 Resource Group & Services

| Resource | SKU/Tier | Purpose |
|----------|---------|---------|
| Azure Container Apps | Consumption (2 vCPU, 4GB) | Backend hosting |
| Azure Static Web Apps | Free tier | Frontend hosting |
| Azure Cosmos DB | Serverless | State + logs |
| Azure Service Bus | Basic | Async issue ingestion |
| Azure API Management | Consumption | Webhook endpoint |
| Azure OpenAI | GPT-4o (East US) | All LLM calls |
| Azure AI Search | Basic | Codebase RAG index |
| Azure Monitor | — | Logging + alerts |

### 6.2 Azure Bicep (Infrastructure as Code)

```bicep
// infra/main.bicep
param location string = resourceGroup().location

// Container Apps Environment
resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'devops-swarm-env'
  location: location
}

// Backend Container App
resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'devops-swarm-api'
  location: location
  properties: {
    environmentId: containerAppsEnv.id
    template: {
      containers: [
        {
          name: 'api'
          image: 'devopsswarmacr.azurecr.io/api:latest'
          resources: {
            cpu: 2
            memory: '4Gi'
          }
          env: [
            { name: 'COSMOS_ENDPOINT', value: cosmos.properties.documentEndpoint }
            { name: 'COSMOS_KEY', value: cosmos.listKeys().primaryMasterKey }
            { name: 'SERVICE_BUS_CONNECTION', value: serviceBus.listKeys().primaryConnectionString }
            { name: 'AZURE_OPENAI_ENDPOINT', value: openai.properties.endpoint }
            { name: 'AZURE_OPENAI_KEY', value: openai.listKeys().key1 }
            { name: 'AI_SEARCH_ENDPOINT', value: search.properties.endpoint }
            { name: 'AI_SEARCH_KEY', value: search.listKeys().primaryKey }
            { name: 'GITHUB_TOKEN', value: githubToken }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
      }
    }
  }
}

// Cosmos DB
resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: 'devops-swarm-cosmos'
  location: location
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    capabilities: [{ name: 'EnableServerless' }]
  }
}

// Service Bus Namespace
resource serviceBus 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: 'devops-swarm-sb'
  location: location
  properties: {
    sku: { name: 'Basic', tier: 'Basic' }
  }
}

// API Management
resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: 'devops-swarm-apim'
  location: location
  properties: {
    publisherName: 'DevOps Swarm'
    publisherEmail: 'admin@devopsswarm.com'
    sku: { name: 'Consumption', capacity: 0 }
  }
}

// Azure OpenAI
resource openai 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: 'devops-swarm-openai'
  location: location
  kind: 'OpenAI'
  properties: {
    sku: { name: 'S0' }
  }
}

// AI Search
resource search 'Microsoft.Search/searchServices@2023-11-01' = {
  name: 'devops-swarm-search'
  location: location
  properties: {
    hostingMode: 'default'
    sku: { name: 'basic' }
  }
}
```

### 6.3 GitHub Actions (CI/CD)

```yaml
# .github/workflows/deploy.yml
name: Deploy DevOps Swarm

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: |
          docker build -t devopsswarmacr.azurecr.io/api:${{ github.sha }} ./backend
      
      - name: Push to ACR
        run: |
          az acr login --name devopsswarmacr
          docker push devopsswarmacr.azurecr.io/api:${{ github.sha }}
      
      - name: Deploy to Container Apps
        run: |
          az containerapp update \
            --name devops-swarm-api \
            --resource-group devops-swarm-rg \
            --image devopsswarmacr.azurecr.io/api:${{ github.sha }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build React app
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Deploy to Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "./frontend/dist"
```

---

## 7. DevOps & Security

### 7.1 GitHub OAuth Setup

```python
# services/github.py
from github import Github

class GitHubService:
    def __init__(self, token: str):
        self.github = Github(token)
    
    async def get_issue(self, repo: str, issue_number: int):
        """Fetch issue details."""
        repository = self.github.get_repo(repo)
        issue = repository.get_issue(issue_number)
        return {
            "title": issue.title,
            "body": issue.body,
            "labels": [l.name for l in issue.labels],
            "url": issue.html_url,
        }
    
    async def create_pull_request(self, repo: str, branch: str, diff: str, title: str, body: str):
        """Create PR with agent-generated content."""
        repository = self.github.get_repo(repo)
        pr = repository.create_pull(
            title=title,
            body=body,
            head=branch,
            base="main"
        )
        return pr.html_url
```

### 7.2 Security Checklist

- [ ] No secrets in codebase (use Azure Key Vault)
- [ ] GitHub token stored in Azure Key Vault, not env vars
- [ ] API Management enforces rate limiting
- [ ] Container App runs as non-root user
- [ ] Cosmos DB has least-privilege access
- [ ] Service Bus uses managed identity, not connection strings
- [ ] All agent outputs validated by Hallucination Guards before execution
- [ ] Test Runner runs in sandboxed environment (no access to prod)

### 7.3 Monitoring

```yaml
# Azure Monitor alerts
alerts:
  - name: "Agent Run Failed"
    condition: "agent_runs_failed > 3 in 5 minutes"
    action: "email + Teams notification"
  
  - name: "LLM Latency High"
    condition: "openai_latency_p95 > 10s in 5 minutes"
    action: "email"
  
  - name: "Cosmos DB Throttled"
    condition: "cosmos_ru_consumed > 80% in 5 minutes"
    action: "email"
```

---

## 8. Day-by-Day Build Plan

### Day 1: Scaffold & Connect Backend
**Owner:** Backend + Infrastructure

| Task | Owner | Status |
|------|-------|--------|
| Set up Python project with Poetry | Backend | ☐ |
| Define all 5 agent system prompts | AI/ML | ☐ |
| Configure Azure OpenAI GPT-4o connection | AI/ML | ☐ |
| Set up GitHub OAuth (PyGithub) | Backend | ☐ |
| Get basic AutoGen GroupChat running in terminal | Backend | ☐ |
| Create Azure resource group + Cosmos DB + Service Bus | Infra | ☐ |
| Write Azure Bicep templates | Infra | ☐ |

### Day 2: Planner + Code Writer AI Core
**Owner:** AI/ML + Backend

| Task | Owner | Status |
|------|-------|--------|
| Implement PlannerAgent with Azure AI Search RAG | AI/ML | ☐ |
| Implement CodeWriterAgent with Semantic Kernel | AI/ML | ☐ |
| Wire Planner → Code Writer message passing | Backend | ☐ |
| Output: working code diff from terminal | Backend | ☐ |
| Index sample repo in Azure AI Search | AI/ML | ☐ |

### Day 3: Test Runner + Security Auditor AI Core
**Owner:** AI/ML + Backend

| Task | Owner | Status |
|------|-------|--------|
| Implement TestRunnerAgent (sandboxed test execution) | Backend | ☐ |
| Implement SecurityAuditorAgent (vulnerability scanning) | AI/ML | ☐ |
| Wire Code Writer → Test Runner feedback loop | Backend | ☐ |
| Wire Code Writer → Security Auditor feedback loop | Backend | ☐ |
| Both agents report back to orchestrator | Backend | ☐ |

### Day 4: PR Agent + Full Pipeline Wiring
**Owner:** Backend

| Task | Owner | Status |
|------|-------|--------|
| Implement PROpenerAgent (branch, commit, PR) | Backend | ☐ |
| Wire all 5 agents into end-to-end flow | Backend | ☐ |
| Implement Hallucination Guards | AI/ML | ☐ |
| Add Azure Service Bus async messaging | Backend | ☐ |
| Test full pipeline on terminal | Backend | ☐ |

### Day 5: Live Dashboard UI
**Owner:** Frontend

| Task | Owner | Status |
|------|-------|--------|
| Scaffold React + Vite project | Frontend | ☐ |
| Build AgentChat streaming panel (SSE) | Frontend | ☐ |
| Build DiffViewer (Monaco Editor) | Frontend | ☐ |
| Build TestResults component | Frontend | ☐ |
| Build SecurityReport component | Frontend | ☐ |
| Build PRStatus component | Frontend | ☐ |
| Zustand store for agent state | Frontend | ☐ |
| Connect to backend SSE endpoint | Frontend | ☐ |

### Day 6: End-to-End Polish + Azure Deploy
**Owner:** Full Stack

| Task | Owner | Status |
|------|-------|--------|
| Deploy backend to Azure Container Apps | Infra | ☐ |
| Deploy frontend to Azure Static Web Apps | Infra | ☐ |
| Set up CI/CD with GitHub Actions | Infra | ☐ |
| Run full pipeline on real GitHub issue | Full Stack | ☐ |
| Fix any end-to-end bugs | Full Stack | ☐ |
| Add Azure Monitor logging | Infra | ☐ |

### Day 7: Pitch + Demo + README
**Owner:** Full Team

| Task | Owner | Status |
|------|-------|--------|
| Record 2-min demo with real bug fix | Full Team | ☐ |
| Write README with architecture diagram | Full Team | ☐ |
| Prep 3-min hackathon pitch | Full Team | ☐ |
| Dry-run demo 3 times | Full Team | ☐ |
| Submit to hackathon | Full Team | ☐ |

---

## 9. File Structure (Final)

```
autonomous-devops-swarm/
├── frontend/                    # React dashboard
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── backend/                     # FastAPI + AutoGen
│   ├── app/
│   ├── pyproject.toml
│   └── Dockerfile
├── infra/                       # Azure Bicep
│   ├── main.bicep
│   └── parameters.json
├── .github/
│   └── workflows/
│       └── deploy.yml
├── PRDs/
│   └── 01-autonomous-devops-swarm.md
├── README.md
└── architecture-diagram.png
```

---

## 10. Environment Variables

```bash
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_KEY=your-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Azure AI Search
AI_SEARCH_ENDPOINT=https://your-search.search.windows.net
AI_SEARCH_KEY=your-key-here
AI_SEARCH_INDEX=codebase-index

# Azure Cosmos DB
COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_KEY=your-key-here
COSMOS_DATABASE=devops-swarm

# Azure Service Bus
SERVICE_BUS_CONNECTION=Endpoint=sb://your-sb.servicebus.windows.net/...

# GitHub
GITHUB_TOKEN=ghp_your-token-here

# Semantic Kernel
SEMANTIC_KERNEL_PLANNER=azure-openai

# Azure Monitor
APPINSIGHTS_INSTRUMENTATIONKEY=your-key-here
```
