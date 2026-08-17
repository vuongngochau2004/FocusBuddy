from fastapi import APIRouter, HTTPException, Depends
import logging

from app.schemas.chat import ChatRequest, LLMResponse
from app.services.chatbot_service import ChatbotService
from app.llm.client import LLMProviderError, LLMAuthenticationError, LLMRateLimitError, LLMTimeoutError

router = APIRouter()
logger = logging.getLogger(__name__)

def get_chatbot_service():
    return ChatbotService()

@router.post("/chat", response_model=LLMResponse)
async def chat_endpoint(request: ChatRequest, service: ChatbotService = Depends(get_chatbot_service)):
    try:
        response = await service.generate_chat_response(request)
        return response
    except LLMAuthenticationError as e:
        raise HTTPException(status_code=401, detail="Authentication with LLM Provider failed.")
    except LLMRateLimitError as e:
        raise HTTPException(status_code=429, detail="LLM Rate limit exceeded.")
    except LLMTimeoutError as e:
        raise HTTPException(status_code=504, detail="LLM request timed out.")
    except LLMProviderError as e:
        logger.error(f"LLM Provider Error: {str(e)}")
        raise HTTPException(status_code=502, detail="Error communicating with LLM Provider.")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error.")
