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
    CONSTRAINT "uq_trainer_batch_shift" UNIQUE ("trainer_id", "training_batch_id", "shift")
);

-- Step 2: Migrate existing training_batches trainer assignments to trainer_batch_assignments
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

-- Step 5: Add profile_id column to trainers (nullable first)
ALTER TABLE "trainers" ADD COLUMN IF NOT EXISTS "profile_id" UUID;

-- Step 6: Add new trainer-specific columns
ALTER TABLE "trainers" ADD COLUMN IF NOT EXISTS "specialization" VARCHAR(500);
ALTER TABLE "trainers" ADD COLUMN IF NOT EXISTS "certifications" TEXT;
ALTER TABLE "trainers" ADD COLUMN IF NOT EXISTS "years_of_experience" INTEGER;
ALTER TABLE "trainers" ADD COLUMN IF NOT EXISTS "bio" TEXT;

-- Step 7: For existing trainers, create profile records
-- This creates a profile for each trainer based on their existing data
DO $$
DECLARE
    trainer_record RECORD;
    new_profile_id UUID;
    trainer_count INTEGER := 0;
BEGIN
    FOR trainer_record IN
        SELECT * FROM "trainers" WHERE profile_id IS NULL
    LOOP
        -- Create a profile for this trainer
        INSERT INTO "profiles" (
            "candidate_code",
            "phone",
            "email",
            "first_name",
            "last_name",
            "password_hash",
            "profile_photo_url",
            "is_active",
            "current_stage",
            "created_at",
            "updated_at"
        )
        VALUES (
            COALESCE(trainer_record.employee_code, 'TR-' || SUBSTRING(trainer_record.id::TEXT, 1, 8)),
            trainer_record.phone,
            trainer_record.email,
            SPLIT_PART(trainer_record.name, ' ', 1), -- First word as first_name
            NULLIF(SUBSTRING(trainer_record.name FROM POSITION(' ' IN trainer_record.name) + 1), ''), -- Rest as last_name
            trainer_record.password_hash,
            trainer_record.profile_photo_url,
            trainer_record.is_active,
            'trainer', -- Set stage as trainer
            trainer_record.created_at,
            trainer_record.updated_at
        )
        RETURNING id INTO new_profile_id;

        -- Update the trainer with the new profile_id
        UPDATE "trainers"
        SET "profile_id" = new_profile_id
        WHERE id = trainer_record.id;

        trainer_count := trainer_count + 1;
    END LOOP;

    RAISE NOTICE 'Created % profile records for existing trainers', trainer_count;
END $$;

-- Step 8: Drop old columns from trainers that are now in profiles
ALTER TABLE "trainers" DROP COLUMN IF EXISTS "name";
ALTER TABLE "trainers" DROP COLUMN IF EXISTS "email";
ALTER TABLE "trainers" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "trainers" DROP COLUMN IF EXISTS "password_hash";
ALTER TABLE "trainers" DROP COLUMN IF EXISTS "profile_photo_url";
ALTER TABLE "trainers" DROP COLUMN IF EXISTS "employee_code";

-- Step 9: Make profile_id NOT NULL and add constraints
ALTER TABLE "trainers" ALTER COLUMN "profile_id" SET NOT NULL;
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_profile_id_key" UNIQUE ("profile_id");
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

-- Step 10: Create indexes for trainers
CREATE INDEX IF NOT EXISTS "idx_trainers_profile_id" ON "trainers"("profile_id");
CREATE INDEX IF NOT EXISTS "idx_trainers_is_active" ON "trainers"("is_active");

-- Step 11: Add foreign keys for trainer_batch_assignments
ALTER TABLE "trainer_batch_assignments"
    ADD CONSTRAINT "trainer_batch_assignments_trainer_id_fkey"
    FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE;

ALTER TABLE "trainer_batch_assignments"
    ADD CONSTRAINT "trainer_batch_assignments_training_batch_id_fkey"
    FOREIGN KEY ("training_batch_id") REFERENCES "training_batches"("id") ON DELETE CASCADE;

ALTER TABLE "trainer_batch_assignments"
    ADD CONSTRAINT "trainer_batch_assignments_assigned_by_user_id_fkey"
    FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION;

-- Step 12: Create indexes for trainer_batch_assignments
CREATE INDEX IF NOT EXISTS "idx_trainer_batch_assignments_trainer" ON "trainer_batch_assignments"("trainer_id");
CREATE INDEX IF NOT EXISTS "idx_trainer_batch_assignments_batch" ON "trainer_batch_assignments"("training_batch_id");
CREATE INDEX IF NOT EXISTS "idx_trainer_batch_assignments_shift" ON "trainer_batch_assignments"("shift");

-- Step 13: Add helpful comments
COMMENT ON TABLE "trainers" IS 'Stores trainer-specific metadata. Personal info comes from linked profiles table via profile_id.';
COMMENT ON TABLE "trainer_batch_assignments" IS 'Maps trainers to training batches with shift information. Supports multiple trainers per batch and multiple batches per trainer.';
COMMENT ON COLUMN "trainers"."profile_id" IS 'Links to the profile table for personal information. Trainers are profiles with additional trainer-specific metadata.';
