import random
from sqlalchemy.orm import Session
from app.seed.utils import fake, logger
from app.models.module_6_ai_analysis.ai_agent import AIAgent
from app.models.module_6_ai_analysis.ai_model_log import AIModelLog
from app.models.module_6_ai_analysis.agent_execution import AgentExecution
from app.models.module_6_ai_analysis.ai_analysis_report import AIAnalysisReport

def seed_ai_agents(session: Session):
    logger.info(f"  [>] Seeding AI Agents...")
    agents = []
    agent_data = [
        ("Learning Advisor", "STUDY_ANALYST", "gpt-4"),
        ("Emotion Coach", "PSYCHOLOGY_ANALYST", "gpt-3.5-turbo"),
        ("Career Guide", "COORDINATOR", "gpt-4"),
        ("Schedule Optimizer", "REPORT_GENERATOR", "gpt-3.5-turbo")
    ]
    
    for name, agent_type, model in agent_data:
        agent = AIAgent(
            name=name,
            agent_type=agent_type,
            description=f"Agent for {name}",
            model_name=model,
            system_prompt=f"You are a {name.lower()}.",
            is_active=True
        )
        session.add(agent)
        agents.append(agent)
        
    session.flush()
    return agents

def seed_ai_logs_and_executions(session: Session, agents, chat_sessions):
    logger.info(f"  [>] Seeding AI logs and executions...")
    
    for _ in range(10):
        agent = random.choice(agents)
        
        # Log
        log = AIModelLog(
            agent_id=agent.id,
            model_name=agent.model_name,
            provider="openai",
            input_tokens=random.randint(10, 50),
            output_tokens=random.randint(10, 100),
            response_time_ms=random.randint(500, 2000),
            status="SUCCESS"
        )
        session.add(log)
        
        # Execution
        if chat_sessions:
            exec = AgentExecution(
                session_id=random.choice(chat_sessions).id,
                agent_id=agent.id,
                task_type="ANALYSIS",
                input_data={"query": "Help me study"},
                output_data={"result": "Break it down into chunks."},
                status="COMPLETED"
            )
            session.add(exec)

def seed_ai_analysis_reports(session: Session, users, chat_sessions):
    logger.info(f"  [>] Seeding AI analysis reports...")
    
    for user in users:
        report = AIAnalysisReport(
            user_id=user.id,
            session_id=random.choice(chat_sessions).id if chat_sessions else None,
            report_type=random.choice(["GENERAL", "ACADEMIC", "MENTAL_HEALTH", "MONTHLY_REVIEW"]),
            summary=fake.text(),
            academic_analysis={"strengths": ["focus", "logic"], "weaknesses": ["procrastination"]},
            mental_analysis={"stress": "low"},
            overall_status=random.choice(["EXCELLENT", "GOOD", "NEEDS_IMPROVEMENT", "AT_RISK"])
        )
        session.add(report)

def run_module_6_seed(session: Session, users, chat_sessions):
    logger.info("\n[6/8] Seeding AI Analysis (Module 6)...")
    try:
        agents = seed_ai_agents(session)
        seed_ai_logs_and_executions(session, agents, chat_sessions)
        seed_ai_analysis_reports(session, users, chat_sessions)
        session.commit()
        logger.info("  ✓ Module 6 seeded successfully.")
    except Exception as e:
        session.rollback()
        logger.error(f"[ERROR] Module 6 seed failed: {e}")
        raise
