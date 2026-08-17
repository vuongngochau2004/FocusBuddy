import pytest
from unittest.mock import AsyncMock, patch

from app.schemas.chat import ChatRequest, ChatMessage, LLMResponse
from app.services.chatbot_service import ChatbotService

@pytest.mark.asyncio
@patch("app.services.chatbot_service.OpenAICompatibleProvider")
async def test_generate_chat_response(mock_provider_class):
    mock_provider_instance = mock_provider_class.return_value
    mock_provider_instance.generate_response = AsyncMock(
        return_value=LLMResponse(content="I am a chatbot", model="test-model")
    )

    service = ChatbotService()
    request = ChatRequest(
        message="Who are you?",
        conversation=[ChatMessage(role="assistant", content="Hi there")]
    )
    
    response = await service.generate_chat_response(request)
    
    assert response.content == "I am a chatbot"
    mock_provider_instance.generate_response.assert_called_once()
    
    call_args = mock_provider_instance.generate_response.call_args[0][0]
    assert len(call_args) == 3
    assert call_args[0].role == "system"
    assert call_args[1].role == "assistant"
    assert call_args[2].role == "user"
