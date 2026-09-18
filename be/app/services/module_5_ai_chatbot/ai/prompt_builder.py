from typing import List, Dict, Any
from app.schemas.module_5_ai_chatbot.agent_config_schema import AgentConfigYaml

class PromptBuilder:
    """
    Chịu trách nhiệm lắp ráp các phần của Prompt thành cấu trúc List[Dict] chuẩn (System, Few-Shot, Context, History, User Message).
    Không chứa bất kỳ logic kinh doanh (business logic) hoặc logic phân luồng (routing) nào.
    """
    
    @staticmethod
    def build_messages(
        config: AgentConfigYaml,
        context: str,
        history: List[Dict[str, str]],
        user_message: str
    ) -> List[Dict[str, str]]:
        messages = []
        
        # 1. System Prompt cốt lõi
        system_content = config.system_prompt or "Bạn là trợ lý AI."
        messages.append({"role": "system", "content": system_content})
        
        # 2. Ngữ cảnh động (Context)
        if context:
            messages.append({"role": "system", "content": f"Ngữ cảnh hiện tại của người dùng:\n{context}"})
            
        # 3. Few-shot examples
        if config.few_shot_examples:
            for example in config.few_shot_examples:
                user_ex = example.get("user")
                asst_ex = example.get("assistant")
                if user_ex and asst_ex:
                    messages.append({"role": "user", "content": user_ex})
                    messages.append({"role": "assistant", "content": asst_ex})
                    
        # 4. Lịch sử trò chuyện
        if history:
            # history đã phải là dạng List[Dict[str, str]] ví dụ: [{"role": "user", "content": "..."}, ...]
            messages.extend(history)
            
        # 5. Tin nhắn mới nhất của người dùng
        messages.append({"role": "user", "content": user_message})
        
        return messages
