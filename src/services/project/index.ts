// Core CRUD
export { ProjectService, default as projectService } from './project.service';

// Status operations
export { ProjectStatusService, default as projectStatusService } from './projectStatus.service';

// Worker assignment & availability operations (consolidated)
export { ProjectWorkerService, default as projectWorkerService } from './projectWorker.service';

// Document operations
export {
  ProjectDocumentService,
  default as projectDocumentService,
} from './projectDocument.service';

// Project Requests
export { ProjectRequestService, default as projectRequestService } from './projectRequest.service';

// CSV Import/Export
export {
  ProjectCsvImportService,
  default as projectCsvImportService,
} from './projectCsvImport.service';

// Resource Requirements
export {
  ProjectResourceRequirementService,
  default as projectResourceRequirementService,
} from './projectResourceRequirement.service';

// Helpers (for internal use and shared utilities)
export * from './helpers';

// Operations (for direct use if needed)
export * from './operations';

// Queries (for direct use if needed)
export * from './queries';
