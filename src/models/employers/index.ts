/**
 * Employer Models Index
 * Central export point for all employer-related types and DTOs
 */

export * from './employer.model';

// Re-export types for convenience
export type {
  Employer,
  EmployerAuthorizedPerson,
  EmployerWithProjects,
  EmployerWithDetails,
  ProjectRequest,
  ProjectRequestWithDetails,
} from '@/types/prisma.types';
