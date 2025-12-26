# Project Stage API - End-to-End Test Results

**Date:** 2025-12-26
**API Prefix:** `/api/v1`

---

## Summary

### Passed Tests
- [x] Create Project (starts in APPROVED)
- [x] Start Planning (APPROVED -> PLANNING)
- [x] Share Project (PLANNING -> SHARED)
- [x] Start Project (SHARED -> ONGOING)
- [x] Hold Project (ONGOING -> ON_HOLD)
- [x] Resume Project (ON_HOLD -> ONGOING)
- [x] Complete Project (ONGOING -> COMPLETED)
- [x] Terminate Project (ONGOING -> TERMINATED)
- [x] Short Close Project (ONGOING -> SHORT_CLOSED)
- [x] Cancel Project (APPROVED -> CANCELLED)
- [x] Status History tracking
- [x] Invalid stage transition rejection (e.g., APPROVED -> ONGOING)
- [x] Missing changeReason validation
- [x] Non-existent project returns "Project not found"
- [x] Hold with EMPLOYER, BUILDSEWA, FORCE_MAJEURE

### Failed Tests / Bugs Found

---

## BUGS TO FIX

### BUG 1: Hold from END STATE allowed (HIGH PRIORITY)
**Location:** `src/services/project/operations/projectStageOperations.ts` - `holdProject` function
**Issue:** A TERMINATED project was successfully put on hold. End states should be final.
**Test Case:**
```bash
# Project was in TERMINATED state, but this succeeded:
POST /api/v1/projects/745c667c-e9d2-4478-a3c0-abd62f4627b0/stage/hold
# Response: {"success":true,"stage":"on_hold"}
```
**Fix Needed:** Add validation in `holdProject` to check current stage is ONGOING before allowing hold.

---

### BUG 2: Invalid attributableTo value accepted (MEDIUM PRIORITY)
**Location:** `src/services/project/operations/projectStageOperations.ts` - `holdProject` function
**Issue:** The hold endpoint accepts any string for `attributableTo` instead of validating against the enum.
**Test Case:**
```bash
POST /api/v1/projects/{id}/stage/hold
Body: {"attributableTo": "INVALID_VALUE", ...}
# Response: {"success":true,"onHoldAttributableTo":"INVALID_VALUE"}
```
**Fix Needed:** Validate `attributableTo` is one of: EMPLOYER, BUILDSEWA, FORCE_MAJEURE

---

### BUG 3: Raw Prisma errors exposed (MEDIUM PRIORITY)
**Location:** Various stage operation handlers
**Issue:** Invalid UUID format and FK constraint violations return raw Prisma error messages instead of clean user-friendly errors.

**Test Cases:**
```bash
# Invalid UUID:
POST /api/v1/projects/invalid-id/stage/start-planning
# Response: "...Error creating UUID, invalid character..."

# Non-existent userId:
POST /api/v1/projects/{id}/stage/resume
Body: {"userId": "00000000-0000-0000-0000-000000000000"}
# Response: "Foreign key constraint violated..."
```
**Fix Needed:** Wrap database operations in try-catch and return clean error messages.

---

## NOTES (Not Bugs, Just Observations)

### NOTE 1: changeReason is required for all stage transitions
All stage transition endpoints require `changeReason` in the request body. This is good for audit trail.

### NOTE 2: Complete/Short-close auto-set actualEndDate
If `actualEndDate` is not provided, it defaults to today's date. This might be acceptable behavior.

### NOTE 3: Cancel can skip intermediate stages
CANCEL works directly from APPROVED, PLANNING, or SHARED stages - doesn't require going through ONGOING. This is by design.

### NOTE 4: authMiddleware is currently commented out
**Location:** `src/routes/project.routes.ts`
**TODO:** Re-enable authMiddleware after testing (marked with TODO comment in code)

---

## Test Data Created

| Project Code | Name | Final Stage | Purpose |
|-------------|------|-------------|---------|
| BSP-0005 | Terminate Test Project | on_hold (was terminated) | TERMINATE test (buggy) |
| BSP-0006 | Short Close Test Project | short_closed | SHORT_CLOSE test |
| BSP-0007 | Cancel Test Project | cancelled | CANCEL test |
| BSP-0008 | Edge Case Test Project | on_hold | Edge case testing |
| BSP-0009 | Complete Test Project | completed | COMPLETE test |

---

## Required Fields Summary

| Endpoint | Required Fields |
|----------|----------------|
| /stage/start-planning | userId, changeReason |
| /stage/share | userId, changeReason |
| /stage/start | userId, changeReason |
| /stage/hold | userId, changeReason, attributableTo |
| /stage/resume | userId, changeReason |
| /stage/complete | userId, changeReason |
| /stage/terminate | userId, changeReason |
| /stage/short-close | userId, changeReason, actualEndDate |
| /stage/cancel | userId, changeReason |
