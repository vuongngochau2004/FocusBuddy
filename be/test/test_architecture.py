import asyncio
import sys
import os
import uuid

# Thêm đường dẫn thư mục 'be' vào sys.path để import được module 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.module_5_ai_chatbot.ai.router import IntentRouter
from app.services.module_5_ai_chatbot.ai.runtime import AgentRuntime
from app.models.module_5_ai_chatbot.agent_config import AgentConfig

# Mock DB Session cho mục đích test độc lập vì ta không chạy API Server
class MockDB:
    def query(self, *args, **kwargs):
        pass

async def main():
    print("="*60)
    print(" Khởi chạy Hệ thống AI Runtime (Kiến trúc thực tế) ")
    print("="*60)
    
    # 1. Khởi tạo Intent Router (Bộ não điều phối)
    # Lần đầu tiên chạy sẽ mất khoảng 1-3 giây để load Model SentenceTransformer vào RAM
    print("[Hệ thống] Đang khởi tạo IntentRouter (tải mô hình ngôn ngữ NLP)...")
    router = IntentRouter()
    
    print("\nHệ thống đã sẵn sàng! Gõ 'exit' để thoát.")
    
    # Dummy user_id cho quá trình test
    test_user_id = uuid.uuid4()
    
    while True:
        print("\n" + "="*60)
        user_message = input("Nhập tin nhắn của bạn: ")
        
        if user_message.strip().lower() == 'exit':
            print("Đang đóng hệ thống. Tạm biệt!")
            break
            
        if not user_message.strip():
            continue
            
        # 2. Router phân tích Intent dựa trên model ngữ nghĩa
        intent = router.classify_intent(user_message, threshold=0.4)
        print(f"\n[Router] Phân tích intent: '{intent}'")
        
        # 3. Nạp cấu hình Agent (Mô phỏng lấy từ Database theo Intent)
        agent_role = "Trợ lý ảo tổng hợp"
        context_strat = "general"
        if intent == "academic":
            agent_role = "Chuyên gia học thuật, giúp giải bài tập và định hướng lộ trình học"
            context_strat = "academic"
        elif intent == "psychology":
            agent_role = "Chuyên gia tư vấn tâm lý học đường, an ủi và động viên người dùng"
            context_strat = "mental_health"
        elif intent == "schedule":
            agent_role = "Chuyên gia quản lý thời gian, giúp lên lịch trình hiệu quả"
            context_strat = "general"
            
        config = AgentConfig(
            id=uuid.uuid4(),
            agent_type=intent,
            name=f"{intent.capitalize()}Agent",
            system_prompt=f"Bạn là {agent_role}. Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt.",
            model_name="ggml-org/gemma-4-e4b-it-GGUF:Q4_0", # Tự động kích hoạt RemoteAPIProvider
            context_strategy=context_strat,
            allowed_tools=[],
        )
        
        # 4. Khởi chạy Runtime (Core Execution Engine của luồng code thực)
        print(f"[{config.name}] Đang xử lý...\n")
        
        runtime = AgentRuntime(db=MockDB(), config=config, user_id=test_user_id)
        
        print(f"[{config.name}] Phản hồi: ", end="", flush=True)
        
        # 5. Gọi AI và in kết quả Streaming
        try:
            async for chunk_text in runtime.execute_chat(user_message, session_id="test_session"):
                print(chunk_text, end="", flush=True)
        except Exception as e:
            print(f"\n[Lỗi Runtime]: {e}")
            
        print("\n" + "-"*50)

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nĐã hủy hệ thống bằng phím tắt.")
