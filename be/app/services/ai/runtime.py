import logging
import json
from typing import AsyncGenerator
from sqlalchemy.orm import Session

from app.models.module_5_ai_chatbot.agent_config import AgentConfig
from app.services.ai.provider import OllamaProvider
from app.services.ai.tools.registry import ToolRegistry
from app.services.ai.tools.executor import ToolExecutor
# Assuming ContextBuilder and PromptBuilder will be implemented/refactored
from app.services.ai.context_builder import AIContextBuilder

logger = logging.getLogger(__name__)

class AgentRuntime:
    """
    The Core Execution Engine of the Agent System V2.
    It orchestrates the Context, Prompt, Tool execution, and LLM communication.
    """
    def __init__(self, db: Session, config: AgentConfig, user_id: str):
        self.db = db
        self.config = config
        self.user_id = user_id
        # We use the generic provider, which will resolve the actual model (e.g., Ollama) inside.
        self.provider = OllamaProvider()

    async def execute_chat(self, user_message: str, session_id: str) -> AsyncGenerator[str, None]:
        """
        Main execution loop for a chat turn.
        """
        # 1. Build Context
        context_builder = AIContextBuilder(self.db, self.user_id)
        # Assuming build_context takes strategy from config
        context = context_builder.build_context(strategy=self.config.context_strategy)

        # 2. Prepare Tools Schema
        tools_schema = None
        if self.config.allowed_tools:
            tools_schema = ToolRegistry.get_all_tools_schema(self.config.allowed_tools)

        # 3. Build Prompt (System, Few-Shot, History, Context, Current Message)
        # For now, we simulate PromptBuilder logic here or assume it's done by a separate class
        # In a real implementation, PromptBuilder.build() handles this.
        messages = [
            {"role": "system", "content": self.config.system_prompt}
        ]
        
        # Add Few-Shot
        if self.config.few_shot_examples:
            for example in self.config.few_shot_examples:
                messages.append({"role": "user", "content": example.get("user", "")})
                messages.append({"role": "assistant", "content": example.get("assistant", "")})
                
        # Add Context
        messages.append({"role": "system", "content": f"User Context:\n{context}"})
        
        # Add History (mocking history fetch for now)
        # history = ChatRepository.get_messages(limit=self.config.max_history_messages)
        # messages.extend(history_format)
        
        # Add Current User Message
        messages.append({"role": "user", "content": user_message})

        # 4. LLM Loop (Handling Tool Calls)
        # Current AIProvider might need an update to support tool_calls natively.
        # This is a conceptual implementation of the loop:
        
        # We delegate the actual stream yielding to the provider
        # For now, assuming provider.generate_chat_response_stream handles raw streaming
        # In the future, if tool_calls are detected, we would intercept, call ToolExecutor, and re-prompt.
        
        async for chunk in self.provider.generate_chat_response_stream(
            system_prompt=self.config.system_prompt, # Legacy compatibility
            history=messages, # Pass structured messages
            user_message=user_message,
            model_name=self.config.model_name
        ):
            yield chunk.content
