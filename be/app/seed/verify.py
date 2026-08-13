from sqlalchemy import text
from app.core.database import SessionLocal
from app.seed.reset import TABLES_TO_DELETE

def verify_seed():
    session = SessionLocal()
    try:
        print("\n========================================")
        print("         DATABASE ROW COUNTS            ")
        print("========================================")
        print(f"{'Table Name':<30} | {'Row Count'}")
        print("-" * 45)
        
        # We can just iterate the list of tables we already know
        for table in reversed(TABLES_TO_DELETE):
            result = session.execute(text(f'SELECT COUNT(*) FROM "{table}";')).scalar()
            print(f"{table:<30} | {result}")
            
        print("========================================\n")
    finally:
        session.close()

if __name__ == "__main__":
    verify_seed()
