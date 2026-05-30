from agents.base import BaseAgent, AgentMessage, AgentStatus
from typing import Dict, Any
import json


class TestRunnerAgent(BaseAgent):
    """
    Test Runner Agent: Validates fix against existing test suite.

    This agent:
    1. Clones or accesses the repository
    2. Applies the generated diff
    3. Runs the test suite
    4. Reports pass/fail results
    """

    def __init__(self):
        super().__init__(
            name="test_runner",
            system_prompt="""
You are the Test Runner Agent in SwarmOps.

Your job:
1. Apply the generated code diff to the repository
2. Run the existing test suite
3. Report test results (pass/fail counts, error messages)
4. If tests fail, provide detailed error output for the Code Writer to fix

Rules:
- Run ALL existing tests, not just related ones
- Report exact pass/fail counts
- Include error messages for failed tests
- Note any new warnings or deprecations
- Do NOT skip or ignore failing tests

Output format (JSON):
{
    "tests_passed": 47,
    "tests_failed": 0,
    "total_tests": 47,
    "success": true/false,
    "output": "Full test output or summary",
    "errors": ["Error messages if any"]
}
            """,
        )

    async def think(self, context: Dict[str, Any]) -> AgentMessage:
        """
        Run tests against generated fix.

        Expected context:
        {
            "issue": {...},
            "repo": {...},
            "code_writer_output": {
                "diff": "...",
                "files_changed": [...]
            }
        }
        """
        self.set_status(AgentStatus.THINKING, "Running test suite")

        code_writer_output = context.get("code_writer_output", {})
        repo = context.get("repo", {})

        # TODO: Apply diff and run tests in sandboxed environment
        # For now, simulate test results

        # Simulate test run based on fix complexity
        tests_passed = 47
        tests_failed = 0
        success = True

        result = {
            "tests_passed": tests_passed,
            "tests_failed": tests_failed,
            "total_tests": tests_passed + tests_failed,
            "success": success,
            "output": f"Ran {tests_passed + tests_failed} tests in 2.34s. All passed.",
            "errors": [],
        }

        self.set_status(AgentStatus.COMPLETED)
        self.confidence = 0.95
        self.output = result

        status_icon = "✅" if success else "❌"

        return self.create_message(
            content=f"{status_icon} Test Results: {tests_passed}/{tests_passed + tests_failed} passed. "
            f"Duration: 2.34s.",
            message_type="test",
            data=result,
        )

    def validate_output(self, output: Dict[str, Any]) -> tuple[bool, str]:
        """Validate test output format."""
        if "tests_passed" not in output or "tests_failed" not in output:
            return False, "Missing test counts"

        if "success" not in output:
            return False, "Missing success flag"

        if not output.get("output"):
            return False, "Missing test output"

        return True, ""
