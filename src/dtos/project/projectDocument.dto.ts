import { ProjectDocument } from '@/generated/prisma';

/**
 * DTO for project document response
 */
export type ProjectDocumentResponseDto = ProjectDocument;

/**
 * Request body for creating/uploading project document
 */
export interface CreateProjectDocumentRequest {
  documentType?: string;
  documentUrl?: string;
  fileName?: string;
  stageHistoryId?: string;
}

/**
 * Request body for updating project document
 */
export type UpdateProjectDocumentRequest = Partial<CreateProjectDocumentRequest>;

/**
 * Query parameters for listing project documents
 */
export interface ProjectDocumentListQuery {
  documentType?: string;
}
