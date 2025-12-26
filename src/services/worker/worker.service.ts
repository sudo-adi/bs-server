import {
  WorkerDocumentDto,
  WorkerIdentityUpdateDto,
  WorkerProfileResponseDto,
  WorkerProfileUpdateDto,
  WorkerProjectsQueryDto,
  WorkerProjectsResponseDto,
  WorkerTrainingsQueryDto,
  WorkerTrainingsResponseDto,
} from '@/dtos/worker/worker.dto';

// Queries
import { WorkerProfileQuery } from './queries/worker-profile.query';
import { WorkerProjectsQuery } from './queries/worker-projects.query';
import { WorkerTrainingsQuery } from './queries/worker-trainings.query';

// Operations
import { WorkerDocumentUploadOperation } from './operations/worker-document-upload.operation';
import { WorkerIdentityUpdateOperation } from './operations/worker-identity-update.operation';
import { WorkerProfileUpdateOperation } from './operations/worker-profile-update.operation';

interface IdentityFiles {
  aadhaarDocument?: Express.Multer.File;
  panDocument?: Express.Multer.File;
  esicDocument?: Express.Multer.File;
  uanDocument?: Express.Multer.File;
  pfDocument?: Express.Multer.File;
  healthInsuranceDocument?: Express.Multer.File;
}

/**
 * Worker Service - Self-service APIs for blue-collar workers
 */
export class WorkerService {
  // ==========================================================================
  // PROFILE
  // ==========================================================================

  /**
   * Get worker's own profile
   */
  async getProfile(profileId: string): Promise<WorkerProfileResponseDto | null> {
    return WorkerProfileQuery.execute(profileId);
  }

  /**
   * Update worker's own profile (limited fields)
   */
  async updateProfile(profileId: string, data: WorkerProfileUpdateDto): Promise<void> {
    return WorkerProfileUpdateOperation.execute(profileId, data);
  }

  // ==========================================================================
  // IDENTITY
  // ==========================================================================

  /**
   * Update worker's identity info with document uploads
   */
  async updateIdentity(
    profileId: string,
    data: WorkerIdentityUpdateDto,
    files: IdentityFiles
  ): Promise<void> {
    return WorkerIdentityUpdateOperation.execute(profileId, data, files);
  }

  // ==========================================================================
  // DOCUMENTS
  // ==========================================================================

  /**
   * Get all documents for worker
   */
  async getDocuments(profileId: string): Promise<WorkerDocumentDto[]> {
    return WorkerDocumentUploadOperation.getAll(profileId);
  }

  /**
   * Upload a document
   */
  async uploadDocument(
    profileId: string,
    file: Express.Multer.File,
    documentTypeId?: string,
    description?: string
  ): Promise<WorkerDocumentDto> {
    return WorkerDocumentUploadOperation.execute(profileId, file, documentTypeId, description);
  }

  /**
   * Delete a document
   */
  async deleteDocument(profileId: string, documentId: string): Promise<void> {
    return WorkerDocumentUploadOperation.delete(profileId, documentId);
  }

  // ==========================================================================
  // PROJECTS
  // ==========================================================================

  /**
   * Get worker's assigned projects
   */
  async getProjects(
    profileId: string,
    query?: WorkerProjectsQueryDto
  ): Promise<WorkerProjectsResponseDto> {
    return WorkerProjectsQuery.execute(profileId, query);
  }

  // ==========================================================================
  // TRAININGS
  // ==========================================================================

  /**
   * Get worker's training enrollments
   */
  async getTrainings(
    profileId: string,
    query?: WorkerTrainingsQueryDto
  ): Promise<WorkerTrainingsResponseDto> {
    return WorkerTrainingsQuery.execute(profileId, query);
  }
}

export const workerService = new WorkerService();
export default workerService;
