import logging
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from sqlalchemy.orm import Session
from app.models.module_5_ai_chatbot.agent_config import AgentConfig
from app.models.module_5_ai_chatbot.intent_config import IntentConfig
from app.core.config import settings

logger = logging.getLogger(__name__)

def seed_agent_v2(session: Session):
    logger.info("Seeding Agent V2 configurations...")
    
    # Define Agents
    agents = [
        {
            "agent_type": "general",
            "name": "FocusBuddy General Assistant",
            "description": "Trợ lý tổng quát, trả lời các câu hỏi thông thường và không có quyền truy cập dữ liệu cá nhân.",
            "system_prompt": "Bạn là FocusBuddy, một trợ lý học tập tận tâm. Bạn giúp sinh viên giải đáp các thắc mắc chung. Không bịa đặt thông tin. Nếu không biết, hãy nói không biết.",
            "model_provider": "remote", # Remote API (Gemma)
            "model_name": settings.LLM_MODEL, # Remote model
            "context_strategy": "general",
            "allowed_tools": [] # No private tools
        },
        {
            "agent_type": "academic",
            "name": "FocusBuddy Academic Advisor",
            "description": "Trợ lý học thuật, phân tích điểm số và tư vấn lộ trình học.",
            "system_prompt": "Bạn là Cố vấn Học tập FocusBuddy. Nhiệm vụ của bạn là xem xét điểm số và lịch sử học tập của sinh viên để đưa ra lời khuyên tốt nhất.",
            "model_provider": "ollama", # Local Ollama (Qwen)
            "model_name": settings.OLLAMA_MODEL_QWEN,
            "context_strategy": "academic",
            "allowed_tools": ["get_academic_performance", "get_learning_goals"] # Internal Tools
        }
    ]
    
    for a_data in agents:
        existing = session.query(AgentConfig).filter_by(agent_type=a_data["agent_type"]).first()
        if not existing:
            new_agent = AgentConfig(**a_data)
            session.add(new_agent)
            logger.info(f" -> Created AgentConfig: {a_data['agent_type']}")
        else:
            # Update existing
            for k, v in a_data.items():
                setattr(existing, k, v)
            logger.info(f" -> Updated AgentConfig: {a_data['agent_type']}")
            
    # Define Intents
    intents = [
        {
            "agent_type": "general",
            "example_phrases": ["Chào bạn", "Bạn là ai", "Giúp mình với", "Thời tiết hôm nay", "Mình muốn hỏi một câu"],
            "threshold": 0.3
        },
        {
            "agent_type": "academic",
            "example_phrases": ["Điểm số của mình dạo này thế nào", "Làm sao để cải thiện GPA", "Mục tiêu học tập của mình", "Tính điểm trung bình", "Tư vấn môn học"],
            "threshold": 0.45
        }
    ]
    
    for i_data in intents:
        existing = session.query(IntentConfig).filter_by(agent_type=i_data["agent_type"]).first()
        if not existing:
            new_intent = IntentConfig(**i_data)
            session.add(new_intent)
            logger.info(f" -> Created IntentConfig: {i_data['agent_type']}")
        else:
            existing.example_phrases = i_data["example_phrases"]
            existing.threshold = i_data["threshold"]
            logger.info(f" -> Updated IntentConfig: {i_data['agent_type']}")
            
    session.commit()
    logger.info("Agent V2 seeding complete.")

if __name__ == "__main__":
    from app.core.database import SessionLocal
    
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    db = SessionLocal()
    try:
        seed_agent_v2(db)
    finally:
        db.close()
