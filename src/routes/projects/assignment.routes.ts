import { Router } from 'express';
import * as assignmentController from '@/controllers/projects/projectWorkerAssignment.controller';

const router = Router();

// ==================== Worker Assignment CRUD ====================

// Create single assignment
router.post('/', assignmentController.createAssignment);

// Bulk create assignments
router.post('/bulk', assignmentController.bulkCreateAssignments);

// Bulk remove assignments
router.post('/bulk-remove', assignmentController.bulkRemoveAssignments);

// Validate assignment
router.post('/validate', assignmentController.validateAssignment);

// Get all assignments with filters
router.get('/', assignmentController.getAllAssignments);

// Get assignment by ID
router.get('/:id', assignmentController.getAssignmentById);

// Remove assignment (soft delete)
router.delete('/:id', assignmentController.removeAssignment);

export default router;
