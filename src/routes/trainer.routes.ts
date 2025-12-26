import { trainerController } from '@/controllers/training';
import { Router } from 'express';

const router = Router();

/**
 * Trainer Routes
 * Base path: /api/v1/trainers
 *
 * Trainers are profiles with workerType: 'trainer'
 * These endpoints provide trainer-specific views with availability status
 */

// List all trainers with availability
// Query params: available, shift, search, isActive, limit, offset
router.get('/', (req, res) => trainerController.getAllTrainers(req, res));

// Lookup trainers for batch assignment - returns available and unavailable separately
// Query params: startDate (required), endDate (required), shift?, search?, page?, limit?
router.get('/lookup', (req, res) => trainerController.lookupTrainersForBatch(req, res));

// Get single trainer by ID
router.get('/:id', (req, res) => trainerController.getTrainerById(req, res));

// Get batches assigned to a trainer
router.get('/:id/batches', (req, res) => trainerController.getTrainerBatches(req, res));

// Create a new trainer
router.post('/', (req, res) => trainerController.createTrainer(req, res));

// Update a trainer
router.patch('/:id', (req, res) => trainerController.updateTrainer(req, res));

export default router;
