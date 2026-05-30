from pydantic import BaseModel, Field, HttpUrl


class RepositoryRef(BaseModel):
    owner: str = Field(min_length=1)
    name: str = Field(min_length=1)
    url: HttpUrl | None = None

    @property
    def slug(self) -> str:
        return f"{self.owner}/{self.name}"


class IssueInput(BaseModel):
    number: int | None = Field(default=None, ge=1)
    title: str = Field(min_length=1)
    body: str = ""
    repository: RepositoryRef
    labels: list[str] = Field(default_factory=list)
    source_url: HttpUrl | None = None


class RunRequest(BaseModel):
    issue: IssueInput
