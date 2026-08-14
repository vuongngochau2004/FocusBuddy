# User Management API

This module handles user registration, authentication, and user profile management.

## 1. User Registration & Auth

### `POST /api/v1/users`
**Purpose**: Register a new user.
**Request**:
```json
{
  "email": "student@example.com",
  "username": "student1",
  "password": "strongpassword123",
  "full_name": "Student Name"
}
```
**Response (201 Created)**:
```json
{
  "id": "uuid",
  "email": "student@example.com",
  "username": "student1",
  "full_name": "Student Name",
  "is_active": true,
  "created_at": "datetime"
}
```

### `POST /api/v1/users/login`
**Purpose**: Authenticate a user and receive an access token (Standard OAuth2 Password Flow).
**Request** (Form Data):
- `username`: The user's email or username.
- `password`: The user's password.
**Response (200 OK)**:
```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer"
}
```

## 2. User Data

### `GET /api/v1/users/me`
**Purpose**: Retrieve the current authenticated user's details.

### `PUT /api/v1/users/me`
**Purpose**: Update the current user's profile.

### `GET /api/v1/users/{id}`
**Purpose**: Get details of a specific user (admin only).

## Error Codes
- **401 Unauthorized**: Invalid credentials or missing token.
- **409 Conflict**: Email or username already registered.
