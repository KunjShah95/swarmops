from agents.base import BaseAgent, AgentMessage, AgentStatus
from typing import Dict, Any, List
from services.llm import get_llm_service
import json


class SecurityAuditorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="security_auditor",
            system_prompt="""You are the Security Auditor Agent in SwarmOps.

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
- Unsafe deserialization
- Command injection (unsanitized shell commands)
- Insecure dependencies

Output ONLY valid JSON with no markdown formatting:
{
    "passed": true,
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
}""",
        )

    async def think(self, context: Dict[str, Any]) -> AgentMessage:
        self.set_status(AgentStatus.THINKING, "Scanning for vulnerabilities")

        code_writer_output = context.get("code_writer_output", {})
        diff = code_writer_output.get("diff", "")
        files_changed = code_writer_output.get("files_changed", [])

        # Block sensitive files immediately (rule-based, no LLM needed)
        sensitive_patterns = [".env", "credentials", ".key", ".pem", "secrets"]
        blocked_files = [
            f for f in files_changed if any(p in f.lower() for p in sensitive_patterns)
        ]

        if blocked_files:
            findings = [
                {
                    "severity": "critical",
                    "file": f,
                    "line": 1,
                    "issue": f"Attempted to modify sensitive file: {f}",
                    "fix": "Do not modify credential or secret files",
                }
                for f in blocked_files
            ]
            result = {
                "passed": False,
                "findings": findings,
                "summary": f"Security scan FAILED. Blocked {len(blocked_files)} sensitive files.",
            }
            confidence = 0.99
        else:
            llm = get_llm_service()
            try:
                raw_output, confidence = llm.chat(
                    self.system_prompt,
                    {
                        "diff_content": diff[:3000],
                        "files_changed": files_changed,
                    },
                )
                raw_output = raw_output.strip()
                if raw_output.startswith("```"):
                    raw_output = raw_output.split("\n", 1)[1]
                    if "```" in raw_output:
                        raw_output = raw_output.rsplit("```", 1)[0]
                result = json.loads(raw_output)
            except Exception:
                findings = []
                secret_patterns = ["api_key", "password", "secret", "token", "auth"]
                for pattern in secret_patterns:
                    if pattern in diff.lower() and "getenv" not in diff.lower():
                        findings.append(
                            {
                                "severity": "high",
                                "file": files_changed[0] if files_changed else "unknown",
                                "line": 0,
                                "issue": f"Potential hardcoded secret: '{pattern}'",
                                "fix": "Use environment variables or secret management",
                            }
                        )
                result = {
                    "passed": len(findings) == 0,
                    "findings": findings,
                    "summary": "Security scan passed"
                    if not findings
                    else f"Found {len(findings)} potential issues",
                }
                confidence = 0.88

        self.set_status(AgentStatus.COMPLETED)
        self.confidence = confidence
        self.output = result

        status = "[OK] PASSED" if result["passed"] else "[FAIL] FAILED"

        return self.create_message(
            content=f"{status} Security audit. {len(result['findings'])} findings. "
            f"{result['summary']}",
            message_type="security",
            data=result,
        )

    def validate_output(self, output: Dict[str, Any]) -> tuple[bool, str]:
        if "passed" not in output:
            return False, "Missing passed flag"
        if "findings" not in output or not isinstance(output["findings"], list):
            return False, "Missing findings list"
        for finding in output["findings"]:
            if "severity" not in finding or "issue" not in finding:
                return False, "Incomplete finding format"
        return True, ""
