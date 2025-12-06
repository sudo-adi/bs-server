import type {
  TrainingBatch,
  BatchEnrollment,
  Profile,
  ProfileSkill,
  SkillCategory,
  TrainerBatchAssignment,
  Trainer,
} from '@/types/prisma.types';
import type { WithRelations } from '@/types/shared';

export type TrainingBatchWithEnrollments = WithRelations<
  TrainingBatch,
  {
    batch_enrollments?: (BatchEnrollment & {
      profiles?: Profile | null;
    })[];
    trainer_batch_assignments?: (TrainerBatchAssignment & {
      trainers?: Trainer & {
        profiles?: Profile | null;
      };
    })[];
    skill_categories?: SkillCategory | null;
    enrolled_count?: number;
  }
>;

export type BatchEnrollmentWithDetails = WithRelations<
  BatchEnrollment,
  {
    profiles?:
      | (Profile & {
          profile_skills?: (ProfileSkill & {
            skill_categories?: SkillCategory | null;
          })[];
        })
      | null;
    training_batches?: TrainingBatch | null;
    primary_skill_category_id?: string;
    primary_skill_category_name?: string;
  }
>;
