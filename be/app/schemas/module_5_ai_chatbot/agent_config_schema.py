from typing import List, Optional, Any
from pydantic import BaseModel, Field

class IntentConfigYaml(BaseModel):
    example_phrases: List[str] = Field(default_factory=list)
    threshold: float = 0.45

class AgentConfigYaml(BaseModel):
    agent_type: str
    name: str
    description: Optional[str] = None
    system_prompt: str
    model_provider: str = "ollama"
    model_name: Optional[str] = None
    context_strategy: Optional[str] = None
    max_history_messages: int = 6
    few_shot_examples: List[dict] = Field(default_factory=list)
    allowed_tools: List[str] = Field(default_factory=list)
    is_active: bool = True
    intent: Optional[IntentConfigYaml] = None

class AgentsRootYaml(BaseModel):
    agents: List[AgentConfigYaml]
