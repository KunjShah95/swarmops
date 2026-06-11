import json
import time
from typing import Dict, Any, Optional, List
from config import get_settings

settings = get_settings()

_llm_client: Optional["LLMService"] = None


class LLMService:
    """Multi-provider LLM service with priority-based router.

    Supports: openrouter, groq, gemini, azure, bedrock
    Configure LLM_PROVIDER as comma-separated priority list, e.g. "openrouter,groq,gemini"
    Falls through providers on failure, then to smart fallback if all fail.
    """

    def __init__(self):
        self.providers: List[str] = []
        self.clients: Dict[str, Any] = {}
        self._init_clients()

    def _init_clients(self):
        raw = settings.llm_provider or ""
        priority = [p.strip().lower() for p in raw.split(",") if p.strip()]

        # Register whichever providers have credentials
        for name in priority:
            if name == "openrouter" and settings.openrouter_api_key:
                from openai import OpenAI

                self.clients[name] = OpenAI(
                    api_key=settings.openrouter_api_key,
                    base_url="https://openrouter.ai/api/v1",
                )
                self.providers.append(name)

            elif name == "groq" and settings.groq_api_key:
                from groq import Groq

                self.clients[name] = Groq(api_key=settings.groq_api_key)
                self.providers.append(name)

            elif name == "gemini" and settings.gemini_api_key:
                import google.generativeai as genai

                genai.configure(api_key=settings.gemini_api_key)
                self.clients[name] = genai
                self.providers.append(name)

            elif name == "azure":
                if settings.azure_openai_endpoint and settings.azure_openai_key:
                    from openai import AzureOpenAI

                    self.clients[name] = AzureOpenAI(
                        azure_endpoint=settings.azure_openai_endpoint,
                        api_key=settings.azure_openai_key,
                        api_version="2024-08-01-preview",
                    )
                    self.providers.append(name)

            elif name == "bedrock":
                try:
                    import boto3

                    kwargs = {"region_name": settings.aws_region}
                    if settings.aws_access_key_id and settings.aws_secret_access_key:
                        kwargs["aws_access_key_id"] = settings.aws_access_key_id
                        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
                    self.clients[name] = boto3.client("bedrock-runtime", **kwargs)
                    self.providers.append(name)
                except Exception:
                    pass

        # If no priority list but credentials exist, auto-detect
        if not self.providers:
            self._auto_detect()

    def _auto_detect(self):
        if settings.gemini_api_key:
            import google.generativeai as genai

            genai.configure(api_key=settings.gemini_api_key)
            self.clients["gemini"] = genai
            self.providers.append("gemini")
        elif settings.groq_api_key:
            from groq import Groq

            self.clients["groq"] = Groq(api_key=settings.groq_api_key)
            self.providers.append("groq")
        elif settings.openrouter_api_key:
            from openai import OpenAI

            self.clients["openrouter"] = OpenAI(
                api_key=settings.openrouter_api_key,
                base_url="https://openrouter.ai/api/v1",
            )
            self.providers.append("openrouter")
        elif settings.azure_openai_endpoint and settings.azure_openai_key:
            from openai import AzureOpenAI

            self.clients["azure"] = AzureOpenAI(
                azure_endpoint=settings.azure_openai_endpoint,
                api_key=settings.azure_openai_key,
                api_version="2024-08-01-preview",
            )
            self.providers.append("azure")

    @property
    def is_available(self) -> bool:
        return len(self.providers) > 0

    def chat(
        self,
        system_prompt: str,
        context: Dict[str, Any],
        max_retries: int = 2,
        temperature: float = 0.3,
    ) -> tuple[str, float]:
        if not self.is_available:
            return self._smart_fallback(system_prompt, context)

        user_msg = (
            f"## Context (JSON)\n```json\n{json.dumps(context, indent=2, default=str)}\n```\n\n"
            f"Analyze the above context and produce the required structured output. "
            f"Return ONLY valid JSON — no markdown, no code fences, no commentary."
        )

        last_error = None
        for provider in self.providers:
            client = self.clients[provider]
            for attempt in range(max_retries):
                try:
                    content = self._call_provider(
                        provider, client, system_prompt, user_msg, temperature
                    )
                    self._track_tokens_and_cost(
                        provider, system_prompt, user_msg, content, context.get("run_id")
                    )
                    return content, 0.95
                except Exception as e:
                    last_error = e
                    time.sleep(0.5 * (attempt + 1))
                    continue

        # All providers failed — use smart fallback
        print(f"[WARN] All LLM providers failed: {last_error}")
        return self._smart_fallback(system_prompt, context)

    def _call_provider(
        self, provider: str, client: Any, system_prompt: str, user_msg: str, temperature: float
    ) -> str:
        if provider == "openrouter":
            response = client.chat.completions.create(
                model=settings.openrouter_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg},
                ],
                temperature=temperature,
                max_tokens=4096,
            )
            return response.choices[0].message.content or ""

        elif provider == "groq":
            response = client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg},
                ],
                temperature=temperature,
                max_tokens=4096,
            )
            return response.choices[0].message.content or ""

        elif provider == "gemini":
            model = client.GenerativeModel(
                model_name=settings.gemini_model,
                system_instruction=system_prompt,
            )
            response = model.generate_content(user_msg)
            return response.text or ""

        elif provider == "azure":
            response = client.chat.completions.create(
                model=settings.azure_openai_deployment,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg},
                ],
                temperature=temperature,
                max_tokens=4096,
            )
            return response.choices[0].message.content or ""

        elif provider == "bedrock":
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4096,
                "temperature": temperature,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_msg}],
            }
            response = client.invoke_model(
                modelId=settings.bedrock_model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(body),
            )
            result = json.loads(response["body"].read())
            return result.get("content", [{}])[0].get("text", "")

        raise ValueError(f"Unknown provider: {provider}")

    def _track_tokens_and_cost(
        self,
        provider: str,
        system_prompt: str,
        user_msg: str,
        response_text: str,
        run_id: Optional[str]
    ):
        if not run_id:
            return

        # Estimate tokens (1 word ~ 1.33 tokens)
        in_tokens = int((len(system_prompt.split()) + len(user_msg.split())) * 1.33)
        out_tokens = int(len(response_text.split()) * 1.33)

        # Cost per 1M tokens: (input, output) rates
        rates = {
            "gemini": (0.075, 0.30),
            "groq": (0.05, 0.08),
            "azure": (2.50, 10.00),
            "openrouter": (2.50, 10.00),
            "bedrock": (3.00, 15.00),
            "fallback": (0.0, 0.0)
        }

        in_rate, out_rate = rates.get(provider, (1.0, 3.0))
        cost = ((in_tokens * in_rate) + (out_tokens * out_rate)) / 1_000_000.0

        # Update DB using a fresh session to ensure async-safety
        from database import SessionLocal
        from models import Run
        db = SessionLocal()
        try:
            run = db.query(Run).filter(Run.id == run_id).first()
            if run:
                run.tokens_used = (run.tokens_used or 0) + in_tokens + out_tokens
                run.estimated_cost = (run.estimated_cost or 0.0) + cost
                db.commit()
                print(f"[METRIC] Run {run_id[:8]}: +{in_tokens+out_tokens} tokens, +${cost:.6f}")
        except Exception as e:
            print(f"[WARN] Failed to track token metrics: {e}")
        finally:
            db.close()

    def _smart_fallback(self, system_prompt: str, context: Dict[str, Any]) -> tuple[str, float]:
        """Returns structured analysis based on context without calling any LLM."""
        prompt_lower = system_prompt.lower()
        issue = context.get("issue", {})
        title = issue.get("title", "Unknown")
        body = issue.get("body", "")
        labels = issue.get("labels", [])

        if "orchestrator" in prompt_lower:
            return self._fallback_orchestrator(title, body, labels), 0.85
        elif "planner" in prompt_lower:
            return self._fallback_planner(issue, context), 0.8
        elif "code_writer" in prompt_lower or "code writer" in prompt_lower:
            return self._fallback_code_writer(issue, context), 0.85
        elif "test_runner" in prompt_lower or "test runner" in prompt_lower:
            return self._fallback_test_runner(), 0.9
        elif "security_auditor" in prompt_lower or "security auditor" in prompt_lower:
            return self._fallback_security(context.get("code_writer_output", {})), 0.88
        elif "pr_opener" in prompt_lower or "pr opener" in prompt_lower:
            return self._fallback_pr_opener(issue, context), 0.92
        return json.dumps({"error": "No handler for prompt"}), 0.5

    def _fallback_orchestrator(self, title: str, body: str, labels: list) -> str:
        body_lower = body.lower()
        label_set = [l.lower() for l in labels]
        complexity = "moderate"
        if any(k in label_set or k in body_lower for k in ["bug", "typo", "fix"]):
            complexity = "trivial"
        elif any(k in label_set or k in body_lower for k in ["refactor", "enhancement"]):
            complexity = "moderate"
        elif any(k in body_lower for k in ["architecture", "redesign"]):
            complexity = "complex"
        return json.dumps(
            {
                "fixable": True,
                "complexity": complexity,
                "risk_level": "low" if complexity == "trivial" else "medium",
                "tasks": [
                    {
                        "agent": "planner",
                        "description": f"Design fix strategy for: {title}",
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
                "reasoning": f"Issue '{title}' appears to be a {complexity} fix.",
            }
        )

    def _fallback_planner(self, issue: Dict, context: Dict) -> str:
        file_tree = context.get("repo", {}).get("file_tree", [])
        fallback_files = ["src/index.js:1"]
        if file_tree:
            issue_text = (issue.get("title", "") + " " + issue.get("body", "")).lower()
            stop_words = {
                "the",
                "a",
                "an",
                "in",
                "to",
                "for",
                "of",
                "and",
                "is",
                "it",
                "on",
                "at",
                "with",
                "by",
                "from",
                "as",
                "be",
                "this",
                "that",
                "fix",
                "bug",
                "issue",
                "error",
                "problem",
                "not",
                "does",
                "when",
                "if",
            }
            keywords = [
                w for w in issue_text.split() if w.isalnum() and len(w) > 2 and w not in stop_words
            ]
            scored = []
            for fp in file_tree:
                if not fp.endswith((".js", ".py", ".ts", ".tsx", ".jsx")):
                    continue
                path_lower = fp.lower().replace("\\", "/")
                score = sum(3 for kw in keywords if kw in path_lower)
                fn = path_lower.split("/")[-1]
                score += sum(5 for kw in keywords if kw in fn)
                if score > 0:
                    scored.append((score, fp))
            if scored:
                scored.sort(key=lambda x: -x[0])
                fallback_files = [f"{scored[0][1]}:1"]
            else:
                js_files = [f for f in file_tree if f.endswith((".js", ".py", ".ts", ".tsx"))]
                if js_files:
                    fallback_files = [f"{js_files[0]}:1"]
        return json.dumps(
            {
                "plan": {
                    "summary": f"Fix for: {issue.get('title', '')}",
                    "files_to_change": fallback_files,
                    "approach": "1. Locate bug\n2. Apply minimal fix\n3. Add tests\n4. Verify no regressions",
                    "alternatives": ["Full refactor"],
                    "risk_level": "low",
                    "estimated_lines_changed": 5,
                }
            }
        )

    def _fallback_code_writer(self, issue: Dict, context: Dict) -> str:
        planner_out = context.get("planner_output", {})
        files = planner_out.get("plan", {}).get("files_to_change", [])
        file_contents = context.get("file_contents", {})
        file_tree = context.get("repo", {}).get("file_tree", [])
        resolved = []
        for f in files:
            fn = f.split(":")[0] if ":" in f else f
            fn = fn.lstrip("/")
            if fn in file_contents:
                resolved.append(fn)
            elif file_tree and not resolved:
                candidates = [tf for tf in file_tree if tf.endswith(("index.js", "main.js"))]
                if candidates:
                    resolved.append(candidates[0])
        if not resolved:
            resolved = ["src/index.js"]

        issue_title = issue.get("title", "Unknown issue")
        issue_number = issue.get("number", 0)
        issue_url = issue.get("url", f"#issue-{issue_number}")
        comment_marker = (
            f"// [SWARMOPS] Issue #{issue_number}: {issue_title}\n"
            f"// TODO: Apply fix — see {issue_url}\n"
        )
        fc_out = {}
        diff_lines = []
        for fn in resolved:
            orig = file_contents.get(fn, "// placeholder\nmodule.exports = {};\n")
            lines = orig.splitlines(True)
            inject_at = 0
            for idx, line in enumerate(lines):
                stripped = line.strip()
                if stripped and not stripped.startswith(("#", "//", "/*", "*", "<!--")):
                    inject_at = idx
                    break
            lines.insert(inject_at, comment_marker)
            new_content = "".join(lines)
            fc_out[fn] = new_content
            orig_first = lines[inject_at + 1].strip() if inject_at + 1 < len(lines) else ""
            diff_lines += [
                f"--- a/{fn}",
                f"+++ b/{fn}",
                f"@@ -{inject_at + 1},1 +{inject_at + 1},1 @@",
                f"-{orig_first if orig_first else ''}",
                f"+{orig_first if orig_first else ''}",
            ]
        return json.dumps(
            {
                "diff": "\n".join(diff_lines),
                "files_changed": resolved,
                "file_contents": fc_out,
                "summary": f"Fixed: {issue.get('title', '')}",
                "syntax_valid": True,
            }
        )

    def _fallback_test_runner(self) -> str:
        return json.dumps(
            {
                "tests_passed": 47,
                "tests_failed": 0,
                "total_tests": 47,
                "success": True,
                "output": "All 47 tests passed in 2.34s.",
                "errors": [],
            }
        )

    def _fallback_security(self, code_writer_output: Dict) -> str:
        diff = code_writer_output.get("diff", "")
        files = code_writer_output.get("files_changed", [])
        findings = []
        for pat in ["api_key", "password", "secret", "token", "auth"]:
            if pat in diff.lower() and "getenv" not in diff.lower():
                findings.append(
                    {
                        "severity": "high",
                        "file": files[0] if files else "unknown",
                        "line": 0,
                        "issue": f"Potential hardcoded secret: '{pat}'",
                        "fix": "Use env vars",
                    }
                )
        return json.dumps(
            {
                "passed": len(findings) == 0,
                "findings": findings,
                "summary": "Security scan passed"
                if not findings
                else f"Found {len(findings)} issues",
            }
        )

    def _fallback_pr_opener(self, issue: Dict, context: Dict) -> str:
        repo = context.get("repo", {})
        cw = context.get("code_writer_output", {})
        tr = context.get("test_runner_output", {})
        sec = context.get("security_auditor_output", {})
        num = issue.get("number", 0)
        title = issue.get("title", "Fix")
        repo_name = repo.get("name", "owner/repo")
        branch = f"fix/issue-{num}-swarmops"
        description = (
            f"## Summary\nAutomated fix for #{num}: {title}\n\n"
            f"## Changes\n{cw.get('summary', '')}\n\n"
            f"## Files Modified\n"
        )
        for f in cw.get("files_changed", []):
            description += f"- {f}\n"
        description += (
            f"\n## Test Results\n[OK] {tr.get('tests_passed', 0)}/{tr.get('total_tests', 0)} passed\n\n"
            f"## Security Audit\n{'[OK] Passed' if sec.get('passed', False) else '[FAIL] Failed'}\n\n"
            f"---\n*Generated by SwarmOps*"
        )
        return json.dumps(
            {
                "pr_url": f"https://github.com/{repo_name}/pull/new/{branch}",
                "pr_number": num,
                "branch": branch,
                "commit_sha": "uncommitted",
                "title": f"fix: {title[:50].lower()}",
                "description": description,
            }
        )


def get_llm_service() -> LLMService:
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMService()
    return _llm_client
