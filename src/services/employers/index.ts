/**
 * Employer Services Index
 * Central export point for all employer-related services
 */

export { default as employerAuthorizedPersonService } from './authorizedPerson/authorizedPerson.service';
export { default as employerDashboardService } from './dashboard/employerDashboard.service';
export { default as employerService } from './employer/employer.service';
export { default as projectRequestService } from './projectRequest/projectRequest.service';

// Export service classes if needed for type definitions
export { EmployerAuthorizedPersonService } from './authorizedPerson/authorizedPerson.service';
export { EmployerDashboardService } from './dashboard/employerDashboard.service';
export { EmployerService } from './employer/employer.service';
export { ProjectRequestService } from './projectRequest/projectRequest.service';
