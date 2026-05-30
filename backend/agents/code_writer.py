from agents.base import BaseAgent, AgentMessage, AgentStatus
from typing import Dict, Any
import json


class CodeWriterAgent(BaseAgent):
    """
    Code Writer Agent: Generates the actual code fix.

    This agent:
    1. Reads relevant files from GitHub
    2. Applies the fix based on planner's strategy
    3. Generates a unified diff
    4. Validates syntax before broadcasting
    """

    def __init__(self):
        super().__init__(
            name="code_writer",
            system_prompt="""
You are the Code Writer Agent in SwarmOps.

Your job:
1. Read the files identified by the Planner
2. Generate the fix following existing code style
3. Produce a unified diff format output
4. Ensure syntax validity

Rules:
- Only modify files listed by the Planner
- Maintain existing code style (indentation, naming, conventions)
- Do NOT add new dependencies unless absolutely necessary
- Do NOT modify .env, credentials, or secrets files
- Generate clean, minimal diffs
- Validate syntax before outputting

Output format (JSON):
{
    "diff": "Unified diff format",
    "files_changed": ["file.py", "config.json"],
    "summary": "What was changed and why",
    "syntax_valid": true/false
}
            """,
        )

    async def think(self, context: Dict[str, Any]) -> AgentMessage:
        """
        Generate code fix.

        Expected context:
        {
            "issue": {...},
            "repo": {...},
            "planner_output": {
                "plan": {
                    "files_to_change": [...],
                    "approach": "..."
                }
            }
        }
        """
        self.set_status(AgentStatus.THINKING, "Generating code fix")

        issue = context.get("issue", {})
        planner_output = context.get("planner_output", {})
        plan = planner_output.get("plan", {})
        files_to_change = plan.get("files_to_change", [])

        # TODO: Call Azure OpenAI to generate fix
        # TODO: Validate syntax using Semantic Kernel

        # Placeholder diff
        diff = """--- a/src/main.py
+++ b/src/main.py
@@ -40,7 +40,7 @@
     def connect():
-        url = os.getenv("DATBASE_URL")
+        url = os.getenv("DATABASE_URL")
         return create_engine(url)
"""

        result = {
            "diff": diff,
            "files_changed": ["src/main.py"],
            "summary": f"Fixed typo in environment variable name for issue: {issue.get('title', '')}",
            "syntax_valid": True,
        }

        self.set_status(AgentStatus.COMPLETED)
        self.confidence = 0.9
        self.output = result

        return self.create_message(
            content=f"Generated fix: {result['summary']}. "
            f"Files changed: {', '.join(result['files_changed'])}.",
            message_type="code",
            data=result,
        )

    def validate_output(self, output: Dict[str, Any]) -> tuple[bool, str]:
        """Validate that code output has valid syntax."""
        if not output.get("diff"):
            return False, "No diff generated"

        if not output.get("files_changed"):
            return False, "No files changed"

        if not output.get("syntax_valid", False):
            return False, "Syntax validation failed"

        return True, ""
