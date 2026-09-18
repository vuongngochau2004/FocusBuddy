import asyncio
import os
import sys
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

load_dotenv()

from app.core.config import settings
from app.services.module_5_ai_chatbot.ai.provider import ProviderFactory

async def main():
    print(f"Testing Backend LLM Provider...")
    print(f"Base URL: {settings.LLM_BASE_URL}")
    print(f"Model: {settings.LLM_MODEL}")
    print("-" * 30)

    # Khởi tạo provider
    provider = ProviderFactory.get_provider_for_model(settings.LLM_MODEL)
    print(f"Using Provider Class: {provider.__class__.__name__}")
    print("\n✅ --- LLM Response (Streaming) ---")

    system_prompt = "You are a helpful assistant. Reply in Vietnamese."
    user_message = "Xin chào, bạn có thể giải thích ngắn gọn AI là gì không?"

    try:
        # Nhận luồng (stream) phản hồi từ LLM
        async for chunk in provider.generate_chat_response_stream(system_prompt=system_prompt, history=[], user_message=user_message):
            # In từng mảnh nội dung được trả về
            if chunk.content:
                print(chunk.content, end="", flush=True)
        print("\n\n✅ Done.")
    except Exception as e:
        print(f"\n❌ Error testing LLM: {e}")

if __name__ == "__main__":
    asyncio.run(main())
