import type {
  Project,
  Employer,
  ProjectResourceRequirement,
  ProjectWorkerAssignment,
  ProjectRequest,
  ProjectFinancials,
  ProjectRequestRequirement,
  Profile,
  SkillCategory,
  User,
} from '@/types/prisma.types';
import type { WithRelations } from '@/types/shared';
import { ProjectStatus } from '@/types/enums';

export type ProjectWithDetails = WithRelations<
  Project,
  {
    employers?: Employer | null;
    project_resource_requirements?: ProjectResourceRequirement[];
    project_worker_assignments?: ProjectWorkerAssignment[];
    project_requests?: ProjectRequest[];
    project_financials?: ProjectFinancials | null;
    project_request_requirements?: ProjectRequestRequirement[];
  }
>;

export type ProjectWorkerAssignmentWithDetails = WithRelations<
  ProjectWorkerAssignment,
  {
    profiles?: Profile;
    projects?: Project;
    skill_categories?: SkillCategory;
    users?: User | null;
  }
>;

export interface ProjectWithStatusMetadata extends Project {
  is_delayed?: boolean;
  days_remaining?: number;
  workers_assigned_count?: number;
  required_workers_count?: number;
  can_transition_to?: ProjectStatus[];
}
