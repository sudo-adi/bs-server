import type {
  Address,
  BankAccount,
  BatchEnrollment,
  Document,
  Profile,
  ProfileBlacklist,
  ProfileSkill,
  ProjectWorkerAssignment,
  Qualification,
  StageTransition,
} from '@/types/prisma.types';
import type { WithRelations } from '@/types/shared';

export type ProfileWithDetails = WithRelations<
  Profile,
  {
    addresses?: Address[];
    bank_accounts?: BankAccount[];
    documents?: Document[];
    qualifications?: Qualification[];
    profile_skills?: ProfileSkill[];
    batch_enrollments?: BatchEnrollment[];
    project_worker_assignments?: ProjectWorkerAssignment[];
    stage_transitions?: StageTransition[];
    profile_blacklist?: ProfileBlacklist[];
  }
>;
