from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseTool(ABC):
    """
    Base class for all tools in the Agent System V2.
    Tools must implement validate() and execute().
    """
    name: str
    description: str
    input_schema: Dict[str, Any]

    @abstractmethod
    async def validate(self, input_data: Dict[str, Any]) -> bool:
        """
        Validate input parameters from LLM.
        Should raise ValueError if invalid, or return True/False.
        """
        pass
        
    @abstractmethod
    async def execute(self, input_data: Dict[str, Any], user_id: str = None) -> str:
        """
        Execute backend logic and return a string result to LLM.
        user_id is injected securely by the ToolExecutor, not from LLM input.
        """
        pass
