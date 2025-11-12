# Employer Module

This module handles all employer-related functionality including employer management, authorized persons, and project requests.

## Database Structure

Based on the Prisma schema, the employer module consists of three main tables:

### 1. `employers` Table
Main employer information table with the following key fields:
- `id` (UUID, PK)
- `employer_code` (VARCHAR, unique)
- `company_name` (VARCHAR)
- `client_name` (VARCHAR)
- `email` (VARCHAR, unique)
- `password_hash` (VARCHAR)
- `phone` (VARCHAR)
- `alt_phone` (VARCHAR, optional)
- `registered_address` (TEXT, optional)
- `company_registration_number` (VARCHAR, optional)
- `gst_number` (VARCHAR, optional)
- `is_approved` (BOOLEAN)
- `is_active` (BOOLEAN)
- `is_verified` (BOOLEAN)
- `verified_at` (TIMESTAMP)
- `verified_by_user_id` (UUID, FK to users)
- `deleted_at` (TIMESTAMP, soft delete)
- `deleted_by_user_id` (UUID, FK to users)
- `last_login` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 2. `employer_authorized_persons` Table
Stores authorized contact persons for employers:
- `id` (UUID, PK)
- `employer_id` (UUID, FK to employers)
- `name` (VARCHAR)
- `designation` (VARCHAR)
- `email` (VARCHAR)
- `phone` (VARCHAR)
- `address` (TEXT)
- `is_primary` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 3. `project_requests` Table
Project requests submitted by employers:
- `id` (UUID, PK)
- `employer_id` (UUID, FK to employers)
- `project_id` (UUID, FK to projects, optional - set after approval)
- `project_title` (VARCHAR)
- `project_description` (TEXT)
- `location` (VARCHAR)
- `estimated_start_date` (DATE)
- `estimated_duration_days` (INT)
- `estimated_budget` (DECIMAL)
- `required_workers_count` (INT)
- `additional_notes` (TEXT)
- `status` (VARCHAR: pending/approved/rejected)
- `reviewed_at` (TIMESTAMP)
- `reviewed_by_user_id` (UUID, FK to users)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Relations

- `employers` → `employer_authorized_persons` (one-to-many)
- `employers` → `project_requests` (one-to-many)
- `employers` → `projects` (one-to-many)
- `project_requests` → `projects` (many-to-one, optional)

## Module Structure

```
src/
├── models/employers/
│   ├── index.ts                     # Exports all employer types and DTOs
│   ├── employer.model.ts            # All DTOs and type exports
│   └── README.md                    # This file
│
├── services/employers/
│   ├── index.ts                     # Exports all employer services
│   ├── employer.service.ts          # Main employer service
│   ├── employerAuthorizedPerson.service.ts
│   └── projectRequest.service.ts
│
├── controllers/employers/
│   ├── index.ts                     # Exports all employer controllers
│   ├── employer.controller.ts       # Main employer controller
│   ├── employerAuthorizedPerson.controller.ts
│   └── projectRequest.controller.ts
│
└── routes/employers/
    ├── index.ts                     # Main employer routes aggregator
    ├── employer.routes.ts           # Employer CRUD routes
    ├── employerAuthorizedPerson.routes.ts
    └── projectRequest.routes.ts
```

## API Endpoints

### Employer Management
- `POST /api/employers` - Create employer (admin)
- `GET /api/employers` - Get all employers with filters
- `GET /api/employers/:id` - Get employer by ID
- `PATCH /api/employers/:id` - Update employer
- `POST /api/employers/:id/approve` - Approve employer
- `DELETE /api/employers/:id` - Soft delete employer

### Employer Authorized Persons
- `GET /api/employers/authorized-persons/employer/:employerId` - Get all for employer
- `GET /api/employers/authorized-persons/:id` - Get by ID
- `POST /api/employers/authorized-persons` - Create new
- `PATCH /api/employers/authorized-persons/:id` - Update
- `DELETE /api/employers/authorized-persons/:id` - Delete

### Project Requests
- `GET /api/employers/project-requests` - Get all (admin)
- `GET /api/employers/project-requests/employer/:employerId` - Get by employer
- `GET /api/employers/project-requests/:id` - Get by ID
- `POST /api/employers/project-requests` - Create new
- `PATCH /api/employers/project-requests/:id` - Update
- `POST /api/employers/project-requests/:id/review` - Review (admin)
- `DELETE /api/employers/project-requests/:id` - Delete

### Authentication
- `POST /api/auth/employer/register` - Self-registration with project
- `POST /api/auth/employer/login` - Login
- `GET /api/auth/employer/me` - Get current employer

## DTOs

### RegisterEmployerDto
Used for self-registration (includes project details):
```typescript
{
  company_name: string;
  client_name: string;
  email: string;
  password: string;
  phone: string;
  alt_phone?: string;
  // ... employer fields

  // Authorized person (required)
  authorized_person_name: string;
  authorized_person_designation: string;
  authorized_person_email: string;
  authorized_person_contact: string;
  authorized_person_address: string;

  // Project details (required)
  project_name: string;
  project_description: string;
  site_address: string;
  city: string;
  district: string;
  state: string;
  postal_code: string;

  // Worker requirements
  worker_requirements: Array<{
    category: string;
    count: number;
  }>;
}
```

### CreateEmployerDto
Used by admin to create employer (without project):
```typescript
{
  company_name: string;
  client_name: string;
  email: string;
  password: string;
  phone: string;
  alt_phone?: string;
  // ... other fields

  // Authorized person (required)
  authorized_person_name: string;
  authorized_person_designation: string;
  authorized_person_email: string;
  authorized_person_contact: string;
  authorized_person_address: string;
}
```

### UpdateEmployerDto
```typescript
{
  company_name?: string;
  client_name?: string;
  email?: string;
  phone?: string;
  alt_phone?: string;
  // ... other optional fields
  is_active?: boolean;
  is_approved?: boolean;
  is_verified?: boolean;
}
```

## Important Notes

1. **Field Names**: Always use `phone` and `alt_phone` (not `phone_number` or `alternative_phone`)

2. **Soft Deletes**: Employers use soft delete via `deleted_at` field

3. **Authorization Flow**:
   - Employer registers → `is_approved: false`, `is_verified: false`
   - Admin verifies → `is_verified: true`
   - Admin approves → `is_approved: true`
   - Employer can login only when both verified and approved

4. **Authorized Persons**:
   - At least one authorized person is required per employer
   - Cannot delete if it's the only authorized person
   - Only one can be marked as primary

5. **Project Requests**:
   - Created during registration or separately by employer
   - Status: pending → approved/rejected
   - Can only be updated/deleted when status is pending
   - When approved, linked to a project via `project_id`

## Usage Examples

### Creating an Employer (Admin)
```typescript
import { employerService } from '@/services/employers';

const employer = await employerService.createEmployer({
  company_name: "ABC Construction",
  client_name: "John Doe",
  email: "john@abc.com",
  password: "secure123",
  phone: "1234567890",
  authorized_person_name: "Jane Smith",
  authorized_person_designation: "HR Manager",
  authorized_person_email: "jane@abc.com",
  authorized_person_contact: "0987654321",
  authorized_person_address: "123 Main St",
});
```

### Employer Self-Registration
```typescript
const { employer, token, project } = await employerService.registerEmployer({
  // ... employer fields
  // ... authorized person fields
  // ... project fields
  worker_requirements: [
    { category: "Mason", count: 10 },
    { category: "Carpenter", count: 5 }
  ]
});
```
