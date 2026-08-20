import sys
import os
import asyncio
sys.path.insert(0, os.path.abspath('.'))

from app.core.database import SessionLocal, engine, Base
from app.models.module_5_ai_chatbot.agent_config import AgentConfig
from app.models.module_5_ai_chatbot.intent_config import IntentConfig
from app.services.ai.supervisor import Supervisor
from app.services.ai.registry import AgentRegistry

# Import all models to ensure they are registered in Base
import app.models.module_5_ai_chatbot.agent_config
import app.models.module_5_ai_chatbot.intent_config

# Create tables
Base.metadata.create_all(bind=engine)

def test_supervisor():
    db = SessionLocal()
    try:
        # Clear existing
        db.query(IntentConfig).delete()
        db.query(AgentConfig).delete()
        db.commit()
        
        # Create AgentConfigs
        general_agent = AgentConfig(
            agent_type="general",
            name="General Assistant",
            system_prompt="You are a helpful general assistant.",
            model_name="qwen2.5:7b",
            context_strategy="general",
            allowed_tools=[]
        )
        academic_agent = AgentConfig(
            agent_type="academic",
            name="Academic Assistant",
            system_prompt="You are an academic advisor.",
            model_name="qwen2.5:7b",
            context_strategy="academic",
            allowed_tools=[]
        )
        db.add_all([general_agent, academic_agent])
        
        # Create IntentConfigs
        academic_intent = IntentConfig(
            agent_type="academic",
            example_phrases=["giải bài tập toán", "làm sao để điểm cao", "hướng dẫn học bài", "cách giải hệ phương trình"],
            threshold=0.45
        )
        db.add(academic_intent)
        db.commit()
        
        # Test Supervisor
        sup = Supervisor()
        sup.initialize(db)
        
        test_queries = [
            "Làm sao để giải bài toán đạo hàm này?",
            "Trời hôm nay đẹp quá nhỉ",
            "Môn Toán khó quá, cho mình lời khuyên với",
            "Tạo cho mình một cái lịch học"
        ]
        
        print("\n--- TEST SUPERVISOR INTENT ROUTING ---")
        for q in test_queries:
            intent = sup.classify_intent(q)
            print(f"Query: '{q}' -> Routed to: {intent}")
            
        print("\n--- TEST REGISTRY ---")
        reg = AgentRegistry(db)
        cfg = reg.get_config("academic")
        print(f"Academic Config loaded: {cfg.name}, Context Strategy: {cfg.context_strategy}")
        
    finally:
        # Cleanup
        db.query(IntentConfig).delete()
        db.query(AgentConfig).delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    test_supervisor()
