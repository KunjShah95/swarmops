from agents.base import BaseAgent, AgentMessage, AgentStatus
from typing import Dict, Any
import json


class OrchestratorAgent(BaseAgent):
    """
    Orchestrator Agent: Reads GitHub issue and decomposes into tasks.

    This is the entry point agent. It:
    1. Fetches issue details from GitHub
    2. Analyzes issue complexity
    3. Decomposes into agent tasks
    4. Assigns tasks to appropriate agents
    """

    def __init__(self):
        super().__init__(
            name="orchestrator",
            system_prompt="""
You are the Orchestrator Agent in SwarmOps, an autonomous DevOps system.

Your job:
1. Analyze a GitHub issue and determine if it's fixable by the swarm
2. Decompose the issue into structured tasks for other agents
3. Assess complexity and risk level
4. Create a task queue for the swarm

Rules:
- Only process issues that can be fixed with code changes (not design decisions)
- Provide clear, structured task decomposition
- Estimate complexity (trivial, moderate, complex)
- If issue is too complex or ambiguous, mark it as "needs_human_review"

Output format (JSON):
{
    "fixable": true/false,
    "complexity": "trivial|moderate|complex",
    "risk_level": "low|medium|high",
    "tasks": [
        {
            "agent": "planner|code_writer|test_runner|security|pr_opener",
            "description": "what this agent needs to do",
            "priority": "high|medium|low"
        }
    ],
    "reasoning": "why this approach was chosen"
}
            """,
        )

    async def think(self, context: Dict[str, Any]) -> AgentMessage:
        """
        Analyze GitHub issue and create task decomposition.

        Expected context:
        {
            "issue": {
                "title": "...",
                "body": "...",
                "labels": [...],
                "url": "..."
            },
            "repo": {
                "name": "owner/repo",
                "language": "Python",
                "test_framework": "pytest"
            }
        }
        """
        self.set_status(AgentStatus.THINKING, "Analyzing GitHub issue")

        issue = context.get("issue", {})
        repo = context.get("repo", {})

        # TODO: Call Azure OpenAI to analyze issue
        # For now, return a structured placeholder

        task_queue = [
            {
                "agent": "planner",
                "description": f"Design fix strategy for issue: {issue.get('title', 'Unknown')}",
                "priority": "high",
            },
            {
                "agent": "code_writer",
                "description": "Implement the fix based on planner's strategy",
                "priority": "high",
            },
            {
                "agent": "test_runner",
                "description": "Run test suite against generated fix",
                "priority": "high",
            },
            {
                "agent": "security_auditor",
                "description": "Scan fix for security vulnerabilities",
                "priority": "medium",
            },
            {
                "agent": "pr_opener",
                "description": "Create branch, commit fix, open PR",
                "priority": "high",
            },
        ]

        # Determine complexity based on issue labels/body
        body = issue.get("body", "")
        labels = issue.get("labels", [])

        complexity = "moderate"
        if "bug" in labels or "fix" in body.lower():
            complexity = "trivial"
        elif "refactor" in labels or "enhancement" in labels:
            complexity = "moderate"
        elif "architecture" in body.lower() or "redesign" in body.lower():
            complexity = "complex"

        self.set_status(AgentStatus.COMPLETED)
        self.confidence = 0.85

        return self.create_message(
            content=f"Analyzed issue #{issue.get('number', 'unknown')}: {issue.get('title', '')}. "
            f"Complexity: {complexity}. Decomposed into {len(task_queue)} tasks.",
            message_type="plan",
            data={
                "fixable": True,
                "complexity": complexity,
                "risk_level": "low",
                "tasks": task_queue,
                "reasoning": f"Issue appears to be a straightforward {complexity} fix",
            },
        )
