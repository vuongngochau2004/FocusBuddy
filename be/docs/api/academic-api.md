# Academic Management API

This module provides Reference/Master data for the educational background of users.

## 1. Universities API

### `GET /api/v1/universities`
**Purpose**: List all universities.
**Query Parameters**: `skip`, `limit`.
**Response (200 OK)**:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Test University",
      "short_name": "TU",
      "created_at": "datetime"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/universities`
**Purpose**: Create a new university.

### `GET /api/v1/universities/{id}`
**Purpose**: Retrieve specific university details.

## 2. Majors API

### `GET /api/v1/majors`
**Purpose**: List all majors.
**Query Parameters**: 
- `skip`, `limit`
- `university_id`: Filter majors by university.
**Response (200 OK)**:
```json
{
  "items": [
    {
      "id": "uuid",
      "university_id": "uuid",
      "name": "Computer Science",
      "code": "CS",
      "created_at": "datetime"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/majors`
**Purpose**: Create a major (requires valid `university_id`).

### `GET /api/v1/majors/{id}`
**Purpose**: Retrieve specific major details.

## 3. Curriculums API

### `GET /api/v1/curriculums`
**Purpose**: List curriculums.
**Query Parameters**: `major_id`.

### `POST /api/v1/curriculums`
**Purpose**: Create a curriculum (requires valid `major_id`).

## 4. Courses API

### `GET /api/v1/courses`
**Purpose**: List courses.
**Query Parameters**: `major_id`.

### `POST /api/v1/courses`
**Purpose**: Create a course (requires valid `major_id`).

## 5. Academic Terms API

### `GET /api/v1/academic-terms`
**Purpose**: List academic terms (e.g. Semesters).
**Query Parameters**: `skip`, `limit`.

### `POST /api/v1/academic-terms`
**Purpose**: Create an academic term.

## Error Codes
- **400 Bad Request**: Invalid input data or dependent entity creation failure.
- **404 Not Found**: Entity ID not found (e.g. creating a Major with non-existent University).
