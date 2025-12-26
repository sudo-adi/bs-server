// Project helpers
export {
  generateProjectCode,
  getProjectOrThrow,
  logProjectStageChange,
  updateProfileStageWithHistory,
  getWorkerStageAfterProjectEnd,
  normalizeProjectDateFields,
  isValidUUID,
  type ProjectDateFieldsInput,
} from './project.helpers';

// Worker helpers
export {
  buildEligibleWorkerWhereClause,
  getAssignedProfileIds,
  getHelperRequirement,
  getAvailableWorkersForAutoMatch,
  WORKER_PROFILE_SELECT,
  WORKER_PROFILE_WITH_SKILLS_SELECT,
  PROJECT_SELECT,
} from './worker.helpers';

// Financial helpers
export {
  normalizeFinancialData,
  hasFinancialData,
  upsertProjectFinancials,
  createProjectFinancials,
  type FinancialDataInput,
} from './financial.helpers';
