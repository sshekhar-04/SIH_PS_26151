---
name: api-testing
description: >-
  Provides procedures and standards for RESTful API testing, endpoint contract verification,
  payload validation, status code checks, curl request generation, and integration test patterns.
  Use when the user asks to test REST endpoints, debug APIs, create Postman/curl requests, or write API integration tests.
---

# REST API Testing & Verification

This skill provides methodologies for verifying REST APIs for reliability, correctness, and adherence to HTTP standards.

---

## 1. HTTP Status Code Contract Matrix

Always verify that endpoints return semantically correct HTTP status codes:

| Scenario | Expected Status | Description |
| :--- | :--- | :--- |
| **Success (with data)** | `200 OK` | Read or updated resource returned in body |
| **Resource Created** | `201 Created` | Successful creation (preferably with `Location` header or created object) |
| **Accepted (Async)** | `202 Accepted` | Request accepted for asynchronous processing |
| **Success (no body)** | `204 No Content` | Successful deletion or action with empty response |
| **Client Validation Error** | `400 Bad Request` | Malformed JSON, failed field validations |
| **Unauthenticated** | `401 Unauthorized` | Missing, expired, or invalid JWT/bearer token |
| **Forbidden** | `403 Forbidden` | Authenticated user lacks required role/permission |
| **Not Found** | `404 Not Found` | Resource ID does not exist |
| **Conflict** | `409 Conflict` | Unique constraint violation (e.g. duplicate email) |
| **Server Error** | `500 Internal Server Error` | Uncaught exception; ensure no stack traces are leaked to client |

---

## 2. Standard Testing Checklist

For every endpoint under test:
1. **Happy Path**: Test with valid inputs and verify the response structure, data types, and status code.
2. **Missing Required Fields**: Send payloads missing mandatory fields (`@NotNull`, `@NotBlank`) and verify `400 Bad Request` with structured error messages.
3. **Boundary Values**: Test edge limits (e.g. 0, negative IDs, strings exceeding max length, future/past dates).
4. **Authentication & Authorization**:
   - Call without `Authorization` header -> Expect `401`.
   - Call with unauthorized role -> Expect `403`.
5. **Idempotency**:
   - `GET`, `PUT`, `DELETE` should be idempotent (multiple identical calls produce the same state).

---

## 3. Practical Testing Tools & Snippets

### A. Testing with cURL
```bash
# POST request with JSON payload & Bearer Token
curl -X POST "http://localhost:8080/api/v1/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

### B. Standard Error Response Structure
Ensure backend APIs return a consistent error payload across all endpoints:
```json
{
  "timestamp": "2026-08-16T02:45:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for request",
  "path": "/api/v1/users",
  "errors": [
    {
      "field": "email",
      "message": "must be a well-formed email address"
    }
  ]
}
```
