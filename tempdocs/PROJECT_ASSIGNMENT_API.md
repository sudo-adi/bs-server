# Project Assignment API Documentation

> **For Frontend Development**
> Last Updated: 2025-12-26

---

## Table of Contents

1. [Overview](#overview)
2. [Worker Lifecycle](#worker-lifecycle)
3. [Project Lifecycle](#project-lifecycle)
4. [API Endpoints](#api-endpoints)
   - [Get Available Workers](#1-get-available-workers-for-project)
   - [Assign Worker to Project](#2-assign-worker-to-project)
   - [Get Worker Next Stage](#3-get-worker-next-stage)
   - [Get Worker Upcoming Assignments](#4-get-worker-upcoming-assignments)
   - [Project Stage Transitions](#5-project-stage-transitions)
5. [Error Handling](#error-handling)
6. [Type Definitions](#type-definitions)

---

## Overview

This API handles the project-worker assignment workflow for blue-collar workers in the BuildSewa system.

### Key Concepts

| Term | Code | Description |
|------|------|-------------|
| Candidate | BSC-XXXXX | Person who completed training but not yet assigned to project |
| Worker | BSW-XXXXX | Person who has been assigned to at least one project |
| TRAINED | Profile Stage | Candidate ready for assignment (has BSC code) |
| BENCHED | Profile Stage | Worker available for assignment (has BSW code) |
| MATCHED | Profile Stage | Worker selected for a project (internal) |
| ASSIGNED | Profile Stage | Worker shared with employer |
| ON_SITE | Profile Stage | Worker deployed on active project |

---

## Worker Lifecycle

```
TRAINED (BSC) ──► MATCHED ──► ASSIGNED ──► ON_SITE ──► BENCHED
     │               │           │            │           │
     │               │           │            │           │
     └───────────────┴───────────┴────────────┴───────────┘
                              │
                        (NextStageService)
                        determines next state
```

### Auto-Conversion: BSC → BSW

When a TRAINED candidate (BSC code only) is assigned to their first project:
- System automatically generates BSW code
- Profile converts from candidate to worker
- Response includes `convertedToWorker: true`

---

## Project Lifecycle

```
APPROVED ──► PLANNING ──► SHARED ──► ONGOING ──► COMPLETED
                │            │          │
                │            │          ├──► TERMINATED
                │            │          │
                │            │          └──► SHORT_CLOSED
                │            │
                └────────────┴──────────► CANCELLED (only before ONGOING)
```

---

## API Endpoints

### 1. Get Available Workers for Project

Get all TRAINED and BENCHED workers available in the availability zone for a project.

```
GET /api/blue-collar/availability/project/:projectId
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `availabilityStatus` | string | No | `available` \| `unavailable` \| `all` (default: `available`) |
| `skillCategoryIds` | string | No | Comma-separated UUIDs |
| `stages` | string | No | Comma-separated: `TRAINED,BENCHED` |
| `gender` | string | No | Filter by gender |
| `minAge` | number | No | Minimum age |
| `maxAge` | number | No | Maximum age |
| `districts` | string | No | Comma-separated district names |
| `states` | string | No | Comma-separated state names |
| `search` | string | No | Search by name or code |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20, max: 100) |
| `sortBy` | string | No | `name` \| `code` \| `age` |
| `sortOrder` | string | No | `asc` \| `desc` |

#### Response

```typescript
{
  success: true,
  data: {
    profiles: [
      {
        id: "uuid",
        candidateCode: "BSC-00123",
        workerCode: "BSW-00089" | null,  // null if TRAINED candidate
        firstName: "Ramesh",
        lastName: "Kumar",
        phone: "9876543210",
        currentStage: "TRAINED" | "BENCHED",
        workerType: "blue",
        gender: "male",
        age: 28,
        profilePhotoURL: "https://...",
        isAvailable: true,
        skills: [
          { id: "uuid", name: "Helper", categoryType: "blue_collar" }
        ],
        address: {
          district: "Patna",
          state: "Bihar"
        }
      }
    ],
    pagination: {
      total: 150,
      page: 1,
      limit: 20,
      totalPages: 8
    },
    projectDates: {
      startDate: "2025-02-01",
      endDate: "2025-06-30"
    }
  }
}
```

---

### 2. Assign Worker to Project

Assign a single worker (TRAINED or BENCHED) to a project.

```
POST /api/projects/:projectId/workers
```

#### Request Body

```typescript
{
  profileId: "uuid"         // Required: Worker profile ID
}
```

#### Response (Normal Assignment)

```typescript
{
  success: true,
  data: {
    id: "assignment-uuid",
    projectId: "project-uuid",
    profileId: "profile-uuid",
    stage: "MATCHED",
    matchedAt: "2025-01-26T10:30:00Z",
    convertedToWorker: false,
    previousStage: "BENCHED",
    newWorkerCode: null,
    profile: {
      id: "uuid",
      firstName: "Ramesh",
      lastName: "Kumar",
      workerCode: "BSW-00089",
      candidateCode: "BSC-00123",
      currentStage: "MATCHED"
    }
  }
}
```

#### Response (BSC→BSW Conversion)

When assigning a TRAINED candidate for the first time:

```typescript
{
  success: true,
  data: {
    id: "assignment-uuid",
    projectId: "project-uuid",
    profileId: "profile-uuid",
    stage: "MATCHED",
    matchedAt: "2025-01-26T10:30:00Z",
    convertedToWorker: true,           // Indicates conversion happened
    previousStage: "TRAINED",          // Was TRAINED before
    newWorkerCode: "BSW-00090",        // Newly generated BSW code
    profile: {
      id: "uuid",
      firstName: "Ramesh",
      lastName: "Kumar",
      workerCode: "BSW-00090",         // Now has BSW code
      candidateCode: "BSC-00123",
      currentStage: "MATCHED"
    }
  },
  message: "Candidate BSC-00123 converted to worker BSW-00090 and matched to project"
}
```

#### Error Responses

```typescript
// Worker not in allocatable stage
{
  success: false,
  message: "Only benched workers or trained candidates can be allocated. Current stage: ON_SITE"
}

// Not blue-collar
{
  success: false,
  message: "Only blue-collar workers can be assigned to projects. Worker type: white"
}

// Already assigned
{
  success: false,
  message: "Profile is already assigned to this project"
}

// Availability conflict
{
  success: false,
  message: "Profile has overlapping commitments:\nproject: Metro Phase 2 (2025-02-01 - 2025-06-30)"
}
```

---

### 3. Get Worker Next Stage

Determine what stage a worker will transition to after their current project ends.

```
GET /api/profiles/:profileId/next-stage
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `excludeProjectId` | string | No | Exclude this project from calculation |
| `referenceDate` | string | No | ISO date string (default: today) |

#### Response

```typescript
{
  success: true,
  data: {
    profileId: "uuid",
    workerCode: "BSW-00089",
    candidateCode: "BSC-00123",
    currentStage: "ON_SITE",
    currentProject: {
      id: "uuid",
      projectCode: "BSP-0045",
      name: "Metro Phase 2",
      stage: "ongoing",
      endDate: "2025-06-30"
    },
    nextStage: "MATCHED",              // What worker will become
    reason: "Has upcoming matched project",
    nextProject: {                      // The next project (if any)
      id: "uuid",
      projectCode: "BSP-0050",
      name: "Highway Extension",
      stage: "planning",
      assignmentStage: "MATCHED",
      startDate: "2025-07-15",
      endDate: "2025-12-31"
    },
    nextTraining: null,                 // Next training (if any)
    upcomingAssignments: [              // All upcoming assignments
      {
        projectId: "uuid",
        projectCode: "BSP-0050",
        projectName: "Highway Extension",
        assignmentStage: "MATCHED",
        startDate: "2025-07-15"
      }
    ]
  }
}
```

#### Response (No Upcoming)

```typescript
{
  success: true,
  data: {
    profileId: "uuid",
    workerCode: "BSW-00089",
    currentStage: "ON_SITE",
    nextStage: "BENCHED",
    reason: "No upcoming project or training assignments",
    currentProject: {...},
    nextProject: null,
    nextTraining: null,
    upcomingAssignments: []
  }
}
```

---

### 4. Get Worker Upcoming Assignments

Get all upcoming project assignments and training enrollments for a worker.

```
GET /api/profiles/:profileId/upcoming-assignments
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `includeCompleted` | boolean | No | Include completed assignments (default: false) |

#### Response

```typescript
{
  success: true,
  data: {
    profileId: "uuid",
    workerCode: "BSW-00089",
    currentStage: "ON_SITE",
    assignments: [
      {
        id: "assignment-uuid",
        type: "project",
        projectId: "uuid",
        projectCode: "BSP-0045",
        projectName: "Metro Phase 2",
        projectStage: "ongoing",
        assignmentStage: "ON_SITE",
        startDate: "2025-01-15",
        endDate: "2025-06-30",
        isCurrent: true                // Currently active
      },
      {
        id: "assignment-uuid",
        type: "project",
        projectId: "uuid",
        projectCode: "BSP-0050",
        projectName: "Highway Extension",
        projectStage: "planning",
        assignmentStage: "MATCHED",
        startDate: "2025-07-15",
        endDate: "2025-12-31",
        isCurrent: false
      }
    ],
    trainings: [
      {
        id: "enrollment-uuid",
        type: "training",
        batchId: "uuid",
        batchCode: "BST-0020",
        programName: "Safety Training",
        status: "ENROLLED",
        startDate: "2026-01-05",
        endDate: "2026-01-10"
      }
    ]
  }
}
```

---

### 5. Project Stage Transitions

#### 5.1 Start Planning (APPROVED → PLANNING)

```
POST /api/projects/:id/stage/start-planning
```

```typescript
// Request
{
  userId: "uuid",           // Required
  changeReason: "string",   // Required
  documentIds?: ["uuid"]    // Optional
}

// Response
{
  success: true,
  data: {
    id: "project-uuid",
    projectCode: "BSP-0045",
    name: "Metro Construction Phase 2",
    stage: "planning",
    stageChangedAt: "2025-01-26T10:30:00Z"
  }
}
```

#### 5.2 Share Project (PLANNING → SHARED)

Updates all MATCHED workers to ASSIGNED.

```
POST /api/projects/:id/stage/share
```

```typescript
// Request
{
  userId: "uuid",
  changeReason?: "Sharing worker details with employer",
  documentIds?: ["uuid"]
}

// Response
{
  success: true,
  data: {
    id: "project-uuid",
    stage: "shared",
    stageChangedAt: "2025-01-26T10:30:00Z"
  }
}
```

#### 5.3 Start Project (SHARED → ONGOING)

Updates all ASSIGNED workers to ON_SITE.

```
POST /api/projects/:id/stage/start
```

```typescript
// Request
{
  userId: "uuid",
  changeReason?: "Project started on site",
  actualStartDate?: "2025-02-01",
  documentIds?: ["uuid"]
}

// Response
{
  success: true,
  data: {
    id: "project-uuid",
    stage: "ongoing",
    actualStartDate: "2025-02-01",
    stageChangedAt: "2025-01-26T10:30:00Z"
  }
}
```

#### 5.4 Hold Project (→ ON_HOLD)

```
POST /api/projects/:id/stage/hold
```

```typescript
// Request
{
  userId: "uuid",
  changeReason: "Client payment pending",  // Required
  attributableTo: "EMPLOYER" | "BUILDSEWA" | "FORCE_MAJEURE",  // Required
  documentIds?: ["uuid"]
}

// Response
{
  success: true,
  data: {
    id: "project-uuid",
    stage: "on_hold",
    onHoldAttributableTo: "EMPLOYER",
    stageChangedAt: "2025-01-26T10:30:00Z"
  }
}
```

**Worker Stage based on Attribution:**
| Attribution | Worker Stage |
|------------|--------------|
| EMPLOYER | Stays ON_SITE (employer responsible) |
| BUILDSEWA | Goes to ON_HOLD |
| FORCE_MAJEURE | Goes to ON_HOLD |

#### 5.5 Resume Project (ON_HOLD → ONGOING)

```
POST /api/projects/:id/stage/resume
```

```typescript
// Request
{
  userId: "uuid",
  changeReason?: "Payment received, resuming work",
  resumeToStage?: "ongoing",
  documentIds?: ["uuid"]
}
```

#### 5.6 Complete Project (→ COMPLETED)

Workers transition based on NextStageService.

```
POST /api/projects/:id/stage/complete
```

```typescript
// Request
{
  userId: "uuid",
  changeReason?: "Project completed successfully",
  actualEndDate?: "2025-06-30",
  documentIds?: ["uuid"]
}

// Response
{
  success: true,
  data: {
    id: "project-uuid",
    stage: "completed",
    completionDate: "2025-06-30",
    actualEndDate: "2025-06-30"
  }
}
```

#### 5.7 Terminate Project (→ TERMINATED)

```
POST /api/projects/:id/stage/terminate
```

```typescript
// Request
{
  userId: "uuid",
  changeReason: "Project terminated due to contractor issues",  // Required
  terminationDate?: "2025-04-15",
  actualEndDate?: "2025-04-15",
  documentIds?: ["uuid"]
}
```

#### 5.8 Cancel Project (→ CANCELLED)

**IMPORTANT:** Can only cancel projects that have NEVER started (never reached ONGOING).

```
POST /api/projects/:id/stage/cancel
```

```typescript
// Request
{
  userId: "uuid",
  changeReason: "Client cancelled the project",  // Required
  documentIds?: ["uuid"]
}

// Success Response (project in APPROVED/PLANNING/SHARED)
{
  success: true,
  data: {
    id: "project-uuid",
    stage: "cancelled"
  }
}

// Error Response (project already started)
{
  success: false,
  message: "Cannot cancel project after it has started. Current stage: ongoing. Use 'terminate' for ending a started project, or 'short-close' for early completion."
}
```

#### 5.9 Short Close Project (→ SHORT_CLOSED)

For projects ending before expected completion date.

```
POST /api/projects/:id/stage/short-close
```

```typescript
// Request
{
  userId: "uuid",
  changeReason: "Project scope reduced",  // Required
  actualEndDate: "2025-04-15",           // Required
  documentIds?: ["uuid"]
}
```

---

## Error Handling

All endpoints return consistent error format:

```typescript
{
  success: false,
  message: "Error description here"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate) |
| 500 | Server error |

---

## Type Definitions

### Profile Stages

```typescript
type ProfileStage =
  | 'NEW_REGISTRATION'
  | 'SCREENING'
  | 'APPROVED'
  | 'REJECTED'
  | 'TRAINING_SCHEDULED'
  | 'IN_TRAINING'
  | 'TRAINED'           // Candidate ready for assignment
  | 'WORKER'
  | 'BENCHED'           // Worker available
  | 'MATCHED'           // Selected for project
  | 'ASSIGNED'          // Shared with employer
  | 'ONBOARDED'
  | 'ON_SITE'           // Deployed on project
  | 'ON_HOLD';
```

### Project Stages

```typescript
type ProjectStage =
  | 'approved'
  | 'planning'
  | 'shared'
  | 'ongoing'
  | 'on_hold'
  | 'terminated'
  | 'cancelled'
  | 'short_closed'
  | 'completed';
```

### Assignment Stages

```typescript
type AssignmentStage =
  | 'MATCHED'
  | 'ASSIGNED'
  | 'ON_SITE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'REMOVED';
```

### Hold Attribution

```typescript
type HoldAttribution =
  | 'EMPLOYER'       // Workers stay ON_SITE
  | 'BUILDSEWA'      // Workers go to ON_HOLD
  | 'FORCE_MAJEURE'; // Workers go to ON_HOLD
```

---

## Quick Reference

### Worker Assignment Flow

1. **Get available workers**: `GET /api/blue-collar/availability/project/:projectId`
2. **Select and assign**: `POST /api/projects/:projectId/workers` (one at a time)
3. **Share with employer**: `POST /api/projects/:projectId/stage/share`
4. **Start project**: `POST /api/projects/:projectId/stage/start`

### Check Worker Status

1. **Current assignments**: `GET /api/profiles/:id/upcoming-assignments`
2. **Next stage after project**: `GET /api/profiles/:id/next-stage`

### End Project Options

| Scenario | Endpoint | Requirements |
|----------|----------|--------------|
| Successfully completed | `/stage/complete` | Project was ONGOING |
| Ending early but OK | `/stage/short-close` | Project was ONGOING |
| Problems, must stop | `/stage/terminate` | Project was ONGOING |
| Never started, cancel | `/stage/cancel` | Project was NEVER ONGOING |

---

## Test Results Summary

**Tested on:** 2025-12-26

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /profiles/:id/next-stage` | ✅ PASS | Returns correct next stage based on assignments |
| `GET /profiles/:id/upcoming-assignments` | ✅ PASS | Returns all project and training assignments |
| `POST /projects/:id/workers` (BSC→BSW) | ✅ PASS | Auto-converts TRAINED candidates to workers |
| `POST /projects/:id/stage/cancel` validation | ✅ PASS | Correctly rejects cancellation of started projects |
| `GET /blue-collar/availability/project/:id` | ✅ EXISTS | Available workers endpoint working |

### Cancel Validation Test

```
Request: POST /projects/{on_hold_project}/stage/cancel
Response: {
  "success": false,
  "message": "Cannot cancel project after it has started. Current stage: on_hold.
              Use 'terminate' for ending a started project, or 'short-close' for early completion."
}
```
