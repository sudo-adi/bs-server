import * as documentController from '@/controllers/profiles/document.controller';
import { documentIdParamSchema, validate } from '@/middlewares';
import { Router } from 'express';

const router = Router({ mergeParams: true });

// Document routes - all under /:id/documents
router.get('/', documentController.getProfileDocuments);
router.post('/', documentController.addDocument);
router.patch(
  '/:documentId',
  validate(documentIdParamSchema, 'params'),
  documentController.updateDocument
);
router.post(
  '/:documentId/verify',
  validate(documentIdParamSchema, 'params'),
  documentController.verifyDocument
);
router.delete(
  '/:documentId',
  validate(documentIdParamSchema, 'params'),
  documentController.deleteDocument
);

export default router;
