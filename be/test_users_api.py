import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ping():
    response = client.get("/api/v1/ping")
    assert response.status_code == 200

def test_user_crud():
    # 1. Create
    user_data = {
        "email": "testuser_crud@example.com",
        "full_name": "Test User",
        "password": "securepassword123"
    }
    resp = client.post("/api/v1/users", json=user_data)
    assert resp.status_code == 201, resp.text
    created_user = resp.json()
    assert created_user["email"] == user_data["email"]
    assert "password" not in created_user
    assert "password_hash" not in created_user
    user_id = created_user["id"]

    # 2. Get list
    resp = client.get("/api/v1/users")
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    # 3. Get single
    resp = client.get(f"/api/v1/users/{user_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == user_id

    # 4. Update
    update_data = {"full_name": "Updated Name"}
    resp = client.put(f"/api/v1/users/{user_id}", json=update_data)
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Updated Name"

    # 5. Delete
    resp = client.delete(f"/api/v1/users/{user_id}")
    assert resp.status_code == 204

    # 6. Verify Delete
    resp = client.get(f"/api/v1/users/{user_id}")
    assert resp.status_code == 404

if __name__ == "__main__":
    test_ping()
    test_user_crud()
    print("ALL TESTS PASSED SUCCESSFULLY!")
