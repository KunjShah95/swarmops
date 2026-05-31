"""Heuristic source-file picker when the planner LLM returns no paths."""

from typing import Any, Dict, List

_STOP_WORDS = {
    "the", "a", "an", "in", "to", "for", "of", "and", "is", "it", "on", "at",
    "with", "by", "from", "as", "be", "this", "that", "fix", "bug", "issue",
    "error", "problem", "not", "does", "when", "if", "add", "good", "first",
}

_SOURCE_EXTENSIONS = (".js", ".py", ".ts", ".tsx", ".jsx")
_SKIP_PREFIXES = ("dist/", "node_modules/", "build/", ".git/", "coverage/")

# Issue terms -> path substrings that get a strong boost
_DOMAIN_HINTS = {
    "console": ["console", "output", "report", "print", "format"],
    "output": ["output", "report", "console", "format"],
    "label": ["output", "report", "format", "console"],
    "report": ["report", "output"],
    "version": ["cli", "command", "tui"],
    "security": ["security", "audit", "analyzer"],
    "test": ["test", "spec", "__tests__"],
}


def _issue_keywords(issue: Dict[str, Any]) -> List[str]:
    text = (issue.get("title", "") + " " + issue.get("body", "")).lower()
    return [w for w in text.split() if w.isalnum() and len(w) > 2 and w not in _STOP_WORDS]


def pick_source_files(issue: Dict[str, Any], file_tree: List[str], limit: int = 3) -> List[str]:
    """Return repo paths (with :line suffix) most likely to fix the issue."""
    if not file_tree:
        return ["src/main.js:1"]

    keywords = _issue_keywords(issue)
    scored: List[tuple[int, str]] = []

    for fp in file_tree:
        path_lower = fp.lower().replace("\\", "/")
        if any(path_lower.startswith(p) for p in _SKIP_PREFIXES):
            continue
        if not path_lower.endswith(_SOURCE_EXTENSIONS):
            continue
        # Prefer editable source over compiled/vendor paths
        if not path_lower.startswith("src/") and not path_lower.startswith("backend/"):
            continue

        score = 0
        for kw in keywords:
            if kw in path_lower:
                score += 3
            fn = path_lower.split("/")[-1]
            if kw in fn:
                score += 5
            for hint_kw, paths in _DOMAIN_HINTS.items():
                if hint_kw in kw or kw in hint_kw:
                    if any(p in path_lower for p in paths):
                        score += 8

        # Strong boost for src/output when issue mentions console output
        if "output" in path_lower and any(k in keywords for k in ("console", "output", "label")):
            score += 15
        if "reportgenerator" in path_lower.replace("-", ""):
            score += 10

        if score > 0:
            scored.append((score, fp))

    if scored:
        scored.sort(key=lambda x: -x[0])
        return [f"{scored[0][1]}:1"]

    src_files = [
        f for f in file_tree
        if f.replace("\\", "/").startswith("src/")
        and f.endswith(_SOURCE_EXTENSIONS)
        and not any(f.replace("\\", "/").startswith(p) for p in _SKIP_PREFIXES)
    ]
    if src_files:
        return [f"{src_files[0]}:1"]

    return ["src/main.js:1"]
