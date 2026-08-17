import logging
from typing import List, Optional
import openai
from openai import AsyncOpenAI

from app.schemas.chat import ChatMessage, LLMResponse, LLMUsage
from app.llm.base import LLMProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMProviderError(Exception):
    pass
class LLMTimeoutError(LLMProviderError):
    pass
class LLMAuthenticationError(LLMProviderError):
    pass
class LLMRateLimitError(LLMProviderError):
    pass

class OpenAICompatibleProvider(LLMProvider):
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url=settings.LLM_BASE_URL,
            api_key=settings.LLM_API_KEY,
            timeout=settings.LLM_TIMEOUT,
        )
        self.model = settings.LLM_MODEL

    async def generate_response(self, messages: List[ChatMessage], temperature: Optional[float] = None) -> LLMResponse:
        try:
            formatted_messages = [{"role": msg.role, "content": msg.content} for msg in messages]
            temp = temperature if temperature is not None else settings.LLM_TEMPERATURE
            
            logger.info(f"Sending LLM request to {settings.LLM_BASE_URL} for model {self.model}")
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=formatted_messages,
                temperature=temp,
            )
            
            content = response.choices[0].message.content or ""
            finish_reason = response.choices[0].finish_reason
            
            usage = None
            if response.usage:
                usage = LLMUsage(
                    prompt_tokens=response.usage.prompt_tokens,
                    completion_tokens=response.usage.completion_tokens,
                    total_tokens=response.usage.total_tokens
                )
            
            return LLMResponse(
                content=content,
                model=self.model,
                usage=usage,
                finish_reason=finish_reason
            )
        except openai.AuthenticationError as e:
            logger.error("Authentication failed.")
            raise LLMAuthenticationError("Authentication Error") from e
        except openai.RateLimitError as e:
            logger.error("Rate limit exceeded.")
            raise LLMRateLimitError("Rate Limit Exceeded") from e
        except openai.APITimeoutError as e:
            logger.error("LLM timeout.")
            raise LLMTimeoutError("Request Timeout") from e
        except Exception as e:
            logger.error(f"Provider error: {e}")
            raise LLMProviderError(f"Provider Error: {e}") from e
