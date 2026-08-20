from app.services.ai.tools.registry import ToolRegistry
from app.services.ai.tools.academic import GetAcademicPerformanceTool, GetLearningGoalsTool

def register_all_tools():
    """
    Called once during startup to register all available internal tools.
    """
    ToolRegistry.register(GetAcademicPerformanceTool())
    ToolRegistry.register(GetLearningGoalsTool())
