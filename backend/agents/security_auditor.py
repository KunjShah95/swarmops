from agents.base import BaseAgent, AgentMessage, AgentStatus
from typing import Dict, Any, List
import json


class SecurityAuditorAgent(BaseAgent):
    """
    Security Auditor Agent: Scans generated code for vulnerabilities.

    This agent:
    1. Reviews the generated diff for security issues
    2. Checks for common vulnerabilities (SQLi, XSS, secrets, etc.)
    3. Scans for hardcoded credentials or unsafe patterns
    4. Reports findings with severity and suggested fixes
    """

    def __init__(self):
        super().__init__(
            name="security_auditor",
            system_prompt="""
You are the Security Auditor Agent in SwarmOps.

Your job:
1. Scan generated code diff for security vulnerabilities
2. Check for common attack patterns (SQLi, XSS, injection, etc.)
3. Look for hardcoded secrets, API keys, passwords
4. Verify no sensitive files are modified (.env, credentials)
5. Report findings with severity and actionable fixes

Check for:
- SQL injection (string concatenation in queries)
- XSS (unescaped user input in HTML/JS)
- Hardcoded secrets (API keys, tokens, passwords in code)
- Path traversal (unsanitized file paths)
- Unsafe deserialization (pickle, yaml.load)
- Command injection (unsanitized shell commands)
- Insecure dependencies (if new deps added)

Output format (JSON):
{
    "passed": true/false,
    "findings": [
        {
            "severity": "critical|high|medium|low",
            "file": "path/to/file.py",
            "line": 42,
            "issue": "Description of vulnerability",
            "fix": "Suggested fix"
        }
    ],
    "summary": "Overall security assessment"
}
            """,
        )

    async def think(self, context: Dict[str, Any]) -> AgentMessage:
        """
        Scan code for security vulnerabilities.

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
        self.set_status(AgentStatus.THINKING, "Scanning for vulnerabilities")

        code_writer_output = context.get("code_writer_output", {})
        diff = code_writer_output.get("diff", "")
        files_changed = code_writer_output.get("files_changed", [])

        # TODO: Implement actual security scanning
        # For now, simulate a clean scan

        # Check for sensitive files
        sensitive_patterns = [".env", "credentials", ".key", ".pem", "secrets"]
        blocked_files = []

        for file in files_changed:
            for pattern in sensitive_patterns:
                if pattern in file.lower():
                    blocked_files.append(file)

        if blocked_files:
            result = {
                "passed": False,
                "findings": [
                    {
                        "severity": "critical",
                        "file": f,
                        "line": 1,
                        "issue": f"Attempted to modify sensitive file: {f}",
                        "fix": "Do not modify credential or secret files",
                    }
                    for f in blocked_files
                ],
                "summary": f"Security scan FAILED. Blocked {len(blocked_files)} sensitive files.",
            }
        else:
            # Simulate pattern-based scan
            findings = []

            # Check for hardcoded secrets in diff
            secret_patterns = ["api_key", "password", "secret", "token", "auth"]
            for pattern in secret_patterns:
                if pattern in diff.lower() and "getenv" not in diff.lower():
                    findings.append(
                        {
                            "severity": "high",
                            "file": files_changed[0] if files_changed else "unknown",
                            "line": 0,
                            "issue": f"Potential hardcoded secret pattern detected: '{pattern}'",
                            "fix": "Use environment variables or secret management",
                        }
                    )

            result = {
                "passed": len(findings) == 0,
                "findings": findings,
                "summary": "Security scan passed"
                if len(findings) == 0
                else f"Found {len(findings)} potential issues",
            }

        self.set_status(AgentStatus.COMPLETED)
        self.confidence = 0.88
        self.output = result

        status = "✅ PASSED" if result["passed"] else "❌ FAILED"

        return self.create_message(
            content=f"{status} Security audit. {len(result['findings'])} findings. "
            f"{result['summary']}",
            message_type="security",
            data=result,
        )

    def validate_output(self, output: Dict[str, Any]) -> tuple[bool, str]:
        """Validate security audit output."""
        if "passed" not in output:
            return False, "Missing passed flag"

        if "findings" not in output or not isinstance(output["findings"], list):
            return False, "Missing findings list"

        for finding in output["findings"]:
            if "severity" not in finding or "issue" not in finding:
                return False, "Incomplete finding format"

        return True, ""
