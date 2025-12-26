/**
 * Employer Service Module
 *
 * Exports the main EmployerService class and all sub-modules for direct access.
 * Note: Authentication is handled by the unified @/services/auth module.
 */

// Main service (facade)
export { default, EmployerService, employerService } from './employer.service';

// Sub-modules for direct imports
export * as employerAuthorizedPerson from './authorized-person';
export * as employerDashboard from './dashboard';
export * as employerHelpers from './helpers';
export * as employerImportExport from './import-export';
export * as employerOperations from './operations';
export * as employerProjectRequest from './project-request';
export * as employerQueries from './queries';
