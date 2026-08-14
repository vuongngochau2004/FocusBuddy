# Mental & Psychology Management API

This module allows users to log and track their emotional and mental well-being over time. This includes daily emotion logs and periodic mental assessments.

**Important Note on Authentication:**
Since Authentication is partially implemented, the `X-User-Id` header is used in these APIs to identify the acting user. This ensures that users can only interact with their own mental data (Ownership verification).

## 1. Emotion Logs API

Tracks daily emotional states, stress, motivation, and energy levels.

### `POST /api/v1/emotions`
**Purpose**: Record a new emotion log.
**Headers**: `X-User-Id: <user_uuid>`
**Request Body**:
```json
{
  "emotion": "HAPPY",
  "stress_level": 2,
  "motivation_level": 8,
  "energy_level": 9,
  "note": "Feeling great today!",
  "recorded_at": "2026-08-14T10:00:00Z"
}
```
**Response (201 Created)**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "emotion": "HAPPY",
  ...
  "created_at": "datetime"
}
```

### `GET /api/v1/emotions`
**Purpose**: Retrieve emotion history for the user, ordered by `recorded_at` descending.
**Headers**: `X-User-Id: <user_uuid>`
**Query Parameters**: `skip` (default 0), `limit` (default 100).

### `GET /api/v1/emotions/{id}`
**Purpose**: Get a specific emotion log. Returns 403 if the log does not belong to the user.
**Headers**: `X-User-Id: <user_uuid>`

### `PUT /api/v1/emotions/{id}`
**Purpose**: Update an existing emotion log.

### `DELETE /api/v1/emotions/{id}`
**Purpose**: Delete an emotion log. Returns 204 No Content.

---

## 2. Mental Assessments API

Tracks periodic mental health checks or assessments (e.g., Daily Check, AI Analysis).

### `POST /api/v1/assessments`
**Purpose**: Submit a new mental assessment.
**Headers**: `X-User-Id: <user_uuid>`
**Request Body**:
```json
{
  "assessment_type": "DAILY_CHECK",
  "stress_score": 12.5,
  "anxiety_score": 5.0,
  "burnout_score": 2.0,
  "risk_level": "LOW",
  "summary": "User is doing well.",
  "recommendation": "Keep it up."
}
```

### `GET /api/v1/assessments`
**Purpose**: List assessment history for the user, ordered by `created_at` descending.
**Query Parameters**: `skip`, `limit`.

### `GET /api/v1/assessments/{id}`
**Purpose**: Retrieve a specific assessment.

### `PUT /api/v1/assessments/{id}`
**Purpose**: Update an assessment.

### `DELETE /api/v1/assessments/{id}`
**Purpose**: Delete an assessment.

## Error Codes

- **400 Bad Request**: Invalid input data.
- **403 Forbidden**: Trying to access/modify an emotion log or assessment that belongs to another user.
- **404 Not Found**: The resource does not exist.
- **422 Unprocessable Entity**: Validation error on payload fields (e.g. invalid Enum value for EmotionType, or level out of bounds).
