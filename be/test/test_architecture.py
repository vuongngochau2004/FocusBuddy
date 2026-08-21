import asyncio
from typing import Dict, Any, List

class SubAgent:
    """
    Sub-agent that handles specific tasks assigned by the Main System.
    """
    def __init__(self, name: str, role_description: str):
        self.name = name
        self.role_description = role_description

    async def process(self, task: str, context: Dict[str, Any] = None) -> str:
        """
        Mock processing logic for the sub-agent.
        In a real scenario, this would call an LLM with the task and context.
        """
        print(f"  [{self.name}] Received task: '{task}'")
        # Simulating processing time
        await asyncio.sleep(1)
        
        # Mock result based on agent name
        result = f"[{self.name}] Completed task successfully. Task was: {task}"
        print(f"  [{self.name}] Task finished.")
        return result

class MainSystemAgent:
    """
    Main System Agent that receives user input, analyzes it, 
    and delegates sub-tasks to appropriate sub-agents.
    """
    def __init__(self):
        self.name = "MainCoordinator"
        self.sub_agents: Dict[str, SubAgent] = {}

    def register_agent(self, agent: SubAgent):
        """Registers a sub-agent with the main system."""
        self.sub_agents[agent.name] = agent
        print(f"[SYSTEM] Registered sub-agent: {agent.name} - {agent.role_description}")

    async def analyze_and_delegate(self, user_prompt: str):
        """
        Analyzes the prompt and routes it to the corresponding sub-agents.
        """
        print(f"\n[{self.name}] Analyzing user prompt: '{user_prompt}'\n")
        # Simulating LLM analysis delay
        await asyncio.sleep(1.5)
        
        # Mock task breakdown (in a real system, the LLM would output JSON 
        # mapping tasks to agents based on the user prompt)
        tasks = []
        user_prompt_lower = user_prompt.lower()
        
        if "code" in user_prompt_lower or "program" in user_prompt_lower:
            tasks.append(("CodeAgent", "Write the requested code snippet based on the prompt."))
        if "test" in user_prompt_lower or "bug" in user_prompt_lower:
            tasks.append(("TestAgent", "Write tests for the code or debug the issue."))
        if "database" in user_prompt_lower or "sql" in user_prompt_lower:
            tasks.append(("DBAgent", "Design database schema and write SQL queries."))
        if "design" in user_prompt_lower or "ui" in user_prompt_lower:
            tasks.append(("DesignAgent", "Create UI/UX design mockups."))
            
        if not tasks:
            # Fallback if no specific keyword matched
            tasks.append(("GeneralAgent", f"Process general request: {user_prompt}"))

        print(f"[{self.name}] Analysis complete. Delegating {len(tasks)} tasks...")
        
        # Execute tasks concurrently
        coroutines = []
        for agent_name, task_desc in tasks:
            if agent_name in self.sub_agents:
                agent = self.sub_agents[agent_name]
                coroutines.append(agent.process(task_desc, context={"original_prompt": user_prompt}))
            else:
                print(f"[SYSTEM-WARNING] Required agent '{agent_name}' not found!")

        # Gather results from all sub-agents
        if coroutines:
            results = await asyncio.gather(*coroutines)
            print(f"\n[{self.name}] All sub-agents have completed their work.")
            print("\n" + "="*20 + " FINAL REPORT " + "="*20)
            for idx, res in enumerate(results):
                print(f"{idx + 1}. {res}")
            print("="*54 + "\n")
        else:
            print(f"[{self.name}] No actionable sub-tasks could be formulated.")


async def main():
    print("="*50)
    print(" Initializing Multi-Agent System Test Architecture ")
    print("="*50)
    
    # 1. Initialize Main System
    system = MainSystemAgent()
    
    # 2. Initialize and Register Sub-Agents
    system.register_agent(SubAgent("CodeAgent", "Expert in writing clean, efficient code."))
    system.register_agent(SubAgent("TestAgent", "Expert in QA and writing unit tests."))
    system.register_agent(SubAgent("DBAgent", "Database architect and SQL expert."))
    system.register_agent(SubAgent("DesignAgent", "UI/UX designer."))
    system.register_agent(SubAgent("GeneralAgent", "Handles general inquiries and summarization."))
    
    print("\nSystem ready! Try entering prompts like: 'Write a program and test it'")
    
    while True:
        # 3. Take User Input
        print("-" * 50)
        prompt = input("Enter your prompt (or 'exit' to quit): ")
        if prompt.strip().lower() == 'exit':
            print("Shutting down the agent system. Goodbye!")
            break
            
        if not prompt.strip():
            continue
            
        # 4. Main System Processes and Delegates
        await system.analyze_and_delegate(prompt)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nSystem shut down by user.")
