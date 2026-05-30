from sqlalchemy import Column, String, DateTime, Integer, Text, Float
from sqlalchemy.sql import func
from database import Base


class Run(Base):
    """Tracks a single agent swarm execution."""

    __tablename__ = "runs"

    id = Column(String, primary_key=True)
    github_issue_url = Column(String, nullable=False)
    github_repo = Column(String, nullable=False)
    issue_number = Column(Integer, nullable=False)
    status = Column(String, default="pending")  # pending, running, completed, failed
    current_agent = Column(String, nullable=True)
    pr_url = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    error = Column(Text, nullable=True)


class AgentMessage(Base):
    """Single message from an agent in the conversation."""

    __tablename__ = "agent_messages"

    id = Column(String, primary_key=True)
    run_id = Column(String, nullable=False)
    agent_name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String, default="status")  # plan, code, test, security, pr, status
    data = Column(Text, nullable=True)  # JSON structured data
    sequence = Column(Integer, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())


class AgentState(Base):
    """Current state of an agent in a run."""

    __tablename__ = "agent_states"

    id = Column(String, primary_key=True)
    run_id = Column(String, nullable=False)
    agent_name = Column(String, nullable=False)
    status = Column(String, default="idle")  # idle, thinking, speaking, waiting, error
    current_task = Column(Text, nullable=True)
    output = Column(Text, nullable=True)  # JSON string
    confidence = Column(Float, default=0.0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
