import * as salarySlipController from '@/controllers/profiles/salarySlip.controller';
import { Router } from 'express';

const router = Router();

// Salary slip CRUD
router.post('/:profileId/salary-slips', salarySlipController.createSalarySlip);
router.get('/:profileId/salary-slips', salarySlipController.getAllSalarySlips);
router.get('/:profileId/salary-slips/period/:year/:month', salarySlipController.getSalarySlipByPeriod);
router.get('/:profileId/salary-slips/:id', salarySlipController.getSalarySlipById);
router.patch('/:profileId/salary-slips/:id', salarySlipController.updateSalarySlip);
router.delete('/:profileId/salary-slips/:id', salarySlipController.deleteSalarySlip);

// Mark as paid
router.post('/:profileId/salary-slips/:id/mark-paid', salarySlipController.markSalaryPaid);

export default router;
