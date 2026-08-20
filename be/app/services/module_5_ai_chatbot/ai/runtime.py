import logging
import json
from typing import AsyncGenerator
from sqlalchemy.orm import Session

from app.models.module_5_ai_chatbot.agent_config import AgentConfig
from app.services.module_5_ai_chatbot.ai.provider import ProviderFactory
from app.services.module_5_ai_chatbot.ai.tools.registry import ToolRegistry
from app.services.module_5_ai_chatbot.ai.tools.executor import ToolExecutor
# Assuming ContextBuilder and PromptBuilder will be implemented/refactored
from app.services.module_5_ai_chatbot.ai.context_builder import AIContextBuilder
from app.services.module_5_ai_chatbot.ai.prompt_builder import PromptBuilder

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 5

class AgentRuntime:
    """
    The Core Execution Engine of the Agent System V2.
    It orchestrates the Context, Prompt, Tool execution, and LLM communication.
    """
    def __init__(self, db: Session, config: AgentConfig, user_id: str):
        self.db = db
        self.config = config
        self.user_id = user_id
        self.provider = ProviderFactory.get_provider_for_model(self.config.model_name)

    async def execute_chat(self, user_message: str, session_id: str) -> AsyncGenerator[str, None]:
        """
        Main execution loop for a chat turn, managing LLM calls and Tool invocations.
        State Machine: CALL_LLM -> TOOL_CALL -> EXECUTE -> APPEND_RESULT -> CALL_LLM
        """
        # 1. Build Context
        context_builder = AIContextBuilder(self.db, self.user_id)
        context = context_builder.build_context(strategy=self.config.context_strategy)

        # 2. Prepare Tools Schema
        tools_schema = None
        if self.config.allowed_tools:
            tools_schema = ToolRegistry.get_all_tools_schema(self.config.allowed_tools)

        # 3. Build Prompt (System, Few-Shot, History, Context, Current Message)
        messages = PromptBuilder.build_messages(
            config=self.config,
            context=context,
            history=[], # Tạm thời để trống history, sau này lấy từ ChatRepository
            user_message=user_message
        )
        
        sys_prompt = messages[0]["content"]
        actual_history = messages[1:-1]
        current_user_msg = messages[-1]["content"]

        # 4. LLM Loop (Handling Tool Calls)
        for iteration in range(MAX_TOOL_ITERATIONS):
            has_tool_calls = False
            tool_calls_accumulated = []
            full_content = ""
            
            # STATE: CALL_LLM
            async for chunk in self.provider.generate_chat_response_stream(
                system_prompt=sys_prompt, 
                history=actual_history, 
                user_message=current_user_msg,
                model_name=self.config.model_name,
                tools=tools_schema
            ):
                if chunk.content:
                    full_content += chunk.content
                    yield chunk.content
                    
                if chunk.tool_calls:
                    # STATE: TOOL_CALL detected
                    has_tool_calls = True
                    tool_calls_accumulated.extend(chunk.tool_calls)
                    
            if not has_tool_calls:
                # STATE: FINAL_RESPONSE
                break
                
            # APPEND to history to maintain conversational integrity
            actual_history.append({"role": "user", "content": current_user_msg})
            # Giả lập assistant response chứa raw function call để model nhớ ngữ cảnh
            # Do LLMProvider hiện đang trả về Dict JSON-like, ta lưu dạng text string.
            assistant_tool_msg = f"{full_content}\n[Tool Calls]: {json.dumps([tc.model_dump() for tc in tool_calls_accumulated], ensure_ascii=False)}"
            actual_history.append({"role": "assistant", "content": assistant_tool_msg})
            
            tool_results_str = ""
            # STATE: EXECUTE
            for tc in tool_calls_accumulated:
                success, result_str = await ToolExecutor.execute_tool_call(
                    tool_name=tc.name,
                    arguments=tc.arguments,
                    allowed_tools=self.config.allowed_tools or [],
                    user_id=str(self.user_id)
                )
                tool_results_str += f"\n[Kết quả Tool '{tc.name}']: {result_str}\n"
                
            # STATE: APPEND_RESULT (Prepare next user message)
            current_user_msg = f"Hệ thống báo cáo kết quả công cụ (chỉ sử dụng làm ngữ cảnh, không cần lặp lại kết quả thô):\n{tool_results_str}\nHãy phân tích và trả lời người dùng dựa trên kết quả trên."
            
        else:
            # Reached MAX_TOOL_ITERATIONS without breaking
            yield "\n[Hệ thống: Vượt quá số lần gọi công cụ tối đa cho phép. Dừng thực thi để đảm bảo an toàn.]"
