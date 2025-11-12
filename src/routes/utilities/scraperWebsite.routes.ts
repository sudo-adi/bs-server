import * as scraperWebsiteController from '@/controllers/utilities/scraperWebsite.controller';
import { validateRequest } from '@/middlewares/validation';
import { Router } from 'express';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createWebsiteSchema = Joi.object({
  url: Joi.string().uri().required().max(1000),
  name: Joi.string().max(300).optional().allow(null),
  type: Joi.string().valid('government', 'company', 'news', 'other').optional().allow(null),
  is_active: Joi.boolean().optional(),
});

const updateWebsiteSchema = Joi.object({
  url: Joi.string().uri().max(1000).optional(),
  name: Joi.string().max(300).optional().allow(null),
  type: Joi.string().valid('government', 'company', 'news', 'other').optional().allow(null),
  is_active: Joi.boolean().optional(),
}).min(1);

const seedWebsitesSchema = Joi.object({
  websites: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required().max(1000),
        name: Joi.string().max(300).optional().allow(null),
        type: Joi.string().valid('government', 'company', 'news', 'other').optional().allow(null),
        is_active: Joi.boolean().optional(),
      })
    )
    .min(1)
    .required(),
});

// Routes
router.get('/', scraperWebsiteController.getAllWebsites);

router.get('/stats', scraperWebsiteController.getStats);

router.get('/type/:type', scraperWebsiteController.getWebsitesByType);

router.get('/:id', scraperWebsiteController.getWebsiteById);

router.post(
  '/',
  validateRequest({ body: createWebsiteSchema }),
  scraperWebsiteController.createWebsite
);

router.post(
  '/seed',
  validateRequest({ body: seedWebsitesSchema }),
  scraperWebsiteController.seedWebsites
);

router.patch(
  '/:id',
  validateRequest({ body: updateWebsiteSchema }),
  scraperWebsiteController.updateWebsite
);

router.delete('/:id', scraperWebsiteController.deleteWebsite);

export default router;
