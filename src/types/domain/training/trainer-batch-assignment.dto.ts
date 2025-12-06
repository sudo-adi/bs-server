import type { TrainerBatchAssignment } from '@/types/prisma.types';

// Create DTO for assigning a trainer to a batch
export type CreateTrainerBatchAssignmentDto = Pick<
  TrainerBatchAssignment,
  'trainer_id' | 'training_batch_id' | 'shift'
> &
  Partial<
    Omit<
      TrainerBatchAssignment,
      | 'id'
      | 'trainer_id'
      | 'training_batch_id'
      | 'shift'
      | 'created_at'
      | 'updated_at'
      | 'trainers'
      | 'training_batches'
      | 'users'
    >
  >;

export type UpdateTrainerBatchAssignmentDto = Partial<
  Omit<TrainerBatchAssignment, 'id' | 'created_at' | 'trainers' | 'training_batches' | 'users'>
>;

// DTO for assigning trainer using profile_id (more convenient for API)
export type AssignTrainerByProfileDto = {
  profile_id: string; // Will be resolved to trainer_id
  training_batch_id: string;
  shift: string;
  assigned_by_user_id?: string;
};

// DTO for bulk assignment
export type BulkAssignTrainersDto = {
  training_batch_id: string;
  assignments: Array<{
    profile_id: string;
    shift: string;
  }>;
  assigned_by_user_id?: string;
};
