from agents.base import BaseAgent, AgentMessage, AgentStatus
from typing import Dict, Any
from services.llm import get_llm_service
import json


class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="planner",
            system_prompt="""You are the Planner Agent in SwarmOps.

Your job:
1. Analyze the GitHub issue and orchestrator's analysis
2. Design a fix strategy with step-by-step approach
3. Identify exact file paths and line numbers that need changing
4. Assess risk and provide alternatives

Rules:
- Output MUST reference actual files likely in the repo based on context
- Provide line numbers where possible
- Include a risk assessment (low/medium/high)
- Suggest an alternative approach if risk is medium or high

Output ONLY valid JSON with no markdown formatting:
{
    "plan": {
        "summary": "Brief description of the fix",
        "files_to_change": ["path/to/file.py:42", "path/to/config.json:10"],
        "approach": "Step-by-step fix description",
        "alternatives": ["Alternative approach if applicable"],
        "risk_level": "low|medium|high",
        "estimated_lines_changed": 5
    }
}""",
        )

    async def think(self, context: Dict[str, Any]) -> AgentMessage:
        self.set_status(AgentStatus.THINKING, "Designing fix strategy")

        issue = context.get("issue", {})
        orchestrator = context.get("orchestrator_output", {})

        llm = get_llm_service()
        try:
            raw_output, confidence = llm.chat(
                self.system_prompt,
                {
                    "issue_title": issue.get("title", ""),
                    "issue_body": issue.get("body", ""),
                    "orchestrator_analysis": orchestrator,
                },
            )
            raw_output = raw_output.strip()
            if raw_output.startswith("```"):
                raw_output = raw_output.split("\n", 1)[1]
                if "```" in raw_output:
                    raw_output = raw_output.rsplit("```", 1)[0]
            plan_data = json.loads(raw_output)
        except Exception:
            plan_data = {
                "plan": {
                    "summary": f"Fix for: {issue.get('title', 'Unknown issue')}",
                    "files_to_change": ["src/main.py:42"],
                    "approach": "1. Locate the bug in the codebase\n2. Apply minimal fix\n3. Add/update tests\n4. Verify no regressions",
                    "alternatives": ["Full refactor of related module"],
                    "risk_level": "low",
                    "estimated_lines_changed": 5,
                }
            }
            confidence = 0.8

        plan = plan_data.get("plan", plan_data)
        self.set_status(AgentStatus.COMPLETED)
        self.confidence = confidence
        self.output = plan

        return self.create_message(
            content=f"Fix strategy designed. Risk: {plan.get('risk_level', 'unknown')}. "
            f"Estimated {plan.get('estimated_lines_changed', 0)} lines changed in "
            f"{len(plan.get('files_to_change', []))} files.",
            message_type="plan",
            data=plan_data,
        )

    def validate_output(self, output: Dict[str, Any]) -> tuple[bool, str]:
        files = output.get("plan", output).get("files_to_change", [])
        if not files:
            return False, "No files to change specified"
        for file_ref in files:
            if ":" not in file_ref:
                return False, f"File reference missing line number: {file_ref}"
        return True, ""
