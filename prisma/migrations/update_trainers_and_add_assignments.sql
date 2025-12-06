-- Migration: Update trainers table and add trainer_batch_assignments
-- This migration restructures the trainers system to use profile_id instead of duplicating data

-- Step 1: Create the new trainer_batch_assignments table
CREATE TABLE IF NOT EXISTS "trainer_batch_assignments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "trainer_id" UUID NOT NULL,
    "training_batch_id" UUID NOT NULL,
    "shift" VARCHAR(20) NOT NULL,
    "assigned_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "assigned_by_user_id" UUID,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trainer_batch_assignments_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE,
    CONSTRAINT "trainer_batch_assignments_training_batch_id_fkey" FOREIGN KEY ("training_batch_id") REFERENCES "training_batches"("id") ON DELETE CASCADE,
    CONSTRAINT "trainer_batch_assignments_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION,
    CONSTRAINT "uq_trainer_batch_shift" UNIQUE ("trainer_id", "training_batch_id", "shift")
);

-- Create indexes for trainer_batch_assignments
CREATE INDEX IF NOT EXISTS "idx_trainer_batch_assignments_trainer" ON "trainer_batch_assignments"("trainer_id");
CREATE INDEX IF NOT EXISTS "idx_trainer_batch_assignments_batch" ON "trainer_batch_assignments"("training_batch_id");
CREATE INDEX IF NOT EXISTS "idx_trainer_batch_assignments_shift" ON "trainer_batch_assignments"("shift");

-- Step 2: Migrate existing training_batches trainer assignments to trainer_batch_assignments
-- Only migrate if there are existing trainers and batches with trainer_id
INSERT INTO "trainer_batch_assignments" (
    "trainer_id",
    "training_batch_id",
    "shift",
    "assigned_date",
    "created_at",
    "updated_at"
)
SELECT
    tb.trainer_id,
    tb.id,
    COALESCE(tb.shift, 'shift_1'),
    tb.created_at,
    tb.created_at,
    tb.updated_at
FROM "training_batches" tb
WHERE tb.trainer_id IS NOT NULL
ON CONFLICT ("trainer_id", "training_batch_id", "shift") DO NOTHING;

-- Step 3: Drop the old trainer_id and shift columns from training_batches
ALTER TABLE "training_batches" DROP COLUMN IF EXISTS "trainer_id";
ALTER TABLE "training_batches" DROP COLUMN IF EXISTS "shift";

-- Step 4: Add indexes to training_batches
CREATE INDEX IF NOT EXISTS "idx_training_batches_status" ON "training_batches"("status");
CREATE INDEX IF NOT EXISTS "idx_training_batches_start_date" ON "training_batches"("start_date");

-- Step 5: Backup old trainers data to a backup table before restructuring
CREATE TABLE IF NOT EXISTS "trainers_backup" AS
SELECT * FROM "trainers";

-- Step 6: Drop old unique constraints and columns from trainers
ALTER TABLE "trainers" DROP CONSTRAINT IF EXISTS "trainers_email_key";
ALTER TABLE "trainers" DROP CONSTRAINT IF EXISTS "trainers_employee_code_key";

-- Step 7: Add new columns to trainers table if they don't exist
DO $$
BEGIN
    -- Add profile_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trainers' AND column_name = 'profile_id') THEN
        ALTER TABLE "trainers" ADD COLUMN "profile_id" UUID;
    END IF;

    -- Add new trainer-specific columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trainers' AND column_name = 'specialization') THEN
        ALTER TABLE "trainers" ADD COLUMN "specialization" VARCHAR(500);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trainers' AND column_name = 'certifications') THEN
        ALTER TABLE "trainers" ADD COLUMN "certifications" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trainers' AND column_name = 'years_of_experience') THEN
        ALTER TABLE "trainers" ADD COLUMN "years_of_experience" INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'trainers' AND column_name = 'bio') THEN
        ALTER TABLE "trainers" ADD COLUMN "bio" TEXT;
    END IF;
END $$;

-- Step 8: For existing trainers, try to match them with profiles based on email or phone
-- This is a best-effort migration - manual verification may be needed
UPDATE "trainers" t
SET "profile_id" = p.id
FROM "profiles" p
WHERE t.profile_id IS NULL
  AND (t.email IS NOT NULL AND p.email = t.email);

-- Step 9: Drop old columns that are now redundant (stored in profiles)
ALTER TABLE "trainers" DROP COLUMN IF EXISTS "name";
ALTER TABLE "trainers" DROP COLUMN IF EXISTS "email";
ALTER TABLE "trainers" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "trainers" DROP COLUMN IF EXISTS "password_hash";
ALTER TABLE "trainers" DROP COLUMN IF EXISTS "profile_photo_url";
ALTER TABLE "trainers" DROP COLUMN IF EXISTS "employee_code";

-- Step 10: Make profile_id NOT NULL and add constraints
-- Note: This will fail if there are trainers without profile_id - those need manual intervention
ALTER TABLE "trainers" ALTER COLUMN "profile_id" SET NOT NULL;

-- Add unique constraint on profile_id
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_profile_id_key" UNIQUE ("profile_id");

-- Add foreign key constraint
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

-- Step 11: Create indexes for trainers
CREATE INDEX IF NOT EXISTS "idx_trainers_profile_id" ON "trainers"("profile_id");
CREATE INDEX IF NOT EXISTS "idx_trainers_is_active" ON "trainers"("is_active");

-- Step 12: Add helpful comment
COMMENT ON TABLE "trainers" IS 'Stores trainer-specific metadata. Personal info comes from linked profiles table.';
COMMENT ON TABLE "trainer_batch_assignments" IS 'Maps trainers to training batches with shift information. Supports multiple trainers per batch.';

-- Step 13: Print summary
DO $$
DECLARE
    trainer_count INTEGER;
    assignment_count INTEGER;
    unlinked_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trainer_count FROM "trainers";
    SELECT COUNT(*) INTO assignment_count FROM "trainer_batch_assignments";
    SELECT COUNT(*) INTO unlinked_count FROM "trainers" WHERE profile_id IS NULL;

    RAISE NOTICE 'Migration completed:';
    RAISE NOTICE '- Total trainers: %', trainer_count;
    RAISE NOTICE '- Total batch assignments: %', assignment_count;
    RAISE NOTICE '- Trainers without profile link: %', unlinked_count;

    IF unlinked_count > 0 THEN
        RAISE WARNING 'There are % trainers without a profile link. These need manual intervention.', unlinked_count;
    END IF;
END $$;
