# Candidate Portal API Documentation

Complete API documentation for the candidate/employee authentication and portal system.

## Table of Contents
- [Authentication](#authentication)
- [Portal APIs](#portal-apis)
- [Response Formats](#response-formats)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## Authentication

### 1. Send OTP
Send OTP to candidate's mobile number for login.

**Endpoint:** `POST /api/candidate/auth/send-otp`

**Request Body:**
```json
{
  "phone": "9876543210"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"  // Only in development mode
}
```

**Response (Error - Not Registered):**
```json
{
  "success": false,
  "message": "Mobile number not registered. Please register first."
}
```

**Response (Error - Not Approved):**
```json
{
  "success": false,
  "message": "Your profile is under review. You can login once your profile is approved."
}
```

**Business Logic:**
- Only profiles with `current_stage = 'ready_to_deploy'` can login
- Profile must be `is_active = true`
- Profile must not be blacklisted
- OTP expires in 5 minutes
- In development, OTP is returned in response
- In production, OTP should be sent via SMS service

---

### 2. Verify OTP
Verify OTP and login candidate.

**Endpoint:** `POST /api/candidate/auth/verify-otp`

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "profile": {
      "id": "uuid",
      "candidate_code": "BS123456789",
      "phone": "9876543210",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "current_stage": "ready_to_deploy",
      "addresses": [...],
      "profile_skills": [...],
      "qualifications": [...],
      "documents": [...],
      "bank_accounts": [...]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - Invalid OTP):**
```json
{
  "success": false,
  "message": "Invalid OTP. Please try again."
}
```

**Response (Error - Expired OTP):**
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP."
}
```

**Token Details:**
- Expires in 30 days
- Contains: `profileId`, `phone`, `type: 'candidate'`
- Must be included in Authorization header for protected routes

---

### 3. Get Current Candidate
Get current logged-in candidate's profile.

**Endpoint:** `GET /api/candidate/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "candidate_code": "BS123456789",
    "phone": "9876543210",
    "first_name": "John",
    "last_name": "Doe",
    "current_stage": "ready_to_deploy",
    ...
  }
}
```

---

## Portal APIs

All portal APIs require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

### 4. Get Dashboard Summary
Get candidate's dashboard summary with counts and current activities.

**Endpoint:** `GET /api/candidate/portal/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "counts": {
      "matched_projects": 5,
      "training_enrollments": 3,
      "employment_history": 2
    },
    "current_training": {
      "batch_name": "Electrician Batch 2025",
      "program_name": "Basic Electrical Training",
      "trainer_name": "Mr. Sharma",
      "start_date": "2025-01-01",
      "end_date": "2025-03-31",
      "days_left": 45,
      "status": "in_progress",
      "skill_category": "Electrician"
    },
    "current_employment": {
      "project_name": "Metro Line 4 Construction",
      "project_location": "Delhi",
      "employer_name": "XYZ Construction Ltd",
      "deployment_date": "2025-02-01",
      "expected_end_date": "2025-12-31",
      "status": "deployed"
    }
  }
}
```

---

### 5. Get Full Profile
Get candidate's complete profile with all details.

**Endpoint:** `GET /api/candidate/portal/profile`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "candidate_code": "BS123456789",
    "phone": "9876543210",
    "alt_phone": "9876543211",
    "email": "john@example.com",
    "first_name": "John",
    "middle_name": "Kumar",
    "last_name": "Doe",
    "fathers_name": "Robert Doe",
    "gender": "male",
    "date_of_birth": "1995-01-15",
    "profile_photo_url": "https://...",
    "is_active": true,
    "current_stage": "ready_to_deploy",
    "addresses": [
      {
        "id": "uuid",
        "address_type": "permanent",
        "house_number": "123",
        "village_or_city": "Patna",
        "district": "Patna",
        "state": "Bihar",
        "postal_code": "800001",
        "is_current": true
      }
    ],
    "profile_skills": [
      {
        "id": "uuid",
        "years_of_experience": 5,
        "is_primary": true,
        "skill_categories": {
          "name": "Electrician",
          "description": "Electrical work"
        }
      }
    ],
    "qualifications": [
      {
        "id": "uuid",
        "institution_name": "Bihar Technical Institute",
        "field_of_study": "Electrical Engineering",
        "year_of_completion": 2020,
        "percentage_or_grade": "75%",
        "qualification_types": {
          "name": "ITI"
        }
      }
    ],
    "documents": [...],
    "bank_accounts": [...]
  }
}
```

---

### 6. Get Matched Projects
Get all projects where the candidate has been matched/shared.

**Endpoint:** `GET /api/candidate/portal/matched-projects`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "matched",
      "shared_at": "2025-01-15T10:30:00Z",
      "shared_by": "Admin User",
      "skill_category": "Electrician",
      "project": {
        "id": "uuid",
        "code": "PRJ001",
        "name": "Metro Line 4 Construction",
        "location": "Delhi",
        "start_date": "2025-02-01",
        "end_date": "2025-12-31",
        "status": "active",
        "description": "Metro construction project",
        "employer": {
          "company_name": "XYZ Construction Ltd",
          "client_name": "Delhi Metro Rail Corporation",
          "phone": "9876543210"
        }
      }
    }
  ],
  "total": 1
}
```

---

### 7. Get Training Enrollments
Get candidate's training batch enrollments (current, upcoming, and past).

**Endpoint:** `GET /api/candidate/portal/training`

**Response:**
```json
{
  "success": true,
  "data": {
    "current": [
      {
        "id": "uuid",
        "enrollment_date": "2025-01-01",
        "status": "in_progress",
        "attendance_percentage": 95.5,
        "score": 85.0,
        "enrolled_by": "Admin User",
        "days_left": 45,
        "batch": {
          "id": "uuid",
          "code": "BATCH001",
          "name": "Electrician Batch 2025",
          "program_name": "Basic Electrical Training",
          "provider": "Bihar Skill Development Mission",
          "trainer_name": "Mr. Sharma",
          "start_date": "2025-01-01",
          "end_date": "2025-03-31",
          "duration_days": 90,
          "status": "ongoing",
          "location": "Patna",
          "description": "Comprehensive electrical training",
          "skill_category": "Electrician"
        }
      }
    ],
    "upcoming": [],
    "past": [
      {
        "id": "uuid",
        "enrollment_date": "2024-06-01",
        "completion_date": "2024-08-31",
        "status": "completed",
        "attendance_percentage": 98.0,
        "score": 92.0,
        "days_left": 0,
        "batch": {
          "name": "Foundation Course 2024",
          ...
        }
      }
    ],
    "total": 2
  }
}
```

---

### 8. Get Employment History
Get candidate's project assignment/deployment history (current and past).

**Endpoint:** `GET /api/candidate/portal/employment`

**Response:**
```json
{
  "success": true,
  "data": {
    "current": [
      {
        "id": "uuid",
        "deployment_date": "2025-02-01",
        "expected_end_date": "2025-12-31",
        "status": "deployed",
        "days_worked": 30,
        "assigned_by": "Admin User",
        "project": {
          "id": "uuid",
          "code": "PRJ001",
          "name": "Metro Line 4 Construction",
          "location": "Delhi",
          "status": "active",
          "description": "Metro construction project",
          "is_accommodation_provided": true,
          "employer": {
            "company_name": "XYZ Construction Ltd",
            "client_name": "Delhi Metro Rail Corporation",
            "phone": "9876543210"
          }
        }
      }
    ],
    "past": [
      {
        "id": "uuid",
        "deployment_date": "2024-06-01",
        "expected_end_date": "2024-12-31",
        "actual_end_date": "2024-11-30",
        "status": "completed",
        "days_worked": 180,
        "project": {
          "name": "Highway Construction Project",
          ...
        }
      }
    ],
    "total": 2
  }
}
```

---

## Response Formats

### Success Response
All successful responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
All error responses follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Optional error details"
}
```

---

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (profile not approved/active) |
| 404 | Not Found (profile/resource not found) |
| 500 | Internal Server Error |

### Common Error Messages

**Authentication Errors:**
- "No token provided. Please login."
- "Invalid token"
- "Token has expired. Please login again."

**Profile Status Errors:**
- "Mobile number not registered. Please register first."
- "Your profile is under review. You can login once your profile is approved."
- "Your account has been deactivated. Please contact support."
- "Your account has been suspended. Please contact support."

**OTP Errors:**
- "OTP not found or expired. Please request a new OTP."
- "OTP has expired. Please request a new OTP."
- "Invalid OTP. Please try again."

---

## Testing

### Testing with cURL

**1. Send OTP:**
```bash
curl -X POST http://localhost:3001/api/candidate/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

**2. Verify OTP:**
```bash
curl -X POST http://localhost:3001/api/candidate/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "123456"}'
```

**3. Get Dashboard (with token):**
```bash
curl -X GET http://localhost:3001/api/candidate/portal/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Testing with Postman

1. **Create a collection** named "Candidate Portal"

2. **Create environment variables:**
   - `base_url`: `http://localhost:3001/api`
   - `candidate_token`: (will be set after login)

3. **Add requests:**
   - POST {{base_url}}/candidate/auth/send-otp
   - POST {{base_url}}/candidate/auth/verify-otp
   - GET {{base_url}}/candidate/auth/me
   - GET {{base_url}}/candidate/portal/dashboard
   - GET {{base_url}}/candidate/portal/profile
   - GET {{base_url}}/candidate/portal/matched-projects
   - GET {{base_url}}/candidate/portal/training
   - GET {{base_url}}/candidate/portal/employment

4. **Add test script** to verify-otp request to save token:
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("candidate_token", jsonData.data.token);
}
```

### Frontend Integration

**Initialize service:**
```typescript
import { candidateService } from '@/services/candidate.service';
```

**Login flow:**
```typescript
// Step 1: Send OTP
const response = await candidateService.sendOTP(phoneNumber);
console.log('OTP:', response.otp); // Only in dev mode

// Step 2: Verify OTP
const loginResponse = await candidateService.verifyOTP(phoneNumber, otp);
// Token is automatically stored in localStorage

// Step 3: Access protected resources
const dashboard = await candidateService.getDashboardSummary();
const profile = await candidateService.getProfile();
const projects = await candidateService.getMatchedProjects();
const training = await candidateService.getTrainingEnrollments();
const employment = await candidateService.getEmploymentHistory();
```

**Logout:**
```typescript
candidateService.logout(); // Clears token from localStorage
```

**Check login status:**
```typescript
if (candidateService.isLoggedIn()) {
  // User is logged in
}
```

---

## Notes

### Security Considerations

1. **OTP Implementation:**
   - Currently using in-memory storage (Map) for OTPs
   - In production, use Redis or database for OTP storage
   - Consider rate limiting on OTP requests (max 3 per phone per hour)

2. **JWT Tokens:**
   - Token expires in 30 days
   - Store securely in localStorage (not in cookies due to XSS risk)
   - Implement token refresh mechanism for better security

3. **Profile Approval:**
   - Only profiles with `current_stage = 'ready_to_deploy'` can login
   - This ensures candidates complete onboarding before accessing portal

4. **Blacklist Check:**
   - System checks if profile is blacklisted before login
   - Prevents access to suspended accounts

### Development vs Production

**Development Mode:**
- OTP is returned in API response
- No actual SMS sent
- Console logs for debugging

**Production Mode:**
- Integrate with SMS gateway (Twilio, AWS SNS, etc.)
- OTP not returned in response
- Use Redis for OTP storage
- Enable rate limiting
- Add proper logging and monitoring

### Future Enhancements

1. Add SMS gateway integration
2. Implement rate limiting
3. Add email notifications
4. Add push notifications for mobile app
5. Implement real-time updates (WebSockets)
6. Add document upload/download functionality
7. Add profile update capabilities
8. Add password reset functionality
9. Add multi-language support

---

## Support

For issues or questions, contact the development team or raise an issue in the project repository.
