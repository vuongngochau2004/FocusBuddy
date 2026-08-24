import asyncio
import logging
from app.services.module_5_ai_chatbot.ai.supervisor import Supervisor

logging.basicConfig(level=logging.INFO)

async def main():
    sup = Supervisor()
    res = await sup.classify_intent("hello")
    print("Classified:", res)

if __name__ == "__main__":
    asyncio.run(main())
