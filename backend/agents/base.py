from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum
import json


class AgentStatus(str, Enum):
    """Agent status states."""

    IDLE = "idle"
    THINKING = "thinking"
    SPEAKING = "speaking"
    WAITING = "waiting"
    ERROR = "error"
    COMPLETED = "completed"


class AgentMessage:
    """Message sent by an agent."""

    def __init__(
        self,
        agent_name: str,
        content: str,
        message_type: str = "status",
        data: Optional[Dict] = None,
    ):
        self.agent_name = agent_name
        self.content = content
        self.message_type = message_type
        self.data = data or {}
        self.timestamp = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent": self.agent_name,
            "content": self.content,
            "type": self.message_type,
            "data": self.data,
            "timestamp": self.timestamp.isoformat(),
        }


class BaseAgent(ABC):
    """Base class for all swarm agents."""

    def __init__(self, name: str, system_prompt: str):
        self.name = name
        self.system_prompt = system_prompt
        self.status = AgentStatus.IDLE
        self.current_task: Optional[str] = None
        self.output: Optional[Dict] = None
        self.confidence: float = 0.0
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None

    def set_status(self, status: AgentStatus, task: str = None):
        """Update agent status."""
        self.status = status
        if task:
            self.current_task = task

        if status == AgentStatus.THINKING:
            self.started_at = datetime.now()
        elif status in [AgentStatus.COMPLETED, AgentStatus.ERROR]:
            self.completed_at = datetime.now()

    @abstractmethod
    async def think(self, context: Dict[str, Any]) -> AgentMessage:
        """
        Main reasoning method for the agent.

        Args:
            context: Shared context from previous agents

        Returns:
            AgentMessage with the agent's output
        """
        pass

    def validate_output(self, output: Dict[str, Any]) -> tuple[bool, str]:
        """
        Validate agent output. Override in subclasses.

        Returns:
            (is_valid, error_message)
        """
        return True, ""

    def create_message(
        self, content: str, message_type: str = "status", data: Optional[Dict] = None
    ) -> AgentMessage:
        """Create an agent message."""
        return AgentMessage(
            agent_name=self.name, content=content, message_type=message_type, data=data
        )

    def to_dict(self) -> Dict[str, Any]:
        """Serialize agent state."""
        return {
            "name": self.name,
            "status": self.status.value,
            "current_task": self.current_task,
            "confidence": self.confidence,
            "output": self.output,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat()
            if self.completed_at
            else None,
        }


class AgentRegistry:
    """Registry to manage and access all agents."""

    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}

    def register(self, agent: BaseAgent):
        """Register an agent."""
        self.agents[agent.name] = agent

    def get(self, name: str) -> Optional[BaseAgent]:
        """Get an agent by name."""
        return self.agents.get(name)

    def get_all(self) -> Dict[str, BaseAgent]:
        """Get all registered agents."""
        return self.agents.copy()

    def get_statuses(self) -> Dict[str, Dict]:
        """Get status of all agents."""
        return {name: agent.to_dict() for name, agent in self.agents.items()}


# Global registry
agent_registry = AgentRegistry()
