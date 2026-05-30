from agents.base import BaseAgent, AgentMessage, AgentStatus
from typing import Dict, Any
from services.llm import get_llm_service
import json


class OrchestratorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="orchestrator",
            system_prompt="""You are the Orchestrator Agent in SwarmOps, an autonomous DevOps system.

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

Output ONLY valid JSON with no markdown formatting:
{
    "fixable": true,
    "complexity": "trivial|moderate|complex",
    "risk_level": "low|medium|high",
    "tasks": [
        {"agent": "planner", "description": "what this agent needs to do", "priority": "high|medium|low"},
        {"agent": "code_writer", "description": "...", "priority": "high|medium|low"},
        {"agent": "test_runner", "description": "...", "priority": "high|medium|low"},
        {"agent": "security_auditor", "description": "...", "priority": "medium|low"},
        {"agent": "pr_opener", "description": "...", "priority": "high|medium|low"}
    ],
    "reasoning": "why this approach was chosen"
}""",
        )

    async def think(self, context: Dict[str, Any]) -> AgentMessage:
        self.set_status(AgentStatus.THINKING, "Analyzing GitHub issue")

        issue = context.get("issue", {})
        repo = context.get("repo", {})

        llm = get_llm_service()
        try:
            raw_output, confidence = llm.chat(
                self.system_prompt,
                {
                    "issue_title": issue.get("title", ""),
                    "issue_body": issue.get("body", ""),
                    "issue_labels": issue.get("labels", []),
                    "repo_language": repo.get("language", "unknown"),
                    "test_framework": repo.get("test_framework", "unknown"),
                },
            )
            raw_output = raw_output.strip()
            if raw_output.startswith("```"):
                raw_output = raw_output.split("\n", 1)[1]
                if "```" in raw_output:
                    raw_output = raw_output.rsplit("```", 1)[0]
            data = json.loads(raw_output)
        except Exception:
            body = issue.get("body", "")
            labels = issue.get("labels", [])
            label_set = [l.lower() for l in labels]
            body_lower = body.lower()

            complexity = "moderate"
            if any(k in label_set or k in body_lower for k in ["bug", "typo", "fix"]):
                complexity = "trivial"
            elif any(k in label_set or k in body_lower for k in ["refactor", "enhancement"]):
                complexity = "moderate"
            elif any(k in body_lower for k in ["architecture", "redesign"]):
                complexity = "complex"

            data = {
                "fixable": True,
                "complexity": complexity,
                "risk_level": "low" if complexity == "trivial" else "medium",
                "tasks": [
                    {
                        "agent": "planner",
                        "description": f"Design fix strategy for: {issue.get('title', '')}",
                        "priority": "high",
                    },
                    {
                        "agent": "code_writer",
                        "description": "Implement the fix",
                        "priority": "high",
                    },
                    {"agent": "test_runner", "description": "Run tests", "priority": "high"},
                    {
                        "agent": "security_auditor",
                        "description": "Audit security",
                        "priority": "medium",
                    },
                    {"agent": "pr_opener", "description": "Open PR", "priority": "high"},
                ],
                "reasoning": f"Issue appears to be a {complexity} fix based on labels and description.",
            }
            confidence = 0.85

        self.set_status(AgentStatus.COMPLETED)
        self.confidence = confidence

        return self.create_message(
            content=f"Analyzed issue #{issue.get('number', 'unknown')}: {issue.get('title', '')}. "
            f"Complexity: {data.get('complexity', 'unknown')}. "
            f"Decomposed into {len(data.get('tasks', []))} tasks.",
            message_type="plan",
            data=data,
        )
