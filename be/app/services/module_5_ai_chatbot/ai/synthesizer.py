import logging
from typing import AsyncGenerator, Dict
from app.services.module_5_ai_chatbot.ai.provider import ProviderFactory
from app.core.config import settings

logger = logging.getLogger(__name__)

class Synthesizer:
    """
    Synthesizer Agent responsible for merging responses from multiple parallel agents.
    """
    @staticmethod
    async def synthesize_responses(user_message: str, agent_responses: Dict[str, str], history: str) -> AsyncGenerator[str, None]:
        """
        Takes the user message, recent history, and responses from multiple agents,
        and streams a combined, coherent final answer.
        """
        provider = ProviderFactory.get_provider_for_model(settings.LLM_MODEL)
        
        responses_text = ""
        for agent_type, response in agent_responses.items():
            responses_text += f"\n--- Agent: {agent_type} ---\n{response}\n"
            
        system_prompt = f"""
You are the Synthesizer for FocusBuddy.
The user asked a question that required expertise from multiple specialized AI agents.
Below are the individual responses from those specialized agents.
Your task is to merge their advice into a single, coherent, and natural response directly addressing the user.

- Do not mention the internal agents (like "Academic Agent says").
- Ensure a supportive, empathetic tone as FocusBuddy.
- Use markdown formatting where appropriate.
- Keep the important factual details from the agents' responses.

Recent Chat History Context:
{history}

Responses from Specialized Agents:
{responses_text}
"""
        
        try:
            async for chunk in provider.generate_chat_response_stream(
                system_prompt=system_prompt,
                history=[],
                user_message=user_message
            ):
                if chunk.content:
                    yield chunk.content
        except Exception as e:
            logger.error(f"Synthesizer error: {e}")
            yield "Đã có lỗi xảy ra trong quá trình tổng hợp kết quả. Vui lòng thử lại sau."
