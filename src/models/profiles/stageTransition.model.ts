// Re-export StageTransition type from Prisma
export type { stage_transitions as StageTransition } from '@/generated/prisma';

// DTOs for Stage Transitions
export interface CreateStageTransitionDto {
  profile_id: string;
  from_stage?: string;
  to_stage: string;
  transitioned_by_user_id?: string;
  notes?: string;
}
