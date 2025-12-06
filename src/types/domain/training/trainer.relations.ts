import type { Trainer, TrainingBatch, Profile, TrainerBatchAssignment } from '@/types/prisma.types';

export type TrainerWithProfile = Trainer & {
  profiles?: Profile;
};

export type TrainerWithBatches = Trainer & {
  profiles?: Profile;
  trainer_batch_assignments?: (TrainerBatchAssignment & {
    training_batches?: TrainingBatch;
  })[];
  batch_count?: number;
};

export type TrainerBatchAssignmentWithDetails = TrainerBatchAssignment & {
  trainers?: Trainer & {
    profiles?: Profile;
  };
  training_batches?: TrainingBatch;
};

