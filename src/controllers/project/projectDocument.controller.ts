import {
  CreateProjectDocumentRequest,
  ProjectDocumentListQuery,
  UpdateProjectDocumentRequest,
} from '@/dtos/project';
import { projectDocumentService } from '@/services/project';
import { Request, Response } from 'express';

/**
 * Controller for handling project document HTTP requests
 */
export class ProjectDocumentController {
  /**
   * Get all documents for a project
   * GET /api/projects/:id/documents
   */
  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { id: projectId } = req.params;

      const query: ProjectDocumentListQuery = {
        documentType: req.query.documentType as string,
      };

      const documents = await projectDocumentService.getDocumentsByProjectId(projectId, query);

      res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch documents',
      });
    }
  }

  /**
   * Get a single document by ID
   * GET /api/projects/:id/documents/:docId
   */
  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { id: projectId, docId } = req.params;

      const document = await projectDocumentService.getDocumentById(projectId, docId);

      if (!document) {
        res.status(404).json({
          success: false,
          message: 'Document not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch document',
      });
    }
  }

  /**
   * Create a new document for a project
   * POST /api/projects/:id/documents
   */
  async createDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const data: CreateProjectDocumentRequest = req.body;

      const uploadedByProfileId = req.user?.id;

      const document = await projectDocumentService.createDocument(
        projectId,
        data,
        uploadedByProfileId
      );

      res.status(201).json({
        success: true,
        message: 'Document created successfully',
        data: document,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create document',
      });
    }
  }

  /**
   * Update a document
   * PATCH /api/projects/:id/documents/:docId
   */
  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id: projectId, docId } = req.params;
      const data: UpdateProjectDocumentRequest = req.body;

      const document = await projectDocumentService.updateDocument(projectId, docId, data);

      res.status(200).json({
        success: true,
        message: 'Document updated successfully',
        data: document,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Document not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update document',
      });
    }
  }

  /**
   * Delete a document (soft delete)
   * DELETE /api/projects/:id/documents/:docId
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id: projectId, docId } = req.params;

      await projectDocumentService.deleteDocument(projectId, docId);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error: any) {
      const statusCode = error.message === 'Document not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete document',
      });
    }
  }
}

export default new ProjectDocumentController();
