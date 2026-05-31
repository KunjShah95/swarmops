from github import Github
from github.Issue import Issue
from github.Repository import Repository
from config import get_settings
from typing import Optional, List, Dict
import base64

settings = get_settings()


class GitHubService:
    """Wrapper for GitHub API operations."""

    def __init__(self):
        self.github = Github(settings.github_token)

    def get_issue(self, repo: str, issue_number: int) -> Dict:
        """Fetch issue details from GitHub."""
        try:
            repository = self.github.get_repo(repo)
            issue = repository.get_issue(issue_number)

            return {
                "number": issue.number,
                "title": issue.title,
                "body": issue.body,
                "state": issue.state,
                "labels": [label.name for label in issue.labels],
                "url": issue.html_url,
                "created_at": issue.created_at.isoformat(),
                "author": issue.user.login,
                "comments": issue.comments,
            }
        except Exception as e:
            raise Exception(f"Failed to fetch issue: {str(e)}")

    def get_repo_context(self, repo: str) -> Dict:
        """Get repository context (language, structure, etc.)."""
        try:
            repository = self.github.get_repo(repo)

            # Get primary language
            language = repository.language

            # Get test framework hints from files
            test_framework = self._detect_test_framework(repository, language)

            return {
                "name": repository.full_name,
                "language": language,
                "test_framework": test_framework,
                "default_branch": repository.default_branch,
                "stars": repository.stargazers_count,
                "description": repository.description,
            }
        except Exception as e:
            raise Exception(f"Failed to fetch repo context: {str(e)}")

    def _detect_test_framework(self, repository: Repository, language: str) -> str:
        """Detect test framework from repository files."""
        test_frameworks = {
            "Python": ["pytest", "unittest", "nose"],
            "JavaScript": ["jest", "mocha", "vitest"],
            "TypeScript": ["jest", "mocha", "vitest"],
            "Java": ["junit", "testng"],
            "Go": ["go test"],
            "Ruby": ["rspec", "minitest"],
        }

        # Check for common test config files
        common_files = [
            "pytest.ini",
            "setup.cfg",
            "pyproject.toml",  # Python
            "jest.config.js",
            "vitest.config.ts",  # JS/TS
            "pom.xml",
            "build.gradle",  # Java
            "go.mod",  # Go
            "Gemfile",
            "Rakefile",  # Ruby
        ]

        try:
            for file in common_files:
                try:
                    repository.get_contents(file)
                    # File exists, infer framework
                    if file == "pytest.ini":
                        return "pytest"
                    elif file == "jest.config.js":
                        return "jest"
                    elif file == "vitest.config.ts":
                        return "vitest"
                except:
                    continue
        except:
            pass

        return test_frameworks.get(language, ["unknown"])[0]

    def get_file_content(self, repo: str, file_path: str, ref: str = None) -> str:
        """Get content of a specific file."""
        try:
            repository = self.github.get_repo(repo)
            content = repository.get_contents(file_path, ref=ref)

            if isinstance(content, list):
                raise Exception("Path is a directory, not a file")

            # Decode base64 content
            return base64.b64decode(content.content).decode("utf-8")
        except Exception as e:
            raise Exception(f"Failed to fetch file: {str(e)}")

    def create_branch(self, repo: str, branch_name: str, base_branch: str = "main") -> str:
        """Create a new branch."""
        try:
            repository = self.github.get_repo(repo)
            base_ref = repository.get_branch(base_branch)
            repository.create_git_ref(ref=f"refs/heads/{branch_name}", sha=base_ref.commit.sha)
            return f"https://github.com/{repo}/tree/{branch_name}"
        except Exception as e:
            raise Exception(f"Failed to create branch: {str(e)}")

    def commit_file(
        self, repo: str, file_path: str, content: str, message: str, branch: str
    ) -> str:
        """Commit a file change."""
        try:
            repository = self.github.get_repo(repo)

            # Try to get existing file to update
            try:
                existing_file = repository.get_contents(file_path, ref=branch)
                repository.update_file(
                    path=file_path,
                    message=message,
                    content=content,
                    sha=existing_file.sha,
                    branch=branch,
                )
            except:
                # File doesn't exist, create it
                repository.create_file(
                    path=file_path, message=message, content=content, branch=branch
                )

            return f"https://github.com/{repo}/blob/{branch}/{file_path}"
        except Exception as e:
            raise Exception(f"Failed to commit file: {str(e)}")

    def create_pull_request(
        self,
        repo: str,
        title: str,
        body: str,
        head_branch: str,
        base_branch: str = "main",
    ) -> str:
        """Create a pull request."""
        try:
            repository = self.github.get_repo(repo)
            pr = repository.create_pull(title=title, body=body, head=head_branch, base=base_branch)
            return pr.html_url
        except Exception as e:
            raise Exception(f"Failed to create PR: {str(e)}")

    def get_repo_file_tree(self, repo: str, branch: str = "main") -> List[str]:
        """Get recursive file tree of a repository."""
        try:
            repository = self.github.get_repo(repo)
            tree = repository.get_git_tree(branch, recursive=True).tree
            return sorted([item.path for item in tree if item.type == "blob"])
        except Exception as e:
            raise Exception(f"Failed to fetch file tree: {str(e)}")

    def get_recent_commits(self, repo: str, limit: int = 10) -> List[Dict]:
        """Get recent commits for context."""
        try:
            repository = self.github.get_repo(repo)
            commits = repository.get_commits()[:limit]

            return [
                {
                    "sha": commit.sha[:7],
                    "message": commit.commit.message,
                    "author": commit.author.login if commit.author else "unknown",
                    "date": commit.commit.author.date.isoformat(),
                }
                for commit in commits
            ]
        except Exception as e:
            raise Exception(f"Failed to fetch commits: {str(e)}")


# Singleton instance
_github_service: Optional[GitHubService] = None


def get_github_service() -> GitHubService:
    """Get or create GitHub service singleton."""
    global _github_service
    if _github_service is None:
        _github_service = GitHubService()
    return _github_service
