# Blue Collar Availability API - Test Report

**Date:** 2025-12-26
**Server:** http://localhost:8080
**API Prefix:** /api/v1

---

## Summary

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /blue-collar/availability` | PASS | All filters, pagination, sorting work |
| `GET /blue-collar/availability/check/:profileId` | PASS | Single profile check works |
| `GET /blue-collar/availability/project/:projectId` | PASS | Project-specific filtering works |
| `GET /blue-collar/availability/training/:batchId` | PASS | Returns 404 for non-existent batch (no test data) |

---

## Test Results

### 1. Main Availability Endpoint

**Endpoint:** `GET /api/v1/blue-collar/availability`

#### Basic Query
```bash
GET /api/v1/blue-collar/availability?startDate=2025-01-01&endDate=2025-01-31
```
**Result:** 35 available profiles, 0 unavailable

#### Purpose Filter
| Purpose | Result |
|---------|--------|
| `purpose=project` | 2 profiles (BENCHED only) |
| `purpose=training` | 0 profiles (no APPROVED/SCREENING) |
| `purpose=all` | 35 profiles |

#### Other Filters
| Filter | Result |
|--------|--------|
| `gender=male` | 32 profiles |
| `minAge=25&maxAge=35` | 27 profiles |
| `search=Sharma` | 2 profiles (Amit Sharma, Priya Sharma) |
| `states=Bihar` | 1 profile |
| `districts=Patna` | 1 profile |
| Combined (gender+age+state) | 20 profiles |

#### Pagination
| Test | Result |
|------|--------|
| `page=2&limit=5` | Page 2/7, 5 profiles |
| `page=999` | Empty array, correct pagination |
| `limit=500` | Capped to 100 |

#### Sorting
| Test | Result |
|------|--------|
| `sortBy=name&sortOrder=desc` | Yogesh Thakur first |
| `sortBy=age&sortOrder=asc` | Youngest first (29 years) |

---

### 2. Single Profile Check

**Endpoint:** `GET /api/v1/blue-collar/availability/check/:profileId`

```bash
GET /api/v1/blue-collar/availability/check/21922852-4296-4083-9691-6353d0861793?startDate=2025-01-01&endDate=2025-03-31
```

**Result:**
```json
{
  "success": true,
  "data": {
    "isAvailable": true,
    "blockingEvents": []
  }
}
```

---

### 3. Project-Specific Availability

**Endpoint:** `GET /api/v1/blue-collar/availability/project/:projectId`

```bash
GET /api/v1/blue-collar/availability/project/1159d516-ec7b-4fb0-8be4-a79ee3427846
```

**Project:** Test Stage Flow Project (Jan 15 - Mar 15, 2025)

**Result:**
- 2 available workers (BENCHED stage)
- 0 unavailable
- Correctly uses project dates automatically
- Returns only TRAINED/BENCHED profiles

---

### 4. Training-Specific Availability

**Endpoint:** `GET /api/v1/blue-collar/availability/training/:batchId`

**Note:** No training batches exist in DB. Tested with non-existent ID.

```bash
GET /api/v1/blue-collar/availability/training/00000000-0000-0000-0000-000000000000
```

**Result:**
```json
{
  "success": false,
  "message": "Training batch not found"
}
```

---

## Edge Cases

| Test Case | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Missing startDate | 400 error | "startDate and endDate are required" | PASS |
| Missing endDate | 400 error | "startDate and endDate are required" | PASS |
| Invalid date format | 400 error | "Invalid date format..." | PASS |
| startDate > endDate | 400 error | "startDate must be before or equal to endDate" | PASS |
| Invalid purpose | Falls back to 'all' | Returns all 35 profiles | PASS |
| Non-existent profile | Empty blocking events | isAvailable=true | PASS |
| Non-existent project | 404 error | "Project not found" | PASS |
| Project without dates | 400 error | "Project must have start and end dates" | PASS |
| Page > total pages | Empty array | available=[], correct pagination | PASS |
| Limit > 100 | Capped to 100 | limit=100 in response | PASS |

---

## Response Format Verification

### Available Profile Structure
```json
{
  "id": "uuid",
  "code": "BSW-00008",
  "fullName": "Amit Singh",
  "firstName": "Amit",
  "middleName": null,
  "lastName": "Singh",
  "gender": "male",
  "age": 37,
  "dateOfBirth": "1988-08-22T00:00:00.000Z",
  "profilePhotoURL": null,
  "phone": "9001234503",
  "currentStage": "BENCHED",
  "skills": [{
    "id": "uuid",
    "name": "Carpenter",
    "categoryType": "trainer",
    "yearsOfExperience": 8,
    "isPrimary": false
  }],
  "address": {
    "district": "Patna",
    "state": "Bihar"
  }
}
```

### Pagination Structure
```json
{
  "page": 1,
  "limit": 20,
  "totalAvailable": 35,
  "totalUnavailable": 0,
  "totalPagesAvailable": 2,
  "totalPagesUnavailable": 0
}
```

### Summary Structure
```json
{
  "totalAvailable": 35,
  "totalUnavailable": 0,
  "unavailableByProject": 0,
  "unavailableByTraining": 0
}
```

---

## Not Tested (Requires Auth/Data)

1. **Worker with project assignment** - Need to create an assignment to test blocking events
2. **Worker with training enrollment** - No training batches exist
3. **Overlapping project and training** - Needs both assignment and enrollment

---

## Recommendations

1. Create integration tests with mock auth
2. Add seed data for training batches
3. Test blocking events by creating assignments via API with auth token
