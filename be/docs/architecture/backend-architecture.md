# Backend Architecture

FocusBuddy uses a strict Layered Architecture to enforce Separation of Concerns and ensure code maintainability. 

## The Flow of Data

```text
HTTP Request
      ↓
API Router      (app/api/v1/)
      ↓
Pydantic Schema (app/schemas/)
      ↓
Service         (app/services/)
      ↓
Repository      (app/repositories/)
      ↓
SQLAlchemy Model(app/models/)
      ↓
PostgreSQL
```

## Layer Responsibilities

### 1. Router (`app/api/v1/`)
- Handles HTTP requests and responses.
- Injects dependencies (e.g., getting the Service instance via `Depends()`).
- Parses and validates HTTP parameters (query, path, headers).
- **Rule**: Routers must never access the database or repositories directly. They only communicate with Services.

### 2. Schema (`app/schemas/`)
- Defines the Data Transfer Objects (DTOs) for Requests and Responses.
- Built with Pydantic for automatic data validation.
- **Rule**: Schemas should filter out sensitive information (like passwords) and prevent direct exposure of raw ORM models to the client.

### 3. Service (`app/services/`)
- Contains all the **Business Logic**.
- Handles ownership validation (e.g., ensuring a user only updates their own study task).
- Checks foreign key constraints contextually (e.g., ensuring a `course_id` exists before linking a task).
- Manages transactions (commit, rollback) if multiple repository operations occur.
- Throws HTTP exceptions (`400`, `403`, `404`) if business rules are violated.
- **Rule**: Services must not contain HTTP routing logic.

### 4. Repository (`app/repositories/`)
- Responsible for pure Database queries.
- Translates simple calls (e.g., `get_by_id`, `get_all(user_id=...)`) into SQLAlchemy ORM queries.
- **Rule**: Repositories must NOT contain business logic or throw HTTP exceptions. They return data or `None`.

### 5. Model (`app/models/`)
- The definitive blueprint (Source of Truth) for the PostgreSQL database structure.
- Uses SQLAlchemy 2.0 syntax (`Mapped`, `mapped_column`).
- Defines relationships (One-to-Many, Many-to-One).
