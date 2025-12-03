import type { ProjectRequest, Employer, Project, User } from '@/types/prisma.types';
import type { WithRelations } from '@/types/shared';

export type ProjectRequestWithDetails = WithRelations<
  ProjectRequest,
  {
    employers?: Employer | null;
    projects?: Project | null;
    users?: User | null;
  }
>;
