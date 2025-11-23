import { EmployerDashboardQuery } from './queries/employer-dashboard.query';

export class EmployerDashboardService {
  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Get employer dashboard overview with projects and statistics
   */
  async getDashboardOverview(employerId: string) {
    return EmployerDashboardQuery.getDashboardOverview(employerId);
  }

  /**
   * Get detailed project information including workers and timeline
   */
  async getProjectDetails(employerId: string, projectId: string) {
    return EmployerDashboardQuery.getProjectDetails(employerId, projectId);
  }

  /**
   * Get list of projects for employer with basic info
   */
  async getEmployerProjects(
    employerId: string,
    filters?: {
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    return EmployerDashboardQuery.getEmployerProjects(employerId, filters);
  }
}

export default new EmployerDashboardService();
