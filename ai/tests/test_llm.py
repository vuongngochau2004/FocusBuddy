import pytest
from unittest.mock import AsyncMock, patch
import openai

from app.schemas.chat import ChatMessage
from app.llm.client import OpenAICompatibleProvider, LLMAuthenticationError

@pytest.mark.asyncio
@patch("app.llm.client.AsyncOpenAI")
async def test_openai_compatible_provider_success(mock_async_openai):
    mock_client_instance = mock_async_openai.return_value
    mock_response = AsyncMock()
    mock_response.choices = [
        AsyncMock()
    ]
    mock_response.choices[0].message.content = "Hello from AI"
    mock_response.choices[0].finish_reason = "stop"
    mock_response.usage = AsyncMock(prompt_tokens=10, completion_tokens=20, total_tokens=30)
    mock_client_instance.chat.completions.create.return_value = mock_response

    provider = OpenAICompatibleProvider()
    messages = [ChatMessage(role="user", content="Hi")]
    response = await provider.generate_response(messages)

    assert response.content == "Hello from AI"
    assert response.finish_reason == "stop"
    assert response.usage.total_tokens == 30
