import {
  documentCategoryService,
  documentTypeService,
  languageService,
  profileCategoryService,
  qualificationTypeService,
  skillCategoryService,
} from '@/services/lookup';
import { Request, Response } from 'express';

// ==================== SKILL CATEGORIES ====================
export class SkillCategoryController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        search: req.query.search as string,
        isActive:
          req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        categoryType: req.query.categoryType as string,
      };
      const result = await skillCategoryService.getAll(query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to fetch skill categories' });
    }
  }

  async getByWorkerType(req: Request, res: Response): Promise<void> {
    try {
      const { workerType } = req.params;

      // Validate worker type
      if (!['blue', 'white', 'trainer'].includes(workerType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid worker type. Must be: blue, white, or trainer',
        });
        return;
      }

      const categories = await skillCategoryService.getByWorkerType(workerType);
      res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch skill categories by worker type',
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body.name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      const category = await skillCategoryService.create(req.body);
      res
        .status(201)
        .json({ success: true, message: 'Skill category created successfully', data: category });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to create skill category' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const category = await skillCategoryService.update(req.params.id, req.body);
      res
        .status(200)
        .json({ success: true, message: 'Skill category updated successfully', data: category });
    } catch (error: any) {
      const status = error.message === 'Skill category not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to update skill category' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await skillCategoryService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Skill category deleted successfully' });
    } catch (error: any) {
      const status = error.message === 'Skill category not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to delete skill category' });
    }
  }
}

// ==================== PROFILE CATEGORIES ====================
export class ProfileCategoryController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        search: req.query.search as string,
      };
      const result = await profileCategoryService.getAll(query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to fetch profile categories' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body.name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      const category = await profileCategoryService.create(req.body);
      res
        .status(201)
        .json({ success: true, message: 'Profile category created successfully', data: category });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to create profile category' });
    }
  }

  async assignToProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { categoryId } = req.body;
      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }
      const assignment = await profileCategoryService.assignToProfile(id, categoryId, req.user?.id);
      res
        .status(201)
        .json({ success: true, message: 'Category assigned successfully', data: assignment });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('already')
          ? 400
          : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to assign category' });
    }
  }
}

// ==================== DOCUMENT CATEGORIES ====================
export class DocumentCategoryController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        search: req.query.search as string,
        isActive:
          req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };
      const result = await documentCategoryService.getAll(query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to fetch document categories' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body.name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      const category = await documentCategoryService.create(req.body);
      res
        .status(201)
        .json({ success: true, message: 'Document category created successfully', data: category });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to create document category' });
    }
  }
}

// ==================== LANGUAGES ====================
export class LanguageController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        search: req.query.search as string,
      };
      const result = await languageService.getAll(query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to fetch languages' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body.name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      const language = await languageService.create(req.body);
      res
        .status(201)
        .json({ success: true, message: 'Language created successfully', data: language });
    } catch (error: any) {
      const status = error.message === 'Language already exists' ? 400 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to create language' });
    }
  }
}

// ==================== DOCUMENT TYPES ====================
export class DocumentTypeController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
      };
      const result = await documentTypeService.getAll(query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to fetch document types' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body.name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      const documentType = await documentTypeService.create(req.body);
      res
        .status(201)
        .json({ success: true, message: 'Document type created successfully', data: documentType });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to create document type' });
    }
  }
}

// ==================== QUALIFICATION TYPES ====================
export class QualificationTypeController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        search: req.query.search as string,
      };
      const result = await qualificationTypeService.getAll(query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to fetch qualification types' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body.name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      const qualificationType = await qualificationTypeService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Qualification type created successfully',
        data: qualificationType,
      });
    } catch (error: any) {
      const status = error.message === 'Qualification type already exists' ? 400 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to create qualification type' });
    }
  }
}

export const skillCategoryController = new SkillCategoryController();
export const profileCategoryController = new ProfileCategoryController();
export const documentCategoryController = new DocumentCategoryController();
export const documentTypeController = new DocumentTypeController();
export const languageController = new LanguageController();
export const qualificationTypeController = new QualificationTypeController();
