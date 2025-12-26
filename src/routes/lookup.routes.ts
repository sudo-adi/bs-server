import {
  documentCategoryController,
  documentTypeController,
  languageController,
  profileCategoryController,
  qualificationTypeController,
  skillCategoryController,
} from '@/controllers/lookup/categories.controller';
import { Router } from 'express';

const router = Router();

/**
 * Lookup / Master Data Routes
 * Base path: /api/v1
 * Categories, Languages, Qualification Types, etc.
 */

// Skill Categories
router.get('/skill-categories/worker-type/:workerType', (req, res) =>
  skillCategoryController.getByWorkerType(req, res)
);
router.get('/skill-categories', (req, res) => skillCategoryController.getAll(req, res));
router.post('/skill-categories', (req, res) => skillCategoryController.create(req, res));
router.patch('/skill-categories/:id', (req, res) => skillCategoryController.update(req, res));
router.delete('/skill-categories/:id', (req, res) => skillCategoryController.delete(req, res));

// Profile Categories
router.get('/profile-categories', (req, res) => profileCategoryController.getAll(req, res));
router.post('/profile-categories', (req, res) => profileCategoryController.create(req, res));

// Document Categories
router.get('/document-categories', (req, res) => documentCategoryController.getAll(req, res));
router.post('/document-categories', (req, res) => documentCategoryController.create(req, res));

// Document Types
router.get('/document-types', (req, res) => documentTypeController.getAll(req, res));
router.post('/document-types', (req, res) => documentTypeController.create(req, res));

// Languages
router.get('/languages', (req, res) => languageController.getAll(req, res));
router.post('/languages', (req, res) => languageController.create(req, res));

// Qualification Types
router.get('/qualification-types', (req, res) => qualificationTypeController.getAll(req, res));
router.post('/qualification-types', (req, res) => qualificationTypeController.create(req, res));

export default router;
