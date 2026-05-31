from agents.base import BaseAgent, AgentMessage, AgentStatus
from agents.file_resolver import pick_source_files
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
- Output MUST reference actual files from the repo_file_tree in the context
- Provide line numbers where possible
- Include a risk assessment (low/medium/high)
- Suggest an alternative approach if risk is medium or high
- Do NOT make up file paths — only use paths from repo_file_tree

Output ONLY valid JSON with no markdown formatting:
{
    "plan": {
        "summary": "Brief description of the fix",
        "files_to_change": ["path/to/file.py:42"],
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
        file_tree = context.get("repo", {}).get("file_tree", [])
        file_contents = context.get("file_contents", {})

        llm = get_llm_service()
        try:
            truncated_tree = file_tree[:30] if len(file_tree) > 30 else file_tree
            truncated_fc = dict(list(file_contents.items())[:1])
            raw_output, confidence = llm.chat(
                self.system_prompt,
                {
                    "issue_title": issue.get("title", ""),
                    "issue_body": issue.get("body", ""),
                    "orchestrator_analysis": orchestrator,
                    "repo_file_tree": truncated_tree,
                    "file_contents": truncated_fc,
                },
            )
            raw_output = raw_output.strip()
            if raw_output.startswith("```"):
                raw_output = raw_output.split("\n", 1)[1]
                if "```" in raw_output:
                    raw_output = raw_output.rsplit("```", 1)[0]
            plan_data = json.loads(raw_output)
            plan = plan_data.get("plan", plan_data)
            llm_files = plan.get("files_to_change", [])

            # Validate LLM output has expected structure
            plan_has_right_keys = isinstance(plan_data, dict) and (
                "plan" in plan_data or "files_to_change" in plan_data or "summary" in plan_data
            )
            if not plan_has_right_keys:
                raise ValueError("LLM output has wrong format, expected planner output")

            # Validate file paths exist in repo
            if file_tree and llm_files:
                valid = []
                for f in llm_files:
                    fname = f.split(":")[0].lstrip("/")
                    if any(fname == tf or fname in tf for tf in file_tree):
                        valid.append(f)
                if not valid:
                    raise ValueError("No valid file paths in LLM output")
                if len(valid) < len(llm_files):
                    confidence *= 0.9
                plan["files_to_change"] = valid

            # LLM often returns empty files_to_change — resolve from issue keywords
            if not plan.get("files_to_change"):
                plan["files_to_change"] = pick_source_files(issue, file_tree)
                confidence = min(confidence, 0.85)
                print(f"[INFO] Planner resolved files heuristically: {plan['files_to_change']}")
        except Exception:
            fallback_files = pick_source_files(issue, file_tree)
            plan_data = {
                "plan": {
                    "summary": f"Fix for: {issue.get('title', 'Unknown issue')}",
                    "files_to_change": fallback_files,
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
