import logging
import asyncio
from typing import Dict, Any, Tuple

from app.services.module_5_ai_chatbot.ai.tools.registry import ToolRegistry

logger = logging.getLogger(__name__)

class ToolExecutor:
    """
    Executes a requested tool safely.
    Responsible for timeout handling, exception catching, and returning
    safe string responses back to the LLM.
    """

    @staticmethod
    async def execute_tool_call(
        tool_name: str, 
        arguments: Dict[str, Any], 
        allowed_tools: list[str],
        user_id: str = None
    ) -> Tuple[bool, str]:
        """
        Executes a tool and returns (success_status, result_string).
        """
        # 1. Permission check
        if tool_name not in allowed_tools:
            err_msg = f"Security Error: Tool '{tool_name}' is not allowed for this agent."
            logger.warning(err_msg)
            return False, err_msg
            
        # 2. Registry lookup
        tool = ToolRegistry.get_tool(tool_name)
        if not tool:
            err_msg = f"System Error: Tool '{tool_name}' is not registered in the system."
            logger.error(err_msg)
            return False, err_msg
            
        # 3. Execution with Timeout & Try-Catch
        try:
            # Validate
            await tool.validate(arguments)
            
            # Execute with timeout (e.g., 10 seconds)
            result = await asyncio.wait_for(tool.execute(arguments, user_id=user_id), timeout=10.0)
            
            return True, result
            
        except asyncio.TimeoutError:
            err_msg = f"Execution Error: Tool '{tool_name}' timed out after 10 seconds."
            logger.error(err_msg)
            return False, err_msg
            
        except Exception as e:
            err_msg = f"Execution Error in Tool '{tool_name}': {str(e)}"
            logger.error(err_msg)
            # We return the error to the LLM so it can attempt a self-correction or apologize to user.
            return False, err_msg
