from typing import Dict, List, Optional
import logging

from app.services.module_5_ai_chatbot.ai.tools.base import BaseTool

logger = logging.getLogger(__name__)

class ToolRegistry:
    """
    Singleton registry for all available tools in the system.
    """
    _instance = None
    _tools: Dict[str, BaseTool] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ToolRegistry, cls).__new__(cls)
            cls._tools = {}
        return cls._instance

    @classmethod
    def register(cls, tool: BaseTool):
        if tool.name in cls._tools:
            logger.warning(f"Tool {tool.name} is already registered. Overwriting.")
        cls._tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")

    @classmethod
    def get_tool(cls, name: str) -> Optional[BaseTool]:
        return cls._tools.get(name)

    @classmethod
    def get_allowed_tools(cls, allowed_names: List[str]) -> List[BaseTool]:
        """
        Returns a list of tools that are present in the allowed_names list.
        """
        if not allowed_names:
            return []
        
        allowed_tools = []
        for name in allowed_names:
            tool = cls.get_tool(name)
            if tool:
                allowed_tools.append(tool)
            else:
                logger.warning(f"Config requested tool '{name}', but it is not registered.")
        return allowed_tools

    @classmethod
    def get_all_tools_schema(cls, allowed_names: List[str]) -> List[dict]:
        """
        Returns the JSON schema of allowed tools to pass to the LLM.
        """
        tools = cls.get_allowed_tools(allowed_names)
        schemas = []
        for t in tools:
            schemas.append({
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description,
                    "parameters": t.input_schema
                }
            })
        return schemas
