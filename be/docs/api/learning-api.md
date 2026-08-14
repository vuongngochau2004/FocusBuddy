# Learning Activity Management API

This module manages the learning processes of users, such as defining goals, tracking study sessions, and organizing tasks.

**Important Note on Authentication:**
Since Authentication is partially implemented, the `X-User-Id` header is used in these APIs to identify the acting user. This ensures that users can only interact with their own learning data (Ownership verification).

## 1. Learning Goals API

Learning goals represent long-term achievements a user wants to reach (e.g., "Master Backend in 100 hours").

### `POST /api/v1/learning-goals`
**Purpose**: Create a new learning goal.
**Headers**: `X-User-Id: <user_uuid>`
**Request Body**:
```json
{
  "title": "Master Backend",
  "target_value": 100.0,
  "unit": "hours",
  "start_date": "2026-08-01",
  "end_date": "2026-12-31",
  "status": "ACTIVE"
}
```
**Response (201 Created)**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Master Backend",
  "target_value": 100.0,
  "unit": "hours",
  "start_date": "2026-08-01",
  "end_date": "2026-12-31",
  "status": "ACTIVE",
  "created_at": "datetime"
}
```

### `GET /api/v1/learning-goals`
**Purpose**: Retrieve all learning goals for the authenticated user.
**Headers**: `X-User-Id: <user_uuid>`
**Query Parameters**: `skip` (default 0), `limit` (default 100).
**Response (200 OK)**:
```json
{
  "items": [ ... ],
  "total": 1
}
```

### `GET /api/v1/learning-goals/{id}`
**Purpose**: Get a specific learning goal. Returns 403 if the goal does not belong to the user.
**Headers**: `X-User-Id: <user_uuid>`

### `PUT /api/v1/learning-goals/{id}`
**Purpose**: Update an existing learning goal.

### `DELETE /api/v1/learning-goals/{id}`
**Purpose**: Delete a learning goal. Returns 204 No Content.

---

## 2. Study Sessions API

Study Sessions track the actual time spent learning.

### `POST /api/v1/study-sessions`
**Purpose**: Record a new study session.
**Headers**: `X-User-Id: <user_uuid>`
**Request Body**:
```json
{
  "start_time": "2026-08-14T10:00:00Z",
  "end_time": "2026-08-14T11:00:00Z",
  "duration_minutes": 60,
  "study_method": "POMODORO",
  "focus_score": 8,
  "note": "Great focus today."
}
```
**Response (201 Created)**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  ...
}
```

### `GET /api/v1/study-sessions`
**Purpose**: List study sessions for the user. Supports pagination (`skip`, `limit`).

### `GET /api/v1/study-sessions/{id}`
**Purpose**: Get details of a study session.

### `PUT /api/v1/study-sessions/{id}`
**Purpose**: Update a study session.

### `DELETE /api/v1/study-sessions/{id}`
**Purpose**: Remove a study session.

---

## 3. Study Tasks API

Study Tasks are actionable items, optionally linked to a specific course.

### `POST /api/v1/study-tasks`
**Purpose**: Create a task.
**Headers**: `X-User-Id: <user_uuid>`
**Request Body**:
```json
{
  "course_id": "optional-course-uuid",
  "title": "Complete Assignment 3",
  "description": "...",
  "priority": "HIGH",
  "status": "TODO"
}
```

### `GET /api/v1/study-tasks`
**Purpose**: List tasks for the user.
**Query Parameters**: 
- `skip`, `limit`
- `course_id` (optional): Filter tasks by a specific course.

### `GET /api/v1/study-tasks/{id}`
**Purpose**: Retrieve a task.

### `PUT /api/v1/study-tasks/{id}`
**Purpose**: Update a task. Can be used to mark a task as DONE.

### `DELETE /api/v1/study-tasks/{id}`
**Purpose**: Delete a task.

## Error Codes

- **400 Bad Request**: Invalid input data or database constraint violation.
- **403 Forbidden**: Trying to access/modify a resource that belongs to another user.
- **404 Not Found**: The resource, User, or Course ID does not exist.
- **422 Unprocessable Entity**: Validation error on payload fields (e.g. invalid Enum value).
