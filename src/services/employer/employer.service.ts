/**
 * Employer Service - Thin Facade
 *
 * This class provides a unified API for all employer-related operations.
 * All functionality is delegated to specialized modules for better maintainability.
 *
 * Module Structure:
 * - helpers/       - Shared utility functions
 * - operations/    - CRUD and business operations
 * - queries/       - Read-only data retrieval
 * - authorized-person/  - Authorized person management
 * - project-request/    - Project request management
 * - import-export/      - CSV import/export
 * - dashboard/          - Portal dashboard queries
 */

import {
  CreateAuthorizedPersonRequest,
  CreateEmployerRequest,
  CreateEmployerWithProjectRequest,
  CreateEmployerWithProjectResponse,
  CreateProjectRequestRequest,
  EmployerDetailDto,
  EmployerListDto,
  EmployerListQuery,
  EmployerResponseDto,
  ImportEmployerOptions,
  ImportEmployersResponse,
  RegisterEmployerRequest,
  ReviewProjectRequestRequest,
  UpdateAuthorizedPersonRequest,
  UpdateEmployerRequest,
  UpdateEmployerWithAuthorizedPersonsRequest,
  UpdateEmployerWithAuthorizedPersonsResponse,
  UpdateProjectRequestRequest,
  VerifyEmployerRequest,
} from '@/dtos/employer/employer.dto';

// Import from modular structure
import * as authorizedPerson from './authorized-person';
import * as importExport from './import-export';
import * as operations from './operations';
import * as projectRequest from './project-request';
import * as queries from './queries';

// Auth is handled by unified auth service
import { authService } from '@/services/auth';

export class EmployerService {
  // ==================== QUERIES ====================

  async getAllEmployers(query: EmployerListQuery): Promise<{
    data: EmployerListDto[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return queries.getAllEmployers(query);
  }

  async getEmployerById(id: string): Promise<EmployerDetailDto | null> {
    return queries.getEmployerById(id);
  }

  async getEmployerByEmail(email: string): Promise<any | null> {
    return queries.getEmployerByEmail(email);
  }

  // ==================== OPERATIONS ====================

  async createEmployer(data: CreateEmployerRequest): Promise<EmployerResponseDto> {
    return operations.createEmployer(data);
  }

  async createEmployerWithProject(
    data: CreateEmployerWithProjectRequest,
    createdByProfileId?: string
  ): Promise<CreateEmployerWithProjectResponse> {
    return operations.createEmployerWithProject(data, createdByProfileId);
  }

  async updateEmployer(id: string, data: UpdateEmployerRequest): Promise<EmployerDetailDto> {
    return operations.updateEmployer(id, data);
  }

  async updateEmployerWithAuthorizedPersons(
    id: string,
    data: UpdateEmployerWithAuthorizedPersonsRequest
  ): Promise<UpdateEmployerWithAuthorizedPersonsResponse> {
    return operations.updateEmployerWithAuthorizedPersons(id, data);
  }

  async deleteEmployer(id: string, deletedByProfileId?: string): Promise<void> {
    return operations.deleteEmployer(id, deletedByProfileId);
  }

  async hardDeleteEmployer(
    id: string,
    deletedByProfileId?: string
  ): Promise<{ projectsDeleted: number }> {
    return operations.hardDeleteEmployer(id, deletedByProfileId);
  }

  async verifyEmployer(
    id: string,
    request: VerifyEmployerRequest,
    verifiedByProfileId: string
  ): Promise<EmployerResponseDto> {
    return operations.verifyEmployer(id, request, verifiedByProfileId);
  }

  async rejectEmployer(
    id: string,
    reason: string | undefined,
    rejectedByProfileId: string
  ): Promise<EmployerResponseDto> {
    return operations.rejectEmployer(id, reason, rejectedByProfileId);
  }

  // ==================== BULK OPERATIONS ====================

  async bulkVerify(
    employerIds: string[],
    verifiedByProfileId: string
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    return operations.bulkVerify(employerIds, verifiedByProfileId);
  }

  async bulkSoftDelete(
    employerIds: string[]
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    return operations.bulkSoftDelete(employerIds);
  }

  async bulkHardDelete(
    employerIds: string[],
    deletedByProfileId?: string
  ): Promise<{ success: number; failed: number; errors: any[]; projectsDeleted: number }> {
    return operations.bulkHardDelete(employerIds, deletedByProfileId);
  }

  // ==================== AUTHENTICATION ====================
  // Note: Auth is now handled by the unified auth service at @/services/auth
  // Use authService.login({ userType: 'employer', ... }) for login
  // Use authService.signupEmployer(...) for registration

  async loginEmployer(data: {
    email: string;
    password: string;
  }): Promise<{ employer: EmployerResponseDto; token: string }> {
    const result = await authService.login({
      email: data.email,
      password: data.password,
      userType: 'employer',
    });
    return { employer: result.user, token: result.token };
  }

  async registerEmployer(
    data: RegisterEmployerRequest
  ): Promise<{ employer: EmployerResponseDto; token: string; projectRequest: any }> {
    const result = await authService.signupEmployer(data);
    return { employer: result.user, token: result.token, projectRequest: result.projectRequest };
  }

  // ==================== AUTHORIZED PERSONS ====================

  async getAuthorizedPersons(employerId: string): Promise<any[]> {
    return authorizedPerson.getAuthorizedPersons(employerId);
  }

  async getAuthorizedPersonById(id: string): Promise<any> {
    return authorizedPerson.getAuthorizedPersonById(id);
  }

  async createAuthorizedPerson(
    employerId: string,
    data: CreateAuthorizedPersonRequest
  ): Promise<any> {
    return authorizedPerson.createAuthorizedPerson(employerId, data);
  }

  async updateAuthorizedPerson(
    employerId: string,
    personId: string,
    data: UpdateAuthorizedPersonRequest
  ): Promise<any> {
    return authorizedPerson.updateAuthorizedPerson(employerId, personId, data);
  }

  async deleteAuthorizedPerson(employerId: string, personId: string): Promise<void> {
    return authorizedPerson.deleteAuthorizedPerson(employerId, personId);
  }

  // ==================== PROJECT REQUESTS ====================

  async getProjectRequests(employerId: string): Promise<any[]> {
    return projectRequest.getProjectRequests(employerId);
  }

  async createProjectRequest(employerId: string, data: CreateProjectRequestRequest): Promise<any> {
    return projectRequest.createProjectRequest(employerId, data);
  }

  async rejectProjectRequest(
    projectRequestId: string,
    reason?: string,
    reviewedByProfileId?: string
  ): Promise<any> {
    return projectRequest.rejectProjectRequest(projectRequestId, reason, reviewedByProfileId);
  }

  async getAllProjectRequests(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ projectRequests: any[]; total: number }> {
    return projectRequest.getAllProjectRequests(filters);
  }

  async getProjectRequestById(id: string): Promise<any> {
    return projectRequest.getProjectRequestById(id);
  }

  async updateProjectRequest(id: string, data: UpdateProjectRequestRequest): Promise<any> {
    return projectRequest.updateProjectRequest(id, data);
  }

  async reviewProjectRequest(id: string, data: ReviewProjectRequestRequest): Promise<any> {
    return projectRequest.reviewProjectRequest(id, data);
  }

  async deleteProjectRequest(id: string): Promise<void> {
    return projectRequest.deleteProjectRequest(id);
  }

  // ==================== IMPORT/EXPORT ====================

  generateTemplate(): string {
    return importExport.generateTemplate();
  }

  async importEmployers(
    csvData: string,
    options?: ImportEmployerOptions
  ): Promise<ImportEmployersResponse> {
    return importExport.importEmployers(csvData, options);
  }

  async exportEmployers(): Promise<string> {
    return importExport.exportEmployers();
  }

  // ==================== DASHBOARD ====================

  // async getDashboardOverview(employerId: string): Promise<any> {
  //   return dashboard.getDashboardOverview(employerId);
  // }

  // async getProjectDetails(employerId: string, projectId: string): Promise<any> {
  //   return dashboard.getProjectDetails(employerId, projectId);
  // }

  // async getEmployerProjects(
  //   employerId: string,
  //   filters?: {
  //     status?: string;
  //     search?: string;
  //     limit?: number;
  //     offset?: number;
  //   }
  // ): Promise<{ projects: any[]; total: number }> {
  //   return dashboard.getEmployerProjects(employerId, filters);
  // }
}

export const employerService = new EmployerService();
export default employerService;
