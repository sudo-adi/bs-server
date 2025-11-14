# Worker Portal APIs

## Overview
Complete authentication and portal APIs for approved workers to login and view their profile, training status, and project assignments.

## API Endpoints

### Base URL
`http://localhost:3000/api/v1/worker`

---

### 1. Worker Login
**Endpoint:** `POST /api/v1/worker/login`

**Description:** Authenticate a worker using phone number and password

**Request Body:**
```json
{
  "phone": "9876543210",
  "password": "3210"
}
```

**Password Logic:** Last 4 digits of phone number (for now)

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "profile": {
      "id": "uuid",
      "candidate_code": "EMP-20251114-1234",
      "name": "Worker Name",
      "phone": "9876543210",
      "current_stage": "approved"
    }
  }
}
```

**Response (Unapproved):**
```json
{
  "success": false,
  "message": "Your profile is not yet approved. Please wait for admin approval."
}
```

**Allowed Stages:** approved, trained, verified, benched, deployed

---

### 2. Worker Dashboard
**Endpoint:** `GET /api/v1/worker/dashboard`

**Description:** Get dashboard summary with key statistics

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "candidate_code": "EMP-20251114-1234",
      "name": "Worker Name",
      "phone": "9876543210",
      "current_stage": "trained"
    },
    "stats": {
      "total_trainings": 2,
      "completed_trainings": 1,
      "total_projects": 3,
      "active_projects": 1
    }
  }
}
```

---

### 3. Worker Profile
**Endpoint:** `GET /api/v1/worker/profile`

**Description:** Get complete profile information

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "candidate_code": "EMP-20251114-1234",
      "first_name": "Worker",
      "last_name": "Name",
      "phone": "9876543210",
      "email": "worker@example.com",
      "date_of_birth": "1990-01-15",
      "gender": "male",
      "current_stage": "trained",
      "created_at": "2024-11-14T10:30:00.000Z"
    },
    "addresses": [
      {
        "id": "uuid",
        "village": "Test Village",
        "district": "Test District",
        "state": "Test State",
        "postal_code": "123456"
      }
    ],
    "bank_accounts": [],
    "qualifications": [],
    "skills": [],
    "stage_history": [
      {
        "from_stage": "approved",
        "to_stage": "trained",
        "transitioned_at": "2024-11-14T12:00:00.000Z"
      }
    ]
  }
}
```

---

### 4. Worker Training Status
**Endpoint:** `GET /api/v1/worker/training`

**Description:** Get training batch enrollments and status

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_enrollments": 2,
    "completed_trainings": 1,
    "ongoing_trainings": 1,
    "enrollments": [
      {
        "id": "uuid",
        "status": "active",
        "enrollment_date": "2024-11-10",
        "completion_date": null,
        "attendance_percentage": "85.50",
        "score": null,
        "batch": {
          "id": "uuid",
          "name": "Construction Skills Training",
          "code": "CST-2024-001",
          "program_name": "Basic Construction",
          "start_date": "2024-11-01",
          "end_date": "2024-11-30",
          "location": "Training Center A",
          "trainer_name": "John Doe",
          "status": "ongoing"
        }
      }
    ]
  }
}
```

---

### 5. Worker Project Assignments
**Endpoint:** `GET /api/v1/worker/projects`

**Description:** Get project deployments and assignments

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_projects": 3,
    "active_projects": 1,
    "completed_projects": 2,
    "assignments": [
      {
        "id": "uuid",
        "status": "active",
        "deployment_date": "2024-11-15",
        "expected_end_date": "2025-01-15",
        "actual_end_date": null,
        "project": {
          "id": "uuid",
          "name": "Highway Construction Project",
          "code": "PRJ-2024-001",
          "location": "Mumbai, Maharashtra",
          "start_date": "2024-11-01",
          "end_date": "2025-03-31",
          "status": "ongoing",
          "employers": {
            "company_name": "ABC Construction Ltd",
            "client_name": "National Highways Authority"
          }
        }
      }
    ]
  }
}
```

---

## Testing with curl

### 1. Test Login
```bash
curl -X POST http://localhost:3000/api/v1/worker/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "3210"
  }'
```

### 2. Test Dashboard (with token)
```bash
curl -X GET http://localhost:3000/api/v1/worker/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Test Profile
```bash
curl -X GET http://localhost:3000/api/v1/worker/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Test Training Status
```bash
curl -X GET http://localhost:3000/api/v1/worker/training \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Test Projects
```bash
curl -X GET http://localhost:3000/api/v1/worker/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Authentication Flow

1. Worker registers via `/api/v1/employee/register`
2. Profile created with "new registration" stage
3. Admin reviews and approves profile (changes stage to "approved")
4. Worker can now login at `/api/v1/worker/login`
5. Receives JWT token valid for 30 days
6. Uses token in Authorization header for all portal APIs
7. Can view profile, training, and project details

---

## Stage-Based Access Control

**Can Login:** approved, trained, verified, benched, deployed

**Cannot Login:** new registration, rejected, blacklisted

The login API checks the current stage and only allows access if the worker's profile is in an approved stage or beyond.

---

## Files Created

1. `/server/src/controllers/employers/employeePortal.controller.ts` - Portal API controllers
2. `/server/src/middlewares/workerAuth.middleware.ts` - JWT authentication middleware
3. `/server/src/routes/employers/employeePortal.routes.ts` - Portal routes
4. Updated `/server/src/routes/index.ts` - Added worker routes
5. Updated type definitions for worker user object

---

## Next Steps

1. Test login with approved worker accounts
2. Implement frontend login page
3. Create worker dashboard UI
4. Implement OTP-based login (optional enhancement)
5. Add password reset flow
