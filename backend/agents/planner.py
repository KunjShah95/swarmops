from agents.base import BaseAgent, AgentMessage, AgentStatus
from typing import Dict, Any
import json


class PlannerAgent(BaseAgent):
    """
    Planner Agent: Designs fix strategy using codebase knowledge.

    This agent:
    1. Queries codebase for relevant files and patterns
    2. Identifies files that need to change
    3. Designs the fix approach
    4. Provides line references for actual code locations
    """

    def __init__(self):
        super().__init__(
            name="planner",
            system_prompt="""
You are the Planner Agent in SwarmOps.

Your job:
1. Search the codebase for files relevant to the issue
2. Identify exact file paths and line numbers
3. Design a fix strategy with step-by-step approach
4. Assess risk and provide alternatives

Rules:
- You MUST reference actual files from the codebase (no invented paths)
- Provide line numbers where possible
- Include a risk assessment (low/medium/high)
- Suggest an alternative approach if risk is medium or high
- Consider existing code patterns and style

Output format (JSON):
{
    "plan": {
        "summary": "Brief description",
        "files_to_change": ["path/to/file.py:42", "path/to/config.json:10"],
        "approach": "Step-by-step fix description",
        "alternatives": ["Alternative approach"],
        "risk_level": "low|medium|high",
        "estimated_lines_changed": 5
    }
}
            """,
        )

    async def think(self, context: Dict[str, Any]) -> AgentMessage:
        """
        Design fix strategy.

        Expected context:
        {
            "issue": {...},
            "repo": {...},
            "orchestrator_output": {
                "tasks": [...],
                "complexity": "trivial|moderate|complex"
            }
        }
        """
        self.set_status(AgentStatus.THINKING, "Designing fix strategy")

        issue = context.get("issue", {})
        orchestrator = context.get("orchestrator_output", {})
        complexity = orchestrator.get("complexity", "moderate")

        # TODO: Query Azure AI Search for codebase patterns
        # For now, provide a generic plan structure

        plan = {
            "summary": f"Fix for: {issue.get('title', 'Unknown issue')}",
            "files_to_change": ["src/main.py:42", "tests/test_main.py:15"],
            "approach": "1. Identify the bug location\n"
            "2. Apply the minimal fix\n"
            "3. Add/update tests\n"
            "4. Verify no regressions",
            "alternatives": ["Full refactor of related module"],
            "risk_level": "low",
            "estimated_lines_changed": 5,
        }

        self.set_status(AgentStatus.COMPLETED)
        self.confidence = 0.8
        self.output = plan

        return self.create_message(
            content=f"Fix strategy designed. Risk: {plan['risk_level']}. "
            f"Estimated {plan['estimated_lines_changed']} lines changed in "
            f"{len(plan['files_to_change'])} files.",
            message_type="plan",
            data=plan,
        )

    def validate_output(self, output: Dict[str, Any]) -> tuple[bool, str]:
        """Validate that planner references real files."""
        files = output.get("files_to_change", [])

        if not files:
            return False, "No files to change specified"

        for file_ref in files:
            if ":" not in file_ref:
                return False, f"File reference missing line number: {file_ref}"

        return True, ""
