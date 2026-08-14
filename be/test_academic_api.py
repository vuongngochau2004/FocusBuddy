import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

def test_ping():
    response = client.get("/api/v1/ping")
    assert response.status_code == 200

def test_academic_modules():
    # 1. Create University
    univ_data = {
        "name": "Test University",
        "short_name": "TU",
        "address": "123 Test St",
        "website": "https://test.edu"
    }
    resp = client.post("/api/v1/universities", json=univ_data)
    assert resp.status_code == 201, resp.text
    univ_id = resp.json()["id"]

    # 2. Get Universities
    resp = client.get("/api/v1/universities")
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    # 3. Create Major
    major_data = {
        "university_id": univ_id,
        "name": "Test Major",
        "code": "TM",
        "description": "Test Major Description"
    }
    resp = client.post("/api/v1/majors", json=major_data)
    assert resp.status_code == 201, resp.text
    major_id = resp.json()["id"]

    # 4. Create Curriculum
    curriculum_data = {
        "major_id": major_id,
        "name": "Test Curriculum",
        "code": "TC",
        "admission_year": 2026,
        "total_credits": 120,
        "description": "Test Curriculum Description"
    }
    resp = client.post("/api/v1/curriculums", json=curriculum_data)
    assert resp.status_code == 201, resp.text
    curriculum_id = resp.json()["id"]

    # 5. Create Course
    course_data = {
        "major_id": major_id,
        "course_code": "TC101",
        "course_name": "Introduction to Testing",
        "credits": 3,
        "course_type": "COMPULSORY",
        "description": "Intro course"
    }
    resp = client.post("/api/v1/courses", json=course_data)
    assert resp.status_code == 201, resp.text
    course_id = resp.json()["id"]

    # 6. Create Academic Term
    term_data = {
        "display_name": "Fall 2026",
        "academic_year": "2026-2027",
        "semester_type": "REGULAR",
        "start_date": "2026-09-01",
        "end_date": "2026-12-31"
    }
    resp = client.post("/api/v1/academic-terms", json=term_data)
    assert resp.status_code == 201, resp.text
    term_id = resp.json()["id"]

    # 7. Get Filters
    resp = client.get(f"/api/v1/majors?university_id={univ_id}")
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    # 8. Clean up
    client.delete(f"/api/v1/academic-terms/{term_id}")
    client.delete(f"/api/v1/courses/{course_id}")
    client.delete(f"/api/v1/curriculums/{curriculum_id}")
    client.delete(f"/api/v1/majors/{major_id}")
    client.delete(f"/api/v1/universities/{univ_id}")

if __name__ == "__main__":
    test_ping()
    test_academic_modules()
    print("ALL ACADEMIC TESTS PASSED SUCCESSFULLY!")
