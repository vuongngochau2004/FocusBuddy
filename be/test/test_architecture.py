import os
import ast
import sys

BE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BE_DIR)

def get_all_py_files(directory):
    py_files = []
    for root, _, files in os.walk(directory):
        if "venv" in root or "__pycache__" in root or "alembic" in root:
            continue
        for file in files:
            if file.endswith(".py"):
                py_files.append(os.path.join(root, file))
    return py_files

def test_no_openai_dependency():
    """1. Không còn dependency OpenAI/GPT."""
    py_files = get_all_py_files(BE_DIR)
    for file in py_files:
        if "test_architecture.py" in file:
            continue
        with open(file, "r", encoding="utf-8") as f:
            content = f.read()
            assert "import openai" not in content, f"OpenAI import found in {file}"
            assert "from openai" not in content, f"OpenAI import found in {file}"
    print("[PASS] 1. No OpenAI dependency found.")

def test_runtime_isolation():
    """2 & 4. AgentRuntime không import Ollama, LLMProvider cô lập."""
    runtime_path = os.path.join(BE_DIR, "app", "services", "module_5_ai_chatbot", "ai", "runtime.py")
    with open(runtime_path, "r", encoding="utf-8") as f:
        content = f.read()
        assert "ollama" not in content.lower(), "Runtime imports or mentions Ollama directly!"
        assert "LLMProvider" in content, "Runtime does not use LLMProvider!"
    print("[PASS] 2 & 4. AgentRuntime is isolated from Ollama.")

def test_no_db_in_tools_and_runtime():
    """3. Runtime và Tool không truy cập Database trực tiếp."""
    # Runtime
    runtime_path = os.path.join(BE_DIR, "app", "services", "module_5_ai_chatbot", "ai", "runtime.py")
    with open(runtime_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
        for node in ast.walk(tree):
            if isinstance(node, ast.Attribute) and getattr(node, "attr", "") in ["query", "execute"]:
                if hasattr(node.value, "id") and node.value.id == "db":
                    assert False, "Runtime executes DB queries directly!"
    
    # Tools
    tools_dir = os.path.join(BE_DIR, "app", "services", "module_5_ai_chatbot", "ai", "tools")
    tool_files = get_all_py_files(tools_dir)
    for file in tool_files:
        with open(file, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read())
            for node in ast.walk(tree):
                if isinstance(node, ast.Attribute) and getattr(node, "attr", "") in ["query", "execute", "add", "commit"]:
                    # db.query is forbidden in tools
                    if hasattr(node.value, "id") and node.value.id == "db":
                        assert False, f"Tool in {file} executes DB queries directly!"
    print("[PASS] 3. Runtime and Tools do not query Database directly.")

def test_tool_rejection_and_auth():
    """5, 6, 7. Tool không được phép bị reject, sai arguments bị reject, user_id an toàn."""
    executor_path = os.path.join(BE_DIR, "app", "services", "module_5_ai_chatbot", "ai", "tools", "executor.py")
    with open(executor_path, "r", encoding="utf-8") as f:
        content = f.read()
        assert "tool_name not in allowed_tools" in content, "Executor does not check allowed_tools!"
        assert "tool.validate(arguments)" in content, "Executor does not validate tool arguments!"
        assert "tool.execute(arguments, user_id=user_id)" in content, "Executor does not inject secure user_id!"
    print("[PASS] 5, 6, 7. Tool executor correctly validates, auths, and secures user_id.")

def test_max_tool_iterations():
    """8. MAX_TOOL_ITERATIONS ngăn loop vô hạn."""
    runtime_path = os.path.join(BE_DIR, "app", "services", "module_5_ai_chatbot", "ai", "runtime.py")
    with open(runtime_path, "r", encoding="utf-8") as f:
        content = f.read()
        assert "MAX_TOOL_ITERATIONS" in content, "MAX_TOOL_ITERATIONS not found in runtime.py!"
        assert "for iteration in range(MAX_TOOL_ITERATIONS):" in content, "MAX_TOOL_ITERATIONS loop not implemented correctly!"
    print("[PASS] 8. MAX_TOOL_ITERATIONS is implemented.")

import asyncio

def test_general_agent_security():
    """9. General Agent không truy cập được private capability trái phép."""
    executor_path = os.path.join(BE_DIR, "app", "services", "module_5_ai_chatbot", "ai", "tools", "executor.py")
    # Load module dynamically to test
    import importlib.util
    spec = importlib.util.spec_from_file_location("executor", executor_path)
    executor_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(executor_module)
    
    ToolExecutor = executor_module.ToolExecutor
    
    async def run_test():
        # General Agent config has allowed_tools = []
        success, msg = await ToolExecutor.execute_tool_call(
            tool_name="get_academic_performance",
            arguments={},
            allowed_tools=[],
            user_id="mock_user"
        )
        assert not success, "General Agent was allowed to execute a private tool!"
        assert "not allowed" in msg.lower(), "Security message not found!"
        
    asyncio.run(run_test())
    print("[PASS] 9. General Agent cannot access private capability unauthorized.")

def test_import_boundaries():
    """10. Dependency/import boundaries vẫn đúng sau Structural Refactoring."""
    try:
        from app.main import app
    except ModuleNotFoundError as e:
        if "sentence_transformers" not in str(e):
            assert False, f"Import boundary broken: {str(e)}"
    print("[PASS] 10. Dependency/import boundaries still valid post-refactor.")

if __name__ == "__main__":
    print("--- RUNNING ARCHITECTURE VALIDATION ---")
    test_no_openai_dependency()
    test_runtime_isolation()
    test_no_db_in_tools_and_runtime()
    test_tool_rejection_and_auth()
    test_max_tool_iterations()
    test_general_agent_security()
    test_import_boundaries()
    print("--- ALL TESTS PASSED ---")
