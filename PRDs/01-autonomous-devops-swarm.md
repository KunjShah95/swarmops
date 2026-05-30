# PRD: Autonomous DevOps Swarm

**Hackathon:** Microsoft Build with AI
**Theme:** Agent Swarms — Multi-Agent Orchestration with AutoGen + Azure
**Idea:** GitHub Issue → Agents Plan, Code, Test, Validate → PR opened. Zero humans.

---

## 1. Elevator Pitch

A swarm of 5 specialized AutoGen agents that reads a GitHub issue, debates the fix, writes the code, runs tests, checks for security issues, and opens a pull request — fully autonomous. The live agent conversation panel is the entire demo.

## 2. Problem Statement

**Current state:**
- Every bug fix follows a predictable but slow cycle: read issue → reproduce → plan → code → test → review → PR
- Developer context-switching between these steps costs hours per day
- Simple fixes (typos, config errors, API migrations) consume disproportionate human attention

**Why a swarm?**
- Each step has different expertise requirements — no single agent (or human) is optimal for all of them
- Agents can work in parallel on validation while code is being written
- The deliberation between agents creates a transparent, auditable decision trail

**Judging hook:** Judges have seen AI generate code. They haven't seen 5 AI agents negotiate a production fix live, disagree about approach, and converge on a tested, secure solution.

## 3. Solution Overview

A 5-agent AutoGen GroupChat swarm that ingests a GitHub issue and produces a merged PR:

| Agent | Role | Tool Access | Output |
|-------|------|-------------|--------|
| **Orchestrator** | Reads issue, assigns work, gates progression | GitHub API repo context | Structured task queue |
| **Planner** | Analyzes issue + codebase, designs fix strategy | Azure AI Search (codebase RAG), GitHub API | Plan document |
| **Code Writer** | Generates the fix implementation | Semantic Kernel code plugin, GitHub API | Code diff |
| **Test Runner** | Validates the fix against existing tests | Shell execution (sandboxed), test framework | Test results |
| **Security Auditor** | Scans for vulnerabilities in generated code | Pattern-based scanner, dependency checker | Security report |
| **PR Opener** | Commits, branches, writes PR description | GitHub REST API | Pull request URL |

### Agent Interaction Flow

```
GitHub Issue
    │
    ▼
┌─────────────────────────────────────────────────┐
│              Orchestrator Agent                  │
│  (reads issue, decomposes into tasks)            │
└──────┬──────────┬──────────┬──────────┬─────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │Planner │ │ Code   │ │ Test   │ │Security│
   │        │ │ Writer │ │ Runner │ │Auditor │
   └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
       │          │          │          │
       └──────────┴──────────┴──────────┘
                      │
                      ▼
              ┌──────────────┐
              │  PR Opener   │
              │  Agent       │
              └──────┬───────┘
                     │
                     ▼
              GitHub Pull Request
```

## 4. Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Agent Chat   │  │ Code Diff    │  │ Test       │ │
│  │ Panel (SSE)  │  │ Viewer       │  │ Results    │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
│           Azure Static Web Apps                     │
└──────────────────────┬──────────────────────────────┘
                       │ WebSocket / SSE
┌──────────────────────┴──────────────────────────────┐
│              Backend (FastAPI on ACA)                │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │           AutoGen GroupChat                  │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐           │   │
│  │  │Planner │ │ Writer │ │ Tester │           │   │
│  │  └────────┘ └────────┘ └────────┘           │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐           │   │
│  │  │Security│ │  PR    │ │Orch.   │           │   │
│  │  └────────┘ └────────┘ └────────┘           │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐                  │
│  │ Azure AI    │  │ Azure        │                  │
│  │ Search (RAG)│  │ Service Bus  │                  │
│  └─────────────┘  └──────────────┘                  │
│                    Azure Container Apps              │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│           External Services                          │
│  ┌──────────────────┐  ┌────────────────────────┐   │
│  │  GitHub REST API  │  │  Azure OpenAI GPT-4o   │   │
│  │  (issues, PRs)    │  │  (all agent LLM calls) │   │
│  └──────────────────┘  └────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 5. Technical Implementation

### 5.1 AI Layer

| Component | Details |
|-----------|---------|
| **AutoGen** | v0.4+ GroupChat with custom agent classes. Each agent has a unique system prompt defining its role, constraints, and output schema. |
| **Azure OpenAI** | GPT-4o for all agent reasoning. Temperature 0.2 for code generation, 0.7 for planning. |
| **Azure AI Search** | Vector index of the target repo's codebase. Used by Planner agent to ground fix suggestions in existing patterns. |
| **Semantic Kernel** | Code execution plugin for the Code Writer — sandboxed Python/TypeScript execution to validate generated code syntax before formal testing. |

### 5.2 Inter-Agent Communication

- **Primary:** AutoGen GroupChat with a round-robin speaker selection policy
- **Async fallback:** Azure Service Bus topics — enables agents to post results and continue working without blocking
- **State:** Each agent publishes structured JSON (status, artifacts, confidence score) accessible to all peers

### 5.3 Hallucination Guards

```
Guard 1: Planner must include file:line references from actual repo (no invented code paths)
Guard 2: Code Writer outputs must be valid syntax (verified via SK code plugin before broadcast)
Guard 3: Test Runner must run against actual test suite — hallucinated "passing" tests trigger retry
Guard 4: Security Auditor uses known-vulnerability patterns (SQLi, secrets, injection) plus LLM-based heuristic scan
Guard 5: PR Opener validates the diff is non-empty and doesn't touch .env, secrets, or credentials
```

Each guard failure sends the agent back to revise with a detailed error message appended to its context.

### 5.4 Data Flow

```
1. Orchestrator polls GitHub issue (webhook or poll)
2. Orchestrator enriches with repo context (language, test framework, CI config)
3. Planner receives issue + context, queries AI Search for similar patterns
4. Planner outputs structured plan: files_to_change, approach, risk_level
5. Code Writer implements plan, outputs unified diff
6. Test Runner clones plan's working branch, runs test suite
   → Pass: proceeds | Fail: Code Writer revises with error output
7. Security Auditor scans diff for vulnerabilities
   → Pass: proceeds | Fail: Code Writer revises with security notes
8. PR Opener creates branch, commits, opens PR with agent-generated body
9. Orchestrator reports final status + PR link to frontend
```

## 6. Demo Flow (Critical for Judges)

The demo is structured as a 3-minute live walkthrough:

**0:00–0:30 — The Problem**
- Show a real (trivial) GitHub issue in a public repo
- "A developer has to stop what they're doing, context-switch, fix this, test it, PR it — 20 minutes of interruption"

**0:30–1:30 — The Swarm in Action (live)**
- Click "Auto-Fix" in the React dashboard
- Switch to the Agent Chat Panel — agents appear one by one
- Planner says: "I found the typo in src/config.ts:42 — this matches the pattern in our env setup"
- Code Writer says: "Generating fix — replacing `DATBASE_URL` with `DATABASE_URL`"
- Test Runner says: "All 47 existing tests pass with the change"
- Security Auditor says: "No secrets leaked, no injection vectors introduced"
- PR Opener says: "Opening PR #142 with description based on the issue"

**1:30–2:00 — The Result**
- Switch to GitHub — PR #142 is open with full description, test results embedded
- "25 seconds from issue to PR. Zero human context-switching."

**2:00–3:00 — Architecture Deep Dive**
- Animated diagram showing the 5 agents and how they communicate
- "AutoGen GroupChat for coordination, Azure OpenAI for reasoning, Semantic Kernel for safe code execution"
- "What you just saw was 5 specialized swarms. We can extend this to security patches, dependency updates, API migrations."

### Demo Setup Requirements

| Requirement | Implementation |
|-------------|----------------|
| Pre-seeded repo | A small public GitHub repo with a known bug (typo in env var name) |
| Fast first run | First agent response <5s (SSE streams partial responses immediately) |
| Visual agent disagreement | Optional: inject a moment where Security flags a false positive, causing a 1-round debate |
| Failover demo | Pre-record what happens when tests fail (agent auto-revises) |
| Zero clicking outside demo | All controls in the React dashboard — no alt-tab to terminal |

## 7. User Stories

### Core Flow
```
As a developer, I want to file a GitHub issue and get a tested PR opened automatically
  so I don't have to context-switch away from my current work.

As a maintainer, I want the AI-generated PR to include test evidence and a security audit
  so I can review with confidence rather than skepticism.

As an engineering manager, I want to see the agents' reasoning trail
  so I understand why the fix was chosen over alternatives.
```

### Boundary Cases
```
As a developer, I want the swarm to reject issues it cannot safely fix
  so we don't get broken code merged into our repo.

As a security engineer, I want every AI-generated PR scanned before opening
  so no vulnerable code enters the codebase.

As a devops engineer, I want the swarm to respect our branch protection rules
  so our compliance requirements are still met.
```

## 8. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|----------------|
| Fix success rate | ≥80% of trivial-to-moderate issues produce valid PRs | Run against 10 seeded issues in public repos |
| Agent cycle time | ≤60s from issue read to PR open | Dashboard timer |
| Test pass rate on generated code | 100% of produced PRs pass existing test suite | CI check on PR |
| False positive security flags | ≤1 per 5 PRs | Manual review of security reports |
| Demo reliability | First-try success ≥90% | Dry runs |

## 9. 7-Day Build Plan

| Day | Focus | Deliverables |
|-----|-------|-------------|
| **1** | Scaffold + Connect | AutoGen + Azure OpenAI wired. GitHub OAuth. All 5 agent system prompts defined. GroupChat running in terminal. |
| **2** | Planner + Code Writer | Planner reads issue + repo context. Code Writer generates fix via Semantic Kernel. Output: working code diff. |
| **3** | Test Runner + Security | Test agent runs existing tests against diff. Security agent scans for SQLi, secrets, unsafe patterns. |
| **4** | PR Agent + Full Pipeline | PR Opener creates branch, commits, opens PR. All agents wired end-to-end. |
| **5** | Live Dashboard | React app with streaming agent chat, code diff viewer, test results, PR link. SSE for real-time streaming. |
| **6** | Deploy + Polish | Backend on Azure Container Apps. Frontend on Azure Static Web Apps. Full run on real GitHub issue. |
| **7** | Pitch + Demo | 2-min demo video. README. 3-min pitch: problem → swarm → live demo → impact. |

## 10. Tech Stack

### AI Layer
| Tool | Purpose |
|------|---------|
| AutoGen 0.4+ | Agent orchestration, GroupChat, speaker selection |
| Azure OpenAI (GPT-4o) | All agent reasoning and code generation |
| Azure AI Search | Codebase vector index for Planner RAG |
| Semantic Kernel | Safe code execution plugin |

### Backend / Infra
| Tool | Purpose |
|------|---------|
| FastAPI (Python) | REST API + SSE endpoint for agent streaming |
| Azure Container Apps | Containerized backend hosting |
| Azure Service Bus | Async inter-agent messaging fallback |
| GitHub REST API | Issue reading, branch creation, PR opening |

### Frontend
| Tool | Purpose |
|------|---------|
| React + Vite | Single-page dashboard |
| WebSocket / SSE | Real-time agent message streaming |
| Monaco Editor | Code diff display |
| Azure Static Web Apps | Frontend hosting |

## 11. Resume Bullets

> Built an autonomous multi-agent DevOps system (AutoGen + Azure OpenAI) that triages GitHub issues, generates code fixes, runs tests, and opens pull requests with zero human intervention.

> Architected a 5-agent swarm (Planner, Code Writer, Test Runner, Security Auditor, PR Opener) using AutoGen GroupChat with Azure Service Bus for async inter-agent messaging.

> Deployed containerized agent services on Azure Container Apps with a React + WebSocket dashboard streaming live agent reasoning, diffs, and test results.

> Integrated Semantic Kernel's code execution plugin and Azure AI Search for codebase RAG, reducing agent hallucinations on code generation by grounding responses in repo context.

## 12. Future Vision

Beyond the hackathon, this architecture extends to:

- **Security patch swarm:** Automatically fix known CVEs in dependencies
- **API migration swarm:** Refactor across version bumps (React 17→18, Python 3.10→3.12)
- **Dependency update swarm:** Weekly automated dependency PRs with full test suites
- **Multi-repo orchestration:** One issue touches 3 repos? Swarm handles cross-repo changes

The same 5-agent pattern applies — only the Planner's knowledge base and the Code Writer's tool set change.
