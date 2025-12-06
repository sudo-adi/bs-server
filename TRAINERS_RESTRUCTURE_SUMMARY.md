# Trainers System Restructure - Summary

## Overview
Restructured the trainers system to use `profile_id` instead of duplicating trainer information. This creates a cleaner architecture where trainers are profiles with additional trainer-specific metadata.

## Changes Made

### 1. Database Schema Changes

#### Trainers Table (`trainers`)
**Before:**
- Stored duplicate data: name, email, phone, password_hash, profile_photo_url, employee_code
- Directly linked to training_batches via `trainer_id` in training_batches table

**After:**
- `profile_id` (UUID, NOT NULL, UNIQUE) - Links to profiles table
- `specialization` (VARCHAR 500) - Trainer's area of expertise
- `certifications` (TEXT) - Professional certifications
- `years_of_experience` (INTEGER) - Training experience
- `bio` (TEXT) - Trainer biography
- `is_active` (BOOLEAN) - Active status
- `created_by_user_id` (UUID) - Who created the trainer record
- Timestamps: `created_at`, `updated_at`

**Benefits:**
- No data duplication - personal info comes from profiles table
- Trainers are now profiles with additional metadata
- Can query trainer information with a simple join

#### New Table: `trainer_batch_assignments`
Created to replace the old `trainer_id` and `shift` fields in `training_batches`.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `trainer_id` (UUID, FOREIGN KEY to trainers)
- `training_batch_id` (UUID, FOREIGN KEY to training_batches)
- `shift` (VARCHAR 20) - e.g., 'shift_1', 'shift_2'
- `assigned_date` (TIMESTAMP)
- `assigned_by_user_id` (UUID, FOREIGN KEY to users)
- `is_active` (BOOLEAN)
- Timestamps: `created_at`, `updated_at`

**Benefits:**
- Supports multiple trainers per batch (different shifts)
- Supports multiple batches per trainer
- Tracks who assigned the trainer and when
- Can deactivate assignments without deletion

#### Training Batches Table (`training_batches`)
**Removed Fields:**
- `trainer_id` - Replaced by `trainer_batch_assignments`
- `shift` - Moved to `trainer_batch_assignments`

**Added Indexes:**
- `idx_training_batches_status` on `status`
- `idx_training_batches_start_date` on `start_date`

### 2. TypeScript Type Updates

#### New Types Created:
- `/server/src/types/domain/training/trainer-batch-assignment.dto.ts`
  - `CreateTrainerBatchAssignmentDto`
  - `UpdateTrainerBatchAssignmentDto`
  - `AssignTrainerByProfileDto` - Convenient API for assigning using profile_id
  - `BulkAssignTrainersDto` - Assign multiple trainers at once

#### Updated Types:
- `CreateTrainerDto` - Now requires `profile_id` instead of name/phone
- `TrainerWithProfile` - Includes profile data
- `TrainerWithBatches` - Includes profile and batch assignments
- `TrainerBatchAssignmentWithDetails` - Full details of assignment with trainer profile and batch info
- `TrainingBatchWithEnrollments` - Now includes `trainer_batch_assignments`

### 3. New Service Created

#### `TrainerBatchAssignmentService`
Location: `/server/src/services/training/trainerBatchAssignment/trainerBatchAssignment.service.ts`

**Methods:**

1. `assignTrainerByProfile(data: AssignTrainerByProfileDto)`
   - Assign a trainer to a batch using their profile_id
   - Validates trainer exists and is active
   - Validates batch exists
   - Checks for schedule conflicts
   - Returns assignment with full details

2. `bulkAssignTrainers(data: BulkAssignTrainersDto)`
   - Assign multiple trainers to a batch at once
   - Handles partial failures gracefully

3. `getTrainersByBatch(batchId: string)`
   - Get all trainers assigned to a specific batch
   - Returns with profile and batch details
   - Ordered by shift

4. `getBatchesByTrainer(profileId: string)`
   - Get all batches assigned to a specific trainer
   - Uses profile_id for lookup
   - Returns with full batch and profile details

5. `removeTrainerFromBatch(assignmentId: string)`
   - Soft delete: sets `is_active = false`
   - Preserves assignment history

**Validation Logic:**
- Validates trainer doesn't have conflicting batches
- Max 2 batches per trainer per day (one per shift)
- Cannot have 2 batches with same shift on same day
- Checks day-by-day for date range conflicts

### 4. Updated Training Batch Service

#### `TrainingBatchCreateOperation`
- Removed old trainer validation logic
- No longer accepts `trainer_id` or `shift` fields
- Trainers must be assigned separately using `TrainerBatchAssignmentService`

## Migration Steps

Three migration files created:

1. **`update_trainers_and_add_assignments.sql`** - General migration with data preservation
2. **`trainers_restructure.sql`** - Creates profiles for existing trainers
3. **`handle_existing_trainer.sql`** - Specifically for Supabase with 1 existing trainer

### To Apply Migration:

**For Supabase (production):**
```bash
psql -h <supabase-host> -U postgres -d postgres -p 5432 -f prisma/migrations/handle_existing_trainer.sql
```

**For local development:**
```bash
# After migration, regenerate Prisma client
npx prisma generate

# Then push schema
npx prisma db push
```

## API Flow Changes

### Old Flow (Before):
```typescript
// Create training batch with trainer
POST /api/v1/training/batches
{
  "name": "Batch 1",
  "trainer_id": "uuid",
  "shift": "shift_1",
  ...
}
```

### New Flow (After):
```typescript
// Step 1: Create training batch (without trainer)
POST /api/v1/training/batches
{
  "name": "Batch 1",
  ...
}

// Step 2: Assign trainer using profile_id
POST /api/v1/training/trainer-assignments
{
  "profile_id": "uuid",      // The profile ID of the trainer
  "training_batch_id": "uuid",
  "shift": "shift_1",
  "assigned_by_user_id": "uuid"
}

// Or bulk assign multiple trainers
POST /api/v1/training/trainer-assignments/bulk
{
  "training_batch_id": "uuid",
  "assignments": [
    { "profile_id": "uuid1", "shift": "shift_1" },
    { "profile_id": "uuid2", "shift": "shift_2" }
  ],
  "assigned_by_user_id": "uuid"
}
```

## How the System Works Now

### Creating a Trainer:
1. First, create (or have) a profile in the `profiles` table
2. Then create a trainer record linking to that profile:
```typescript
POST /api/v1/trainers
{
  "profile_id": "existing-profile-uuid",
  "specialization": "Electrical Work",
  "certifications": "ITI Certified",
  "years_of_experience": 5,
  "bio": "Experienced trainer..."
}
```

### Assigning Trainers to Batches:
1. Training batch exists
2. Profile is registered as a trainer (has entry in `trainers` table)
3. Use `TrainerBatchAssignmentService.assignTrainerByProfile()`
4. System validates:
   - Profile exists and is a trainer
   - Trainer is active
   - Batch exists
   - No schedule conflicts

### Querying Trainer Information:
```typescript
// Get trainer with profile info
const trainer = await prisma.trainers.findUnique({
  where: { id: trainerId },
  include: {
    profiles: {
      select: {
        first_name: true,
        last_name: true,
        phone: true,
        email: true,
        // ... other profile fields
      }
    }
  }
});

// Get all trainers for a batch
const assignments = await trainerBatchAssignmentService.getTrainersByBatch(batchId);

// Get all batches for a trainer
const batches = await trainerBatchAssignmentService.getBatchesByTrainer(profileId);
```

## Benefits of New System

1. **No Data Duplication**: Trainer personal info stored once in profiles
2. **Flexibility**: Multiple trainers per batch, multiple batches per trainer
3. **Better Tracking**: Know who assigned trainers and when
4. **Soft Deletes**: Can deactivate assignments without losing history
5. **Cleaner API**: Separate concerns - batch creation vs trainer assignment
6. **Scalability**: Easy to add more trainer-specific fields without affecting profiles
7. **Consistency**: Trainers follow same pattern as other entities that use profiles
8. **Schedule Validation**: Prevents double-booking trainers

## Next Steps

1. **Apply Migration**: Run the appropriate migration file on your database
2. **Update Frontend**: Update trainer assignment UI to use new API endpoints
3. **Test**: Verify trainer assignment, schedule validation, and queries work correctly
4. **Documentation**: Update API documentation for new trainer endpoints
5. **Clean Up**: Remove old CSV import logic if it references old trainer structure

## Files Modified/Created

### Schema:
- `server/prisma/schema.prisma` - Updated trainers, training_batches models, added trainer_batch_assignments

### Types:
- `server/src/types/domain/training/trainer.dto.ts` - Updated
- `server/src/types/domain/training/trainer.relations.ts` - Updated
- `server/src/types/domain/training/trainer-batch-assignment.dto.ts` - Created
- `server/src/types/domain/training/training.relations.ts` - Updated
- `server/src/types/domain/training/index.ts` - Updated

### Services:
- `server/src/services/training/trainingBatch/operations/training-batch-create.operation.ts` - Updated
- `server/src/services/training/trainerBatchAssignment/trainerBatchAssignment.service.ts` - Created

### Migrations:
- `server/prisma/migrations/update_trainers_and_add_assignments.sql` - Created
- `server/prisma/migrations/trainers_restructure.sql` - Created
- `server/prisma/migrations/handle_existing_trainer.sql` - Created

## Questions?

If you have any questions about the new system, please refer to:
- The service implementation: `server/src/services/training/trainerBatchAssignment/trainerBatchAssignment.service.ts`
- Type definitions: `server/src/types/domain/training/`
- Schema: `server/prisma/schema.prisma`
