// Re-export all Employer types and DTOs from Prisma types (single source of truth)
export type {
  Employer,
  EmployerAuthorizedPerson,
  EmployerWithProjects,
  EmployerWithDetails,
  ProjectRequest,
  ProjectRequestWithDetails,
  CreateEmployerDto,
  UpdateEmployerDto,
  RegisterEmployerDto,
  VerifyEmployerDto,
  EmployerLoginDto,
  CreateEmployerAuthorizedPersonDto,
  UpdateEmployerAuthorizedPersonDto,
  CreateProjectRequestDto,
  UpdateProjectRequestDto,
  ReviewProjectRequestDto,
} from '@/types/prisma.types';
