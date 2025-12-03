import type {
  Employer,
  Project,
  EmployerAuthorizedPerson,
  ProjectRequest,
  User,
} from '@/types/prisma.types';
import type { WithRelations } from '@/types/shared';

export type EmployerWithProjects = WithRelations<
  Employer,
  {
    projects?: Project[];
    employer_authorized_persons?: EmployerAuthorizedPerson[];
    project_requests?: ProjectRequest[];
  }
>;

export type EmployerWithDetails = WithRelations<
  Employer,
  {
    projects?: Project[];
    employer_authorized_persons?: EmployerAuthorizedPerson[];
    project_requests?: ProjectRequest[];
    users_employers_verified_by_user_idTousers?: User | null;
    users_employers_deleted_by_user_idTousers?: User | null;
  }
>;
