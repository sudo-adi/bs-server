import { PortalDashboardQuery } from './queries/portal-dashboard.query';
import { PortalEmploymentQuery } from './queries/portal-employment.query';
import { PortalProfileQuery } from './queries/portal-profile.query';
import { PortalProjectsQuery } from './queries/portal-projects.query';
import { PortalTrainingQuery } from './queries/portal-training.query';

export class CandidatePortalService {
  /**
   * Get candidate's matched projects
   * Returns all projects where the candidate has been matched/shared
   */
  async getMatchedProjects(profileId: string) {
    return PortalProjectsQuery.getMatchedProjects(profileId);
  }

  /**
   * Get candidate's training batch enrollments
   * Returns current, upcoming, and past trainings
   */
  async getTrainingEnrollments(profileId: string) {
    return PortalTrainingQuery.getTrainingEnrollments(profileId);
  }

  /**
   * Get candidate's employment/project assignment history
   * Returns current, past, and all project deployments
   */
  async getEmploymentHistory(profileId: string) {
    return PortalEmploymentQuery.getEmploymentHistory(profileId);
  }

  /**
   * Get candidate's full profile with all details
   * Includes personal info, addresses, qualifications, skills, documents, bank accounts
   */
  async getProfile(profileId: string) {
    return PortalProfileQuery.getProfile(profileId);
  }

  /**
   * Get candidate's dashboard summary
   * Returns counts and recent activities
   */
  async getDashboardSummary(profileId: string) {
    return PortalDashboardQuery.getDashboardSummary(profileId);
  }
}

export default new CandidatePortalService();
