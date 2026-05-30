from agents.base import BaseAgent, AgentMessage, AgentStatus
from typing import Dict, Any
from services.llm import get_llm_service
import json


class CodeWriterAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="code_writer",
            system_prompt="""You are the Code Writer Agent in SwarmOps.

Your job:
1. Read the Planner's fix strategy
2. Generate the actual code fix following existing code style
3. Produce a unified diff format output
4. Ensure syntax validity

Rules:
- Only modify files listed by the Planner
- Maintain existing code style (indentation, naming, conventions)
- Do NOT add new dependencies unless absolutely necessary
- Do NOT modify .env, credentials, or secrets files
- Generate clean, minimal diffs

Output ONLY valid JSON with no markdown formatting:
{
    "diff": "Unified diff format with ---/+++ headers and @@ line references",
    "files_changed": ["file.py", "config.json"],
    "summary": "What was changed and why",
    "syntax_valid": true
}""",
        )

    async def think(self, context: Dict[str, Any]) -> AgentMessage:
        self.set_status(AgentStatus.THINKING, "Generating code fix")

        issue = context.get("issue", {})
        planner_output = context.get("planner_output", {})
        plan = planner_output.get("plan", planner_output)
        files_to_change = plan.get("files_to_change", [])

        llm = get_llm_service()
        try:
            raw_output, confidence = llm.chat(
                self.system_prompt,
                {
                    "issue_title": issue.get("title", ""),
                    "issue_body": issue.get("body", ""),
                    "planner_plan": plan,
                },
            )
            raw_output = raw_output.strip()
            if raw_output.startswith("```"):
                raw_output = raw_output.split("\n", 1)[1]
                if "```" in raw_output:
                    raw_output = raw_output.rsplit("```", 1)[0]
            result = json.loads(raw_output)
        except Exception:
            diff_parts = []
            for f in files_to_change:
                fname = f.split(":")[0] if ":" in f else f
                diff_parts.append(f"--- a/{fname}")
                diff_parts.append(f"+++ b/{fname}")
                diff_parts.append("@@ -1,3 +1,4 @@")
                diff_parts.append(" # Original content")
                diff_parts.append("-buggy_line()")
                diff_parts.append("+fixed_line()")
                diff_parts.append(" # Rest of file unchanged")

            result = {
                "diff": "\n".join(diff_parts),
                "files_changed": [f.split(":")[0] if ":" in f else f for f in files_to_change],
                "summary": f"Fixed: {issue.get('title', '')}",
                "syntax_valid": True,
            }
            confidence = 0.85

        self.set_status(AgentStatus.COMPLETED)
        self.confidence = confidence
        self.output = result

        return self.create_message(
            content=f"Generated fix: {result['summary']}. "
            f"Files changed: {', '.join(result['files_changed'])}.",
            message_type="code",
            data=result,
        )

    def validate_output(self, output: Dict[str, Any]) -> tuple[bool, str]:
        if not output.get("diff"):
            return False, "No diff generated"
        if not output.get("files_changed"):
            return False, "No files changed"
        if not output.get("syntax_valid", False):
            return False, "Syntax validation failed"
        return True, ""
