import prisma from '@/config/prisma';
import {
  CreateAuthorizedPersonRequest,
  CreateEmployerRequest,
  CreateEmployerWithProjectRequest,
  CreateProjectRequestRequest,
  EmployerListQuery,
  RejectEmployerRequest,
  UpdateAuthorizedPersonRequest,
  UpdateEmployerRequest,
  UpdateEmployerWithAuthorizedPersonsRequest,
  VerifyEmployerRequest,
} from '@/dtos/employer/employer.dto';
import { employerService } from '@/services/employer/employer.service';
import { deleteFile, uploadEmployerLogo } from '@/utils/fileStorage';
import { Request, Response } from 'express';

/**
 * Controller for handling employer HTTP requests
 */
export class EmployerController {
  /**
   * Get all employers with filters
   * GET /api/employers
   */
  async getAllEmployers(req: Request, res: Response): Promise<void> {
    try {
      const query: EmployerListQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        isActive:
          req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        isVerified:
          req.query.isVerified === 'true'
            ? true
            : req.query.isVerified === 'false'
              ? false
              : undefined,
        status: req.query.status as string,
      };

      const result = await employerService.getAllEmployers(query);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch employers',
      });
    }
  }

  /**
   * Get employer by ID
   * GET /api/employers/:id
   */
  async getEmployerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const employer = await employerService.getEmployerById(id);

      if (!employer) {
        res.status(404).json({
          success: false,
          message: 'Employer not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: employer,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch employer',
      });
    }
  }

  /**
   * Create a new employer
   * POST /api/employers
   */
  async createEmployer(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateEmployerRequest = req.body;

      if (!data.companyName) {
        res.status(400).json({
          success: false,
          message: 'Company name is required',
        });
        return;
      }

      const employer = await employerService.createEmployer(data);

      res.status(201).json({
        success: true,
        message: 'Employer created successfully',
        data: employer,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create employer',
      });
    }
  }

  /**
   * Create employer with nested project and authorized persons in a single call
   * POST /api/employers/with-project
   */
  async createEmployerWithProject(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateEmployerWithProjectRequest = req.body;

      // Validate required fields
      if (!data.companyName) {
        res.status(400).json({
          success: false,
          message: 'Company name is required',
        });
        return;
      }

      // Validate project name if project is provided
      if (data.project && !data.project.name) {
        res.status(400).json({
          success: false,
          message: 'Project name is required when project is provided',
        });
        return;
      }

      // Validate authorized persons names if provided
      if (data.authorizedPersons) {
        for (let i = 0; i < data.authorizedPersons.length; i++) {
          if (!data.authorizedPersons[i].name) {
            res.status(400).json({
              success: false,
              message: `Authorized person name is required for person at index ${i}`,
            });
            return;
          }
        }
      }

      const createdByProfileId = req.user?.id;

      const result = await employerService.createEmployerWithProject(data, createdByProfileId);

      res.status(201).json({
        success: true,
        message: 'Employer created successfully with nested entities',
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('already exists') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create employer with project',
      });
    }
  }

  /**
   * Update employer with authorized persons (unified API)
   * PUT /api/employers/:id/with-authorized-persons
   */
  async updateEmployerWithAuthorizedPersons(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateEmployerWithAuthorizedPersonsRequest = req.body;

      // Validate required fields
      if (data.authorizedPersons) {
        const validPersons = data.authorizedPersons.filter((p) => !p._delete && p.name?.trim());
        if (validPersons.length === 0 && data.authorizedPersons.some((p) => !p._delete)) {
          res.status(400).json({
            success: false,
            message: 'At least one authorized person with a name is required',
          });
          return;
        }
      }

      const result = await employerService.updateEmployerWithAuthorizedPersons(id, data);

      res.status(200).json({
        success: true,
        message: 'Employer updated successfully with authorized persons',
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Employer not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update employer with authorized persons',
      });
    }
  }

  /**
   * Update employer
   * PATCH /api/employers/:id
   */
  async updateEmployer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateEmployerRequest = req.body;

      const employer = await employerService.updateEmployer(id, data);

      res.status(200).json({
        success: true,
        message: 'Employer updated successfully',
        data: employer,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Employer not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update employer',
      });
    }
  }

  /**
   * Soft delete employer
   * DELETE /api/employers/:id
   */
  async deleteEmployer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedByProfileId = req.user?.id;

      await employerService.deleteEmployer(id, deletedByProfileId);

      res.status(200).json({
        success: true,
        message: 'Employer deleted successfully',
      });
    } catch (error: any) {
      const statusCode = error.message === 'Employer not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete employer',
      });
    }
  }

  /**
   * Verify employer
   * POST /api/employers/:id/verify
   */
  async verifyEmployer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: VerifyEmployerRequest = req.body;

      // Get user ID from auth middleware or from request body
      const verifiedByProfileId = req.user?.id || req.body.verifiedByProfileId;

      if (!verifiedByProfileId) {
        res.status(401).json({
          success: false,
          message: 'User ID required for verification (verifiedByProfileId)',
        });
        return;
      }

      const employer = await employerService.verifyEmployer(id, data, verifiedByProfileId);

      res.status(200).json({
        success: true,
        message: 'Employer verified successfully',
        data: employer,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Employer not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to verify employer',
      });
    }
  }

  /**
   * Reject employer
   * POST /api/employers/:id/reject
   */
  async rejectEmployer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: RejectEmployerRequest = req.body;

      // Get user ID from auth middleware or from request body
      const rejectedByProfileId = req.user?.id || req.body.rejectedByProfileId;

      if (!rejectedByProfileId) {
        res.status(401).json({
          success: false,
          message: 'User ID required for rejection (rejectedByProfileId)',
        });
        return;
      }

      const employer = await employerService.rejectEmployer(id, data.reason, rejectedByProfileId);

      res.status(200).json({
        success: true,
        message: 'Employer rejected successfully',
        data: employer,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Employer not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to reject employer',
      });
    }
  }

  // ==================== AUTHORIZED PERSONS ====================

  /**
   * Get authorized persons for an employer
   * GET /api/employers/:id/authorized-persons
   */
  async getAuthorizedPersons(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const persons = await employerService.getAuthorizedPersons(id);

      res.status(200).json({
        success: true,
        data: persons,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Employer not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch authorized persons',
      });
    }
  }

  /**
   * Create authorized person
   * POST /api/employers/:id/authorized-persons
   */
  async createAuthorizedPerson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: CreateAuthorizedPersonRequest = req.body;

      if (!data.name) {
        res.status(400).json({
          success: false,
          message: 'Name is required',
        });
        return;
      }

      const person = await employerService.createAuthorizedPerson(id, data);

      res.status(201).json({
        success: true,
        message: 'Authorized person created successfully',
        data: person,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Employer not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create authorized person',
      });
    }
  }

  /**
   * Update authorized person
   * PATCH /api/employers/:id/authorized-persons/:personId
   */
  async updateAuthorizedPerson(req: Request, res: Response): Promise<void> {
    try {
      const { id, personId } = req.params;
      const data: UpdateAuthorizedPersonRequest = req.body;

      const person = await employerService.updateAuthorizedPerson(id, personId, data);

      res.status(200).json({
        success: true,
        message: 'Authorized person updated successfully',
        data: person,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Authorized person not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update authorized person',
      });
    }
  }

  /**
   * Delete authorized person
   * DELETE /api/employers/:id/authorized-persons/:personId
   */
  async deleteAuthorizedPerson(req: Request, res: Response): Promise<void> {
    try {
      const { id, personId } = req.params;

      await employerService.deleteAuthorizedPerson(id, personId);

      res.status(200).json({
        success: true,
        message: 'Authorized person deleted successfully',
      });
    } catch (error: any) {
      const statusCode = error.message === 'Authorized person not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete authorized person',
      });
    }
  }

  // ==================== PROJECT REQUESTS ====================

  /**
   * Get project requests for an employer
   * GET /api/employers/:id/project-requests
   */
  async getProjectRequests(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const requests = await employerService.getProjectRequests(id);

      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Employer not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch project requests',
      });
    }
  }

  /**
   * Create project request
   * POST /api/employers/:id/project-requests
   */
  async createProjectRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: CreateProjectRequestRequest = req.body;

      if (!data.projectTitle) {
        res.status(400).json({
          success: false,
          message: 'Project title is required',
        });
        return;
      }

      const request = await employerService.createProjectRequest(id, data);

      res.status(201).json({
        success: true,
        message: 'Project request created successfully',
        data: request,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Employer not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create project request',
      });
    }
  }

  /**
   * Reject a project request
   * POST /api/employers/project-requests/:projectRequestId/reject
   */
  async rejectProjectRequest(req: Request, res: Response): Promise<void> {
    try {
      const { projectRequestId } = req.params;
      const { reason } = req.body;

      const request = await employerService.rejectProjectRequest(
        projectRequestId,
        reason,
        req.user?.id
      );

      res.status(200).json({
        success: true,
        message: 'Project request rejected successfully',
        data: request,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('already')
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to reject project request',
      });
    }
  }

  // ==================== IMPORT/EXPORT ====================

  /**
   * Download CSV template for importing employers
   * GET /api/employers/import/template
   */
  async downloadTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = employerService.generateTemplate();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employer_import_template.csv');
      res.status(200).send(template);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate template',
      });
    }
  }

  /**
   * Import employers from CSV file
   * POST /api/employers/import
   */
  async importEmployers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'CSV file is required',
        });
        return;
      }

      const csvData = req.file.buffer.toString('utf-8');
      const options = {
        skipDuplicates: req.body.skipDuplicates === 'true',
        updateExisting: req.body.updateExisting === 'true',
      };

      const result = await employerService.importEmployers(csvData, options);

      res.status(200).json({
        success: true,
        message: `Import completed: ${result.successCount} succeeded, ${result.failureCount} failed`,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to import employers',
      });
    }
  }

  /**
   * Export employers with project requests to CSV
   * GET /api/employers/export
   */
  async exportEmployers(req: Request, res: Response): Promise<void> {
    try {
      const csv = await employerService.exportEmployers();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employers_export.csv');
      res.status(200).send(csv);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export employers',
      });
    }
  }

  // ==================== LOGO UPLOAD ====================

  /**
   * Upload employer logo
   * POST /api/employers/:id/logo
   */
  async uploadLogo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if employer exists
      const employer = await prisma.employer.findUnique({
        where: { id, deletedAt: null },
      });

      if (!employer) {
        res.status(404).json({
          success: false,
          message: 'Employer not found',
        });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No logo file provided',
        });
        return;
      }

      // Delete old logo if exists
      if (employer.logoUrl) {
        try {
          await deleteFile(employer.logoUrl);
        } catch (error) {
          // Log but don't fail if old file deletion fails
          console.warn('Failed to delete old logo:', error);
        }
      }

      // Upload new logo
      const result = await uploadEmployerLogo(req.file.buffer, req.file.originalname, id);

      // Update employer with new logo URL
      await prisma.employer.update({
        where: { id },
        data: {
          logoUrl: result.url,
          updatedAt: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Logo uploaded successfully',
        data: {
          url: result.url,
          storageType: result.storageType,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload logo',
      });
    }
  }

  /**
   * Delete employer logo
   * DELETE /api/employers/:id/logo
   */
  async deleteLogo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if employer exists
      const employer = await prisma.employer.findUnique({
        where: { id, deletedAt: null },
      });

      if (!employer) {
        res.status(404).json({
          success: false,
          message: 'Employer not found',
        });
        return;
      }

      if (!employer.logoUrl) {
        res.status(400).json({
          success: false,
          message: 'Employer does not have a logo',
        });
        return;
      }

      // Delete the logo file
      await deleteFile(employer.logoUrl);

      // Update employer to remove logo URL
      await prisma.employer.update({
        where: { id },
        data: {
          logoUrl: null,
          updatedAt: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Logo deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete logo',
      });
    }
  }
}

export const employerController = new EmployerController();
export default employerController;
