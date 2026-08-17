import logging
from typing import List

from app.schemas.chat import ChatRequest, ChatMessage, LLMResponse
from app.llm.client import OpenAICompatibleProvider
from app.prompts.system import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        self.llm_provider = OpenAICompatibleProvider()
        self.max_context_messages = 20

    async def generate_chat_response(self, request: ChatRequest) -> LLMResponse:
        messages: List[ChatMessage] = []
        
        # 1. System Prompt
        messages.append(ChatMessage(role="system", content=SYSTEM_PROMPT))
        
        # 2. Conversation Context (Truncated)
        if request.conversation:
            # Only keep the last N messages to fit into context window
            recent_conversation = request.conversation[-self.max_context_messages:]
            messages.extend(recent_conversation)
            
        # 3. User Message
        messages.append(ChatMessage(role="user", content=request.message))
        
        # Call LLM
        logger.info("Calling LLM Provider to generate chat response")
        response = await self.llm_provider.generate_response(messages)
        
        return response
