import { Router } from 'express';
import * as employerAuthorizedPersonController from '@/controllers/employers/employerAuthorizedPerson.controller';

const router = Router();

// Routes for employer authorized persons
router.get('/employer/:employerId', employerAuthorizedPersonController.getAllByEmployerId);
router.get('/:id', employerAuthorizedPersonController.getById);
router.post('/', employerAuthorizedPersonController.create);
router.patch('/:id', employerAuthorizedPersonController.update);
router.delete('/:id', employerAuthorizedPersonController.deleteAuthorizedPerson);

export default router;
