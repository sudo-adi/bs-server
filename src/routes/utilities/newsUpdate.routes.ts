import * as newsUpdateController from '@/controllers/utilities/newsUpdate.controller';
import { validateRequest } from '@/middlewares/validation';
import { Router } from 'express';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createNewsUpdateSchema = Joi.object({
  project_name: Joi.string().required().min(3).max(500),
  sector: Joi.string().max(200).required(),
  company_authority: Joi.string().max(300).optional(),
  location: Joi.string().max(300).optional(),
  value_cr: Joi.number().required().min(0),
  status: Joi.string().max(100).optional(),
  revised_budget: Joi.number().optional(),
  revised_timeline: Joi.string().max(200).optional(),
  delay_reason: Joi.string().optional(),
  source_url: Joi.string().uri().required().max(1000),
  source_type: Joi.string().max(100).optional(),
  summary_remarks: Joi.string().required(),
});

const updateNewsUpdateSchema = Joi.object({
  project_name: Joi.string().min(3).max(500).optional(),
  sector: Joi.string().max(200).optional(),
  company_authority: Joi.string().max(300).optional(),
  location: Joi.string().max(300).optional(),
  value_cr: Joi.number().min(1000).optional(),
  status: Joi.string().max(100).optional(),
  revised_budget: Joi.number().optional(),
  revised_timeline: Joi.string().max(200).optional(),
  delay_reason: Joi.string().optional(),
  source_url: Joi.string().uri().max(1000).optional(),
  source_type: Joi.string().max(100).optional(),
  summary_remarks: Joi.string().optional(),
}).min(1);

const queryFiltersSchema = Joi.object({
  sector: Joi.string().optional(),
  status: Joi.string().optional(),
  min_value: Joi.number().optional(),
  max_value: Joi.number().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  search: Joi.string().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort_by: Joi.string().valid('created_at', 'value_cr', 'scraped_date', 'project_name').optional(),
  sort_order: Joi.string().valid('ASC', 'DESC').optional(),
});

const searchSchema = Joi.object({
  keyword: Joi.string().required().min(2),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

// Routes
router.get(
  '/',
  validateRequest({ query: queryFiltersSchema }),
  newsUpdateController.getAllNewsUpdates
);

router.get('/stats', newsUpdateController.getStats);

router.get(
  '/search',
  validateRequest({ query: searchSchema }),
  newsUpdateController.searchNewsUpdates
);

router.get('/scraper/status', newsUpdateController.getScraperStatus);

router.post('/scraper/trigger', newsUpdateController.triggerScraper);

router.get('/:id', newsUpdateController.getNewsUpdateById);

router.post(
  '/',
  validateRequest({ body: createNewsUpdateSchema }),
  newsUpdateController.createNewsUpdate
);

router.patch(
  '/:id',
  validateRequest({ body: updateNewsUpdateSchema }),
  newsUpdateController.updateNewsUpdate
);

router.delete('/:id', newsUpdateController.deleteNewsUpdate);

export default router;
