import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  CreateProjectDocumentRequest,
  ProjectDocumentListQuery,
  ProjectDocumentResponseDto,
  UpdateProjectDocumentRequest,
} from '@/dtos/project';

export class ProjectDocumentService {
  // ==================== HELPER METHODS ====================

  /**
   * Verify project exists or throw
   */
  private async verifyProjectExists(projectId: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) {
      throw new Error('Project not found');
    }
  }

  /**
   * Get document by ID or throw if not found
   */
  private async getDocumentOrThrow(projectId: string, documentId: string): Promise<any> {
    const document = await prisma.projectDocument.findFirst({
      where: { id: documentId, projectId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Get all documents for a project
   */
  async getDocumentsByProjectId(
    projectId: string,
    query?: ProjectDocumentListQuery
  ): Promise<ProjectDocumentResponseDto[]> {
    try {
      await this.verifyProjectExists(projectId);

      const where: any = { projectId };

      if (query?.documentType) {
        where.documentType = query.documentType;
      }

      const documents = await prisma.projectDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedByProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return documents;
    } catch (error: any) {
      logger.error('Error fetching project documents', { error, projectId });
      throw new Error(error.message || 'Failed to fetch documents');
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocumentById(
    projectId: string,
    documentId: string
  ): Promise<ProjectDocumentResponseDto | null> {
    try {
      const document = await prisma.projectDocument.findFirst({
        where: { id: documentId, projectId },
        include: {
          uploadedByProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          stageHistory: true,
        },
      });

      return document;
    } catch (error) {
      logger.error('Error fetching document', { error, projectId, documentId });
      throw new Error('Failed to fetch document');
    }
  }

  /**
   * Create a new document for a project
   */
  async createDocument(
    projectId: string,
    data: CreateProjectDocumentRequest,
    uploadedByProfileId?: string
  ): Promise<ProjectDocumentResponseDto> {
    try {
      await this.verifyProjectExists(projectId);

      const document = await prisma.projectDocument.create({
        data: {
          projectId,
          documentType: data.documentType,
          documentUrl: data.documentUrl,
          fileName: data.fileName,
          uploadedByProfileId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info('Project document created', { projectId, documentId: document.id });
      return document;
    } catch (error: any) {
      logger.error('Error creating project document', { error, projectId });
      throw new Error(error.message || 'Failed to create document');
    }
  }

  /**
   * Update a document
   */
  async updateDocument(
    projectId: string,
    documentId: string,
    data: UpdateProjectDocumentRequest
  ): Promise<ProjectDocumentResponseDto> {
    try {
      await this.getDocumentOrThrow(projectId, documentId);

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.documentType !== undefined) updateData.documentType = data.documentType;
      if (data.documentUrl !== undefined) updateData.documentUrl = data.documentUrl;
      if (data.fileName !== undefined) updateData.fileName = data.fileName;

      const document = await prisma.projectDocument.update({
        where: { id: documentId },
        data: updateData,
      });

      logger.info('Project document updated', { projectId, documentId });
      return document;
    } catch (error: any) {
      logger.error('Error updating project document', { error, projectId, documentId });
      throw new Error(error.message || 'Failed to update document');
    }
  }

  /**
   * Delete a document (hard delete since isActive doesn't exist)
   */
  async deleteDocument(projectId: string, documentId: string): Promise<void> {
    try {
      await this.getDocumentOrThrow(projectId, documentId);

      await prisma.projectDocument.delete({
        where: { id: documentId },
      });

      logger.info('Project document deleted', { projectId, documentId });
    } catch (error: any) {
      logger.error('Error deleting project document', { error, projectId, documentId });
      throw new Error(error.message || 'Failed to delete document');
    }
  }
}

export default new ProjectDocumentService();
