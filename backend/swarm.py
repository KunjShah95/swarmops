import asyncio
import json
import os
import shutil
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from agents.base import AgentRegistry, AgentStatus, agent_registry
from agents.orchestrator import OrchestratorAgent
from agents.planner import PlannerAgent
from agents.file_resolver import pick_source_files
from agents.code_writer import CodeWriterAgent
from agents.test_runner import TestRunnerAgent
from agents.security_auditor import SecurityAuditorAgent
from agents.pr_opener import PROpenerAgent
from models import Run, AgentMessage, AgentState
from services.github import get_github_service
from database import SessionLocal


class SwarmOrchestrator:
    """
    Orchestrates the agent swarm execution.

    Manages agent registration, execution flow, and database updates.
    """

    def __init__(self):
        self.registry = AgentRegistry()
        self._register_agents()

    def _register_agents(self):
        """Register all swarm agents."""
        self.registry.register(OrchestratorAgent())
        self.registry.register(PlannerAgent())
        self.registry.register(CodeWriterAgent())
        self.registry.register(TestRunnerAgent())
        self.registry.register(SecurityAuditorAgent())
        self.registry.register(PROpenerAgent())

    async def execute(self, run_id: str, repo: str, issue_number: int):
        """
        Execute the full agent swarm workflow.

        Args:
            run_id: Unique run identifier
            repo: GitHub repo in format "owner/repo"
            issue_number: GitHub issue number
        """
        from config import get_settings
        settings = get_settings()

        db = SessionLocal()
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        local_repo_path = os.path.join(backend_dir, ".temp_repos", run_id)

        try:
            # Update run status to running
            run = db.query(Run).filter(Run.id == run_id).first()
            if not run:
                print(f"[FAIL] Run {run_id} not found")
                return

            run.status = "running"
            
            orchestrator_state = db.query(AgentState).filter(
                AgentState.run_id == run_id, AgentState.agent_name == "orchestrator"
            ).first()
            if orchestrator_state:
                orchestrator_state.status = "thinking"
                
            db.commit()

            # Fetch GitHub issue and repo context
            github_service = get_github_service()

            try:
                issue = github_service.get_issue(repo, issue_number)
                repo_context = github_service.get_repo_context(repo)
            except Exception as e:
                print(f"[WARN] GitHub fetch failed: {e}. Using fallback context.")
                issue = {
                    "number": issue_number,
                    "title": f"Issue #{issue_number} in {repo}",
                    "body": "Fix a bug in the application. The issue involves incorrect behavior in a core function.",
                    "state": "open",
                    "labels": ["bug"],
                    "url": f"https://github.com/{repo}/issues/{issue_number}",
                    "created_at": "2026-01-01T00:00:00",
                    "author": "hackathon-user",
                    "comments": 0,
                }
                repo_context = {
                    "name": repo,
                    "language": "Python",
                    "test_framework": "pytest",
                    "default_branch": "main",
                    "stars": 0,
                    "description": "A sample repository for the SwarmOps demo.",
                }

            # Fetch repo file tree so agents know what files exist
            try:
                file_tree = github_service.get_repo_file_tree(
                    repo, repo_context.get("default_branch", "main")
                )
                repo_context["file_tree"] = file_tree
                print(f"[INFO] Repo file tree: {len(file_tree)} files")
            except Exception as e:
                print(f"[WARN] Could not fetch file tree: {e}")
                repo_context["file_tree"] = []

            # Perform cloning or mock setup
            os.makedirs(local_repo_path, exist_ok=True)
            is_mock_run = False
            try:
                token = settings.github_token
                is_dummy = not token or token.startswith("github_pat_11BE6NCS") or "your_token" in token
                if is_dummy:
                    raise Exception("Using placeholder GITHUB_TOKEN, skipping clone.")
                github_service.clone_repository(
                    repo, repo_context.get("default_branch", "main"), local_repo_path
                )
            except Exception as e:
                print(f"[WARN] Clone repository failed: {e}. Setting up local mock repository.")
                is_mock_run = True
                mock_files = {
                    "src/main.js": (
                        "// SwarmOps Mock Application Core\n"
                        "function processReport(data) {\n"
                        "  console.log(\"Processing report data...\");\n"
                        "  const lines = [];\n"
                        "  const issue = data;\n"
                        "  if (issue) {\n"
                        "    lines.push(`   📝 ${issue.message}`);\n"
                        "  }\n"
                        "  return lines;\n"
                        "}\n"
                        "module.exports = { processReport };\n"
                    ),
                    "tests/test_report.js": (
                        "const assert = require('assert');\n"
                        "const { processReport } = require('../src/main');\n\n"
                        "try {\n"
                        "  const lines = processReport({ message: 'Error found', type: 'bug' });\n"
                        "  assert.ok(lines.length > 0, 'Should return output lines');\n"
                        "  assert.ok(lines[0].includes('[BUG]'), 'Category label [BUG] should be prepended to the message');\n"
                        "  console.log('Tests passed!');\n"
                        "} catch (e) {\n"
                        "  console.error('Test assertion failed:', e.message);\n"
                        "  process.exit(1);\n"
                        "}\n"
                    ),
                    "package.json": (
                        "{\n"
                        "  \"name\": \"mock-app\",\n"
                        "  \"version\": \"1.0.0\",\n"
                        "  \"scripts\": {\n"
                        "    \"test\": \"node tests/test_report.js\"\n"
                        "  }\n"
                        "}\n"
                    )
                }
                for fname, fcontent in mock_files.items():
                    fpath = os.path.join(local_repo_path, fname)
                    os.makedirs(os.path.dirname(fpath), exist_ok=True)
                    with open(fpath, "w", encoding="utf-8") as f:
                        f.write(fcontent)
                repo_context["file_tree"] = list(mock_files.keys())

            # Build shared context
            context = {
                "issue": issue,
                "repo": repo_context,
                "run_id": run_id,
                "local_repo_path": local_repo_path,
                "is_mock_run": is_mock_run
            }

            # Execute agents in sequence
            await self._execute_orchestrator(run_id, context)
            await self._execute_planner(run_id, context)

            # Fetch file contents for files the planner identified
            planner_output = context.get("planner_output", {})
            plan = (
                planner_output.get("plan", planner_output)
                if isinstance(planner_output, dict)
                else {}
            )
            files_to_change = plan.get("files_to_change", [])
            if not files_to_change:
                files_to_change = pick_source_files(issue, repo_context.get("file_tree", []))
                plan["files_to_change"] = files_to_change
                context["planner_output"] = {"plan": plan}
                print(f"[INFO] Swarm resolved files heuristically: {files_to_change}")

            file_contents = {}
            for f in files_to_change:
                fname = f.split(":")[0] if ":" in f else f
                fname = fname.lstrip("/")
                fpath = os.path.join(local_repo_path, fname)
                try:
                    if os.path.exists(fpath):
                        with open(fpath, "r", encoding="utf-8") as file_obj:
                            file_contents[fname] = file_obj.read()
                    else:
                        content = github_service.get_file_content(
                            repo, fname, repo_context.get("default_branch", "main")
                        )
                        file_contents[fname] = content
                except Exception as e2:
                    print(f"[WARN] Could not fetch {fname}: {e2}")
            context["file_contents"] = file_contents
            print(f"[INFO] Loaded {len(file_contents)} file(s) for code_writer context")

            await self._execute_code_writer(run_id, context)

            # Parallel execution of Test Runner and Security Auditor
            await asyncio.gather(
                self._execute_test_runner(run_id, context),
                self._execute_security(run_id, context)
            )

            await self._execute_pr_opener(run_id, context)

            # Refetch run to update status cleanly
            run = db.query(Run).filter(Run.id == run_id).first()
            if run:
                run.status = "completed"
                run.completed_at = datetime.now()
                db.commit()

            print(f"[OK] Swarm execution completed for run {run_id}")

        except Exception as e:
            # Handle any unexpected errors
            run = db.query(Run).filter(Run.id == run_id).first()
            if run:
                run.status = "failed"
                run.error = str(e)
                db.commit()
            print(f"[FAIL] Swarm execution failed: {str(e)}")

        finally:
            db.close()
            # Clean up local repo directory
            try:
                if os.path.exists(local_repo_path):
                    import time
                    time.sleep(0.5)
                    shutil.rmtree(local_repo_path)
            except Exception as cleanup_err:
                print(f"[WARN] Failed to clean up temp repo directory: {cleanup_err}")

    async def _execute_orchestrator(self, run_id: str, context: Dict):
        """Execute Orchestrator agent."""
        agent = self.registry.get("orchestrator")
        if not agent:
            return

        db = SessionLocal()
        try:
            state = db.query(AgentState).filter(
                AgentState.run_id == run_id, AgentState.agent_name == "orchestrator"
            ).first()

            if state:
                state.status = "thinking"
                db.commit()

            message = await agent.think(context)

            msg = AgentMessage(
                id=str(uuid.uuid4()),
                run_id=run_id,
                agent_name=message.agent_name,
                content=message.content,
                message_type=message.message_type,
                data=json.dumps(message.data) if message.data else None,
                sequence=await self._get_next_sequence(run_id),
            )
            db.add(msg)

            if state:
                state.status = "completed"
                state.output = json.dumps(message.data) if message.data else None
                state.confidence = agent.confidence
                state.current_task = agent.current_task
                state.started_at = agent.started_at
                state.completed_at = agent.completed_at
                db.commit()

            run = db.query(Run).filter(Run.id == run_id).first()
            if run:
                run.current_agent = "planner"
                db.commit()

            context["orchestrator_output"] = message.data
        finally:
            db.close()

    async def _execute_planner(self, run_id: str, context: Dict):
        """Execute Planner agent."""
        agent = self.registry.get("planner")
        if not agent:
            return

        db = SessionLocal()
        try:
            state = db.query(AgentState).filter(
                AgentState.run_id == run_id, AgentState.agent_name == "planner"
            ).first()

            if state:
                state.status = "thinking"
                db.commit()

            message = await agent.think(context)

            msg = AgentMessage(
                id=str(uuid.uuid4()),
                run_id=run_id,
                agent_name=message.agent_name,
                content=message.content,
                message_type=message.message_type,
                data=json.dumps(message.data) if message.data else None,
                sequence=await self._get_next_sequence(run_id),
            )
            db.add(msg)

            if state:
                state.status = "completed"
                state.output = json.dumps(message.data) if message.data else None
                state.confidence = agent.confidence
                state.current_task = agent.current_task
                state.started_at = agent.started_at
                state.completed_at = agent.completed_at
                db.commit()

            run = db.query(Run).filter(Run.id == run_id).first()
            if run:
                run.current_agent = "code_writer"
                db.commit()

            context["planner_output"] = message.data
        finally:
            db.close()

    async def _execute_code_writer(self, run_id: str, context: Dict):
        """Execute Code Writer agent."""
        agent = self.registry.get("code_writer")
        if not agent:
            return

        db = SessionLocal()
        try:
            state = db.query(AgentState).filter(
                AgentState.run_id == run_id, AgentState.agent_name == "code_writer"
            ).first()

            if state:
                state.status = "thinking"
                db.commit()

            message = await agent.think(context)

            # Write code_writer's modified file_contents back to the local_repo_path
            # so the subsequent parallel agents (test_runner, security) read the modified version!
            local_repo_path = context.get("local_repo_path")
            cw_data = message.data or {}
            modified_contents = cw_data.get("file_contents", {})
            if local_repo_path and os.path.exists(local_repo_path) and modified_contents:
                for fname, fcontent in modified_contents.items():
                    fpath = os.path.join(local_repo_path, fname)
                    os.makedirs(os.path.dirname(fpath), exist_ok=True)
                    with open(fpath, "w", encoding="utf-8") as file_obj:
                        file_obj.write(fcontent)
                print(f"[INFO] Wrote {len(modified_contents)} updated file(s) to local repository.")

            msg = AgentMessage(
                id=str(uuid.uuid4()),
                run_id=run_id,
                agent_name=message.agent_name,
                content=message.content,
                message_type=message.message_type,
                data=json.dumps(message.data) if message.data else None,
                sequence=await self._get_next_sequence(run_id),
            )
            db.add(msg)

            if state:
                state.status = "completed"
                state.output = json.dumps(message.data) if message.data else None
                state.confidence = agent.confidence
                state.current_task = agent.current_task
                state.started_at = agent.started_at
                state.completed_at = agent.completed_at
                db.commit()

            run = db.query(Run).filter(Run.id == run_id).first()
            if run:
                run.current_agent = "test_runner"
                db.commit()

            context["code_writer_output"] = message.data
        finally:
            db.close()

    async def _execute_test_runner(self, run_id: str, context: Dict):
        """Execute Test Runner agent."""
        agent = self.registry.get("test_runner")
        if not agent:
            return

        db = SessionLocal()
        try:
            state = db.query(AgentState).filter(
                AgentState.run_id == run_id, AgentState.agent_name == "test_runner"
            ).first()

            if state:
                state.status = "thinking"
                db.commit()

            message = await agent.think(context)

            msg = AgentMessage(
                id=str(uuid.uuid4()),
                run_id=run_id,
                agent_name=message.agent_name,
                content=message.content,
                message_type=message.message_type,
                data=json.dumps(message.data) if message.data else None,
                sequence=await self._get_next_sequence(run_id),
            )
            db.add(msg)

            if state:
                state.status = "completed"
                state.output = json.dumps(message.data) if message.data else None
                state.confidence = agent.confidence
                state.current_task = agent.current_task
                state.started_at = agent.started_at
                state.completed_at = agent.completed_at
                db.commit()

            context["test_runner_output"] = message.data
        finally:
            db.close()

    async def _execute_security(self, run_id: str, context: Dict):
        """Execute Security Auditor agent."""
        agent = self.registry.get("security_auditor")
        if not agent:
            return

        db = SessionLocal()
        try:
            state = db.query(AgentState).filter(
                AgentState.run_id == run_id, AgentState.agent_name == "security_auditor"
            ).first()

            if state:
                state.status = "thinking"
                db.commit()

            message = await agent.think(context)

            msg = AgentMessage(
                id=str(uuid.uuid4()),
                run_id=run_id,
                agent_name=message.agent_name,
                content=message.content,
                message_type=message.message_type,
                data=json.dumps(message.data) if message.data else None,
                sequence=await self._get_next_sequence(run_id),
            )
            db.add(msg)

            if state:
                state.status = "completed"
                state.output = json.dumps(message.data) if message.data else None
                state.confidence = agent.confidence
                state.current_task = agent.current_task
                state.started_at = agent.started_at
                state.completed_at = agent.completed_at
                db.commit()

            context["security_auditor_output"] = message.data
        finally:
            db.close()

    async def _execute_pr_opener(self, run_id: str, context: Dict):
        """Execute PR Opener agent."""
        agent = self.registry.get("pr_opener")
        if not agent:
            return

        db = SessionLocal()
        try:
            state = db.query(AgentState).filter(
                AgentState.run_id == run_id, AgentState.agent_name == "pr_opener"
            ).first()

            if state:
                state.status = "thinking"
                db.commit()

            message = await agent.think(context)

            msg = AgentMessage(
                id=str(uuid.uuid4()),
                run_id=run_id,
                agent_name=message.agent_name,
                content=message.content,
                message_type=message.message_type,
                data=json.dumps(message.data) if message.data else None,
                sequence=await self._get_next_sequence(run_id),
            )
            db.add(msg)

            if state:
                state.status = "completed"
                state.output = json.dumps(message.data) if message.data else None
                state.confidence = agent.confidence
                state.current_task = agent.current_task
                state.started_at = agent.started_at
                state.completed_at = agent.completed_at
                db.commit()

            # Update run with PR URL
            run = db.query(Run).filter(Run.id == run_id).first()
            if run:
                run.pr_url = message.data.get("pr_url") if message.data else None
                run.current_agent = None
                db.commit()
        finally:
            db.close()

    async def _get_next_sequence(self, run_id: str) -> int:
        """Get the next message sequence number for a run."""
        db = SessionLocal()
        try:
            last_msg = (
                db.query(AgentMessage)
                .filter(AgentMessage.run_id == run_id)
                .order_by(AgentMessage.sequence.desc())
                .first()
            )
            return (last_msg.sequence + 1) if last_msg else 1
        finally:
            db.close()


# Global swarm orchestrator instance
swarm_orchestrator = SwarmOrchestrator()
