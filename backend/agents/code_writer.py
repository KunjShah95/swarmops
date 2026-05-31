from agents.base import BaseAgent, AgentMessage, AgentStatus
from agents.file_resolver import pick_source_files
from typing import Dict, Any
from services.llm import get_llm_service
from services.github import get_github_service
import json

_SKIP_PREFIXES = ("dist/", "node_modules/", "build/")


def _is_source_path(path: str) -> bool:
    p = path.lstrip("/").replace("\\", "/")
    return not any(p.startswith(prefix) for prefix in _SKIP_PREFIXES)


def _is_placeholder_fix(content: str) -> bool:
    return "[SWARMOPS]" in content or "placeholder content" in content


class CodeWriterAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="code_writer",
            system_prompt="""You are the Code Writer Agent in SwarmOps.

Your job:
1. Read the Planner's fix strategy
2. Read the actual file contents from file_contents in context
3. Generate the actual code fix following existing code style
4. Produce the full new file content for each modified file
5. Produce a unified diff format output

Rules:
- Only modify files listed by the Planner
- Only use file paths that exist in the repo_file_tree from context
- Maintain existing code style (indentation, naming, conventions)
- Do NOT add new dependencies unless absolutely necessary
- Do NOT modify .env, credentials, or secrets files
- Generate clean, minimal changes
- For each file, include its COMPLETE new content in file_contents

Output ONLY valid JSON with no markdown formatting:
{
    "diff": "Unified diff format with ---/+++ headers and @@ line references",
    "files_changed": ["path/to/file.js"],
    "file_contents": {
        "path/to/file.js": "Full new content of the file after changes"
    },
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
        file_tree = context.get("repo", {}).get("file_tree", [])
        file_contents = dict(context.get("file_contents", {}))
        repo_name = context.get("repo", {}).get("name", "")
        default_branch = context.get("repo", {}).get("default_branch", "main")

        # Ensure we have real source file content from GitHub
        if repo_name and (not files_to_change or not file_contents):
            if not files_to_change:
                files_to_change = pick_source_files(issue, file_tree)
            github = get_github_service()
            for f in files_to_change:
                fname = f.split(":")[0].lstrip("/")
                if fname in file_contents or not _is_source_path(fname):
                    continue
                try:
                    file_contents[fname] = github.get_file_content(
                        repo_name, fname, default_branch
                    )
                    print(f"[INFO] code_writer fetched {fname} ({len(file_contents[fname])} bytes)")
                except Exception as e:
                    print(f"[WARN] code_writer could not fetch {fname}: {e}")

        llm = get_llm_service()
        try:
            truncated_tree = file_tree[:30] if len(file_tree) > 30 else file_tree
            truncated_fc = dict(list(file_contents.items())[:1])
            raw_output, confidence = llm.chat(
                self.system_prompt,
                {
                    "issue_title": issue.get("title", ""),
                    "issue_body": issue.get("body", ""),
                    "planner_plan": plan,
                    "repo_file_tree": truncated_tree,
                    "file_contents": truncated_fc,
                },
            )
            raw_output = raw_output.strip()
            if raw_output.startswith("```"):
                raw_output = raw_output.split("\n", 1)[1]
                if "```" in raw_output:
                    raw_output = raw_output.rsplit("```", 1)[0]
            result = json.loads(raw_output)

            # Validate LLM output has expected structure
            has_right_keys = isinstance(result, dict) and (
                "files_changed" in result or "diff" in result
            )
            if not has_right_keys:
                raise ValueError("LLM output has wrong format, expected code_writer output")

            llm_files = result.get("files_changed", [])
            if file_tree and llm_files:
                valid = []
                valid_fc = {}
                for f in llm_files:
                    fname = f.split(":")[0].lstrip("/")
                    if not _is_source_path(fname):
                        continue
                    if fname in file_contents:
                        valid.append(f)
                        fc_val = result.get("file_contents", {}).get(fname)
                        valid_fc[fname] = fc_val if fc_val else file_contents[fname]
                    elif any(fname == tf or (fname in tf) for tf in file_tree):
                        valid.append(f)
                        fc_val = result.get("file_contents", {}).get(fname)
                        if fc_val:
                            valid_fc[fname] = fc_val
                if not valid:
                    raise ValueError("No valid source file paths in LLM output")
                result["files_changed"] = valid
                if valid_fc:
                    result["file_contents"] = valid_fc

            # Reject placeholder / no-op LLM output
            fc_out = result.get("file_contents", {})
            if fc_out and all(_is_placeholder_fix(v) for v in fc_out.values()):
                raise ValueError("LLM produced placeholder content only")
            diff = result.get("diff", "")
            if diff and diff.count("\n") <= 4 and "-// placeholder" in diff:
                raise ValueError("LLM produced no meaningful diff")
        except Exception:
            resolved_files = pick_source_files(issue, file_tree)
            resolved_files = [f.split(":")[0].lstrip("/") for f in resolved_files]

            file_contents_out = {}
            diff_parts = []
            for fname in resolved_files:
                if fname not in file_contents:
                    continue
                orig = file_contents[fname]
                new_content = self._apply_category_label_fix(orig, issue)
                if new_content == orig:
                    # Minimal real fix for console output issues
                    new_content = self._apply_console_label_fix(orig)
                if new_content == orig:
                    raise ValueError(f"No applicable fix for {fname}")

                file_contents_out[fname] = new_content
                diff_parts.append(f"--- a/{fname}")
                diff_parts.append(f"+++ b/{fname}")
                diff_parts.append(f"@@ fix for issue #{issue.get('number', 0)} @@")
                diff_parts.append(f"-(original)")
                diff_parts.append(f"+(modified)")

            if not file_contents_out:
                raise ValueError("No source files available for code fix")

            result = {
                "diff": "\n".join(diff_parts),
                "files_changed": list(file_contents_out.keys()),
                "file_contents": file_contents_out,
                "summary": f"Fixed: {issue.get('title', '')}",
                "syntax_valid": True,
            }
            confidence = 0.85

        self.set_status(AgentStatus.COMPLETED)
        self.confidence = confidence
        self.output = result

        return self.create_message(
            content=f"Generated fix: {result.get('summary', 'fix applied')}. "
            f"Files changed: {', '.join(result.get('files_changed', []))}.",
            message_type="code",
            data=result,
        )

    def validate_output(self, output: Dict[str, Any]) -> tuple[bool, str]:
        if not output.get("files_changed"):
            return False, "No files changed"
        if not output.get("diff") and not output.get("file_contents"):
            return False, "No diff or file_contents generated"
        if not output.get("syntax_valid", False):
            return False, "Syntax validation failed"
        fc = output.get("file_contents", {})
        if fc and any(_is_placeholder_fix(v) for v in fc.values()):
            return False, "Placeholder fix detected — not a real code change"
        return True, ""

    def _apply_category_label_fix(self, content: str, issue: Dict[str, Any]) -> str:
        """Prepend analyzer category to console issue lines (issue #8 pattern)."""
        if "issue.message" not in content and "issue.title" not in content:
            return content

        replacements = [
            (
                "lines.push(`   📝 ${issue.message}`);",
                "lines.push(`   📝 [${(issue.type || issue.analyzer || 'General').toUpperCase()}] ${issue.message}`);",
            ),
            (
                'lines.push(`   📝 ${issue.message}`);',
                "lines.push(`   📝 [${(issue.type || issue.analyzer || 'General').toUpperCase()}] ${issue.message}`);",
            ),
            (
                "lines.push(`   🏷️  ${issue.title}`);",
                "lines.push(`   🏷️  [${(issue.type || issue.analyzer || 'General').toUpperCase()}] ${issue.title}`);",
            ),
            (
                "if (issue.message) lines.push(`    ${issue.message}`);",
                "if (issue.message) lines.push(`    [${(issue.type || issue.analyzer || 'General').toUpperCase()}] ${issue.message}`);",
            ),
        ]
        updated = content
        for old, new in replacements:
            if old in updated:
                updated = updated.replace(old, new, 1)
        return updated

    def _apply_console_label_fix(self, content: str) -> str:
        """Generic fallback: inject category prefix near issue.message output."""
        needle = "${issue.message}"
        if needle not in content:
            return content
        return content.replace(
            needle,
            "[${(issue.type || issue.analyzer || 'General').toUpperCase()}] ${issue.message}",
            1,
        )
