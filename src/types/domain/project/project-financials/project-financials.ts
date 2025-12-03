import type { ProjectFinancials } from '@/types/prisma.types';
import type { UpdateDTO } from '@/types/shared';

// CreateProjectFinancialsDto: only project_id is required, all financial fields are optional
export type CreateProjectFinancialsDto = Pick<ProjectFinancials, 'project_id'> &
  Partial<Omit<ProjectFinancials, 'id' | 'project_id' | 'created_at' | 'updated_at'>>;

export type UpdateProjectFinancialsDto = UpdateDTO<
  ProjectFinancials,
  'project_id' // Cannot change project after creation
>;
