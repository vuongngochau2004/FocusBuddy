from fastapi.testclient import TestClient
from app.main import app

from app.core.database import SessionLocal
from app.models.module_1_user_management.user import User

client = TestClient(app)
db = SessionLocal()

# Setup test user
user = db.query(User).filter_by(email="testai@example.com").first()
if not user:
    user = User(email="testai@example.com", password_hash="pw", full_name="Test AI")
    db.add(user)
    db.commit()
    db.refresh(user)

USER_ID = str(user.id)
HEADERS = {"X-User-Id": USER_ID}

def test_ai_analysis():
    print("Testing AI Analysis Flow...")
    payload = {
        "report_type": "GENERAL",
        "additional_context": "Help me study better"
    }
    
    resp = client.post("/api/v1/ai/analyze", headers=HEADERS, json=payload)
    if resp.status_code != 200:
        print("Analyze failed:", resp.status_code, resp.json())
    assert resp.status_code == 200
    
    # Get reports
    resp = client.get("/api/v1/ai/reports", headers=HEADERS)
    assert resp.status_code == 200
    assert len(resp.json()) > 0
    
    # Get recommendations
    resp = client.get("/api/v1/ai/recommendations", headers=HEADERS)
    assert resp.status_code == 200
    print("AI Analysis Tests passed.\n")

def test_chatbot():
    print("Testing Chatbot Flow...")
    
    # 1. Create Session
    payload = {"title": "Study Help"}
    resp = client.post("/api/v1/chat/sessions", headers=HEADERS, json=payload)
    assert resp.status_code == 200
    session_id = resp.json()["id"]
    
    # 2. Add Message
    msg_payload = {"content": "Hello, how can I improve my grades?"}
    resp = client.post(f"/api/v1/chat/sessions/{session_id}/messages", headers=HEADERS, json=msg_payload)
    if resp.status_code != 200:
        print("Message failed:", resp.status_code, resp.json())
    assert resp.status_code == 200
    
    # 3. Get Messages
    resp = client.get(f"/api/v1/chat/sessions/{session_id}/messages", headers=HEADERS)
    assert resp.status_code == 200
    msgs = resp.json()
    assert len(msgs) == 2 # 1 User, 1 Assistant
    print("Chatbot Tests passed.\n")

if __name__ == "__main__":
    try:
        test_ai_analysis()
        test_chatbot()
        print("ALL TESTS RUN.")
    finally:
        db.close()
