import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from agents.base import AgentRegistry, AgentStatus, agent_registry
from agents.orchestrator import OrchestratorAgent
from agents.planner import PlannerAgent
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
        db = SessionLocal()

        try:
            # Update run status to running
            run = db.query(Run).filter(Run.id == run_id).first()
            if not run:
                print(f"❌ Run {run_id} not found")
                return

            run.status = "running"
            db.commit()

            # Fetch GitHub issue and repo context
            github_service = get_github_service()

            try:
                issue = github_service.get_issue(repo, issue_number)
                repo_context = github_service.get_repo_context(repo)
            except Exception as e:
                run.status = "failed"
                run.error = f"Failed to fetch GitHub data: {str(e)}"
                db.commit()
                return

            # Build shared context
            context = {"issue": issue, "repo": repo_context, "run_id": run_id}

            # Execute agents in sequence
            await self._execute_orchestrator(run_id, context, db)
            await self._execute_planner(run_id, context, db)
            await self._execute_code_writer(run_id, context, db)
            await self._execute_test_runner(run_id, context, db)
            await self._execute_security(run_id, context, db)
            await self._execute_pr_opener(run_id, context, db)

            # Mark run as completed
            run.status = "completed"
            run.completed_at = datetime.now()
            db.commit()

            print(f"✅ Swarm execution completed for run {run_id}")

        except Exception as e:
            # Handle any unexpected errors
            run = db.query(Run).filter(Run.id == run_id).first()
            if run:
                run.status = "failed"
                run.error = str(e)
                db.commit()
            print(f"❌ Swarm execution failed: {str(e)}")

        finally:
            db.close()

    async def _execute_orchestrator(self, run_id: str, context: Dict, db: Session):
        """Execute Orchestrator agent."""
        agent = self.registry.get("orchestrator")
        if not agent:
            return

        # Update agent state
        state = (
            db.query(AgentState)
            .filter(AgentState.run_id == run_id, AgentState.agent_name == "orchestrator")
            .first()
        )

        if state:
            state.status = "thinking"
            db.commit()

        # Execute agent
        message = await agent.think(context)

        # Save message
        msg = AgentMessage(
            id=str(uuid.uuid4()),
            run_id=run_id,
            agent_name=message.agent_name,
            content=message.content,
            message_type=message.message_type,
            data=json.dumps(message.data) if message.data else None,
            sequence=await self._get_next_sequence(run_id, db),
        )
        db.add(msg)

        # Update state
        if state:
            state.status = "completed"
            state.output = json.dumps(message.data) if message.data else None
            db.commit()

        # Update run current agent
        run = db.query(Run).filter(Run.id == run_id).first()
        if run:
            run.current_agent = "planner"
            db.commit()

        # Add orchestrator output to context
        context["orchestrator_output"] = message.data

    async def _execute_planner(self, run_id: str, context: Dict, db: Session):
        """Execute Planner agent."""
        agent = self.registry.get("planner")
        if not agent:
            return

        state = (
            db.query(AgentState)
            .filter(AgentState.run_id == run_id, AgentState.agent_name == "planner")
            .first()
        )

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
            sequence=await self._get_next_sequence(run_id, db),
        )
        db.add(msg)

        if state:
            state.status = "completed"
            state.output = str(message.data)
            db.commit()

        run = db.query(Run).filter(Run.id == run_id).first()
        if run:
            run.current_agent = "code_writer"
            db.commit()

        context["planner_output"] = message.data

    async def _execute_code_writer(self, run_id: str, context: Dict, db: Session):
        """Execute Code Writer agent."""
        agent = self.registry.get("code_writer")
        if not agent:
            return

        state = (
            db.query(AgentState)
            .filter(AgentState.run_id == run_id, AgentState.agent_name == "code_writer")
            .first()
        )

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
            sequence=await self._get_next_sequence(run_id, db),
        )
        db.add(msg)

        if state:
            state.status = "completed"
            state.output = str(message.data)
            db.commit()

        run = db.query(Run).filter(Run.id == run_id).first()
        if run:
            run.current_agent = "test_runner"
            db.commit()

        context["code_writer_output"] = message.data

    async def _execute_test_runner(self, run_id: str, context: Dict, db: Session):
        """Execute Test Runner agent."""
        agent = self.registry.get("test_runner")
        if not agent:
            return

        state = (
            db.query(AgentState)
            .filter(AgentState.run_id == run_id, AgentState.agent_name == "test_runner")
            .first()
        )

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
            sequence=await self._get_next_sequence(run_id, db),
        )
        db.add(msg)

        if state:
            state.status = "completed"
            state.output = str(message.data)
            db.commit()

        run = db.query(Run).filter(Run.id == run_id).first()
        if run:
            run.current_agent = "security_auditor"
            db.commit()

        context["test_runner_output"] = message.data

    async def _execute_security(self, run_id: str, context: Dict, db: Session):
        """Execute Security Auditor agent."""
        agent = self.registry.get("security_auditor")
        if not agent:
            return

        state = (
            db.query(AgentState)
            .filter(AgentState.run_id == run_id, AgentState.agent_name == "security_auditor")
            .first()
        )

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
            sequence=await self._get_next_sequence(run_id, db),
        )
        db.add(msg)

        if state:
            state.status = "completed"
            state.output = str(message.data)
            db.commit()

        run = db.query(Run).filter(Run.id == run_id).first()
        if run:
            run.current_agent = "pr_opener"
            db.commit()

        context["security_auditor_output"] = message.data

    async def _execute_pr_opener(self, run_id: str, context: Dict, db: Session):
        """Execute PR Opener agent."""
        agent = self.registry.get("pr_opener")
        if not agent:
            return

        state = (
            db.query(AgentState)
            .filter(AgentState.run_id == run_id, AgentState.agent_name == "pr_opener")
            .first()
        )

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
            sequence=await self._get_next_sequence(run_id, db),
        )
        db.add(msg)

        if state:
            state.status = "completed"
            state.output = str(message.data)
            db.commit()

        # Update run with PR URL
        run = db.query(Run).filter(Run.id == run_id).first()
        if run and message.data:
            run.pr_url = message.data.get("pr_url")
            run.current_agent = None
            db.commit()

    async def _get_next_sequence(self, run_id: str, db: Session) -> int:
        """Get the next message sequence number for a run."""
        last_msg = (
            db.query(AgentMessage)
            .filter(AgentMessage.run_id == run_id)
            .order_by(AgentMessage.sequence.desc())
            .first()
        )

        return (last_msg.sequence + 1) if last_msg else 1


# Global swarm orchestrator instance
swarm_orchestrator = SwarmOrchestrator()
