import {
  AssignTrainerRequest,
  CreateEnrollmentRequest,
  CreateTrainingBatchRequest,
  DropEnrollmentRequest,
  TrainingBatchListQuery,
} from '@/dtos/training/trainingBatch.dto';
import { trainingBatchService } from '@/services/training/trainingBatch.service';
import { Request, Response } from 'express';

export class TrainingBatchController {
  async getAllBatches(req: Request, res: Response): Promise<void> {
    try {
      const query: TrainingBatchListQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        status: req.query.status as string,
        provider: req.query.provider as string,
      };
      const result = await trainingBatchService.getAllBatches(query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch batches' });
    }
  }

  async getBatchById(req: Request, res: Response): Promise<void> {
    try {
      const batch = await trainingBatchService.getBatchById(req.params.id);
      if (!batch) {
        res.status(404).json({ success: false, message: 'Training batch not found' });
        return;
      }
      res.status(200).json({ success: true, data: batch });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch batch' });
    }
  }

  async createBatch(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateTrainingBatchRequest = req.body;
      if (!data.name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      const batch = await trainingBatchService.createBatch(data, req.user?.id);
      res
        .status(201)
        .json({ success: true, message: 'Training batch created successfully', data: batch });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to create batch' });
    }
  }

  async updateBatch(req: Request, res: Response): Promise<void> {
    try {
      const batch = await trainingBatchService.updateBatch(req.params.id, req.body);
      res
        .status(200)
        .json({ success: true, message: 'Training batch updated successfully', data: batch });
    } catch (error: any) {
      const status = error.message === 'Training batch not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to update batch' });
    }
  }

  async deleteBatch(req: Request, res: Response): Promise<void> {
    try {
      await trainingBatchService.deleteBatch(req.params.id);
      res.status(200).json({ success: true, message: 'Training batch deleted successfully' });
    } catch (error: any) {
      const status = error.message === 'Training batch not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to delete batch' });
    }
  }

  async startBatch(req: Request, res: Response): Promise<void> {
    try {
      const batch = await trainingBatchService.startBatch(req.params.id);
      res
        .status(200)
        .json({ success: true, message: 'Training batch started successfully', data: batch });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('already')
          ? 400
          : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to start batch' });
    }
  }

  async completeBatch(req: Request, res: Response): Promise<void> {
    try {
      const batch = await trainingBatchService.completeBatch(req.params.id, req.user?.id);
      res
        .status(200)
        .json({ success: true, message: 'Training batch completed successfully', data: batch });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('already')
          ? 400
          : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to complete batch' });
    }
  }

  // ==================== ENROLLMENTS ====================
  async getEnrollments(req: Request, res: Response): Promise<void> {
    try {
      const enrollments = await trainingBatchService.getEnrollments(req.params.id);
      res.status(200).json({ success: true, data: enrollments });
    } catch (error: any) {
      const status = error.message === 'Training batch not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to fetch enrollments' });
    }
  }

  async createEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateEnrollmentRequest = req.body;
      if (!data.profileId) {
        res.status(400).json({ success: false, message: 'Profile ID is required' });
        return;
      }
      const enrollment = await trainingBatchService.createEnrollment(
        req.params.id,
        data,
        req.user?.id
      );
      res
        .status(201)
        .json({ success: true, message: 'Enrollment created successfully', data: enrollment });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('already')
          ? 400
          : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to create enrollment' });
    }
  }

  async updateEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const enrollment = await trainingBatchService.updateEnrollment(
        req.params.enrollmentId,
        req.body
      );
      res
        .status(200)
        .json({ success: true, message: 'Enrollment updated successfully', data: enrollment });
    } catch (error: any) {
      const status = error.message === 'Enrollment not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to update enrollment' });
    }
  }

  async completeEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const enrollment = await trainingBatchService.completeEnrollment(
        req.params.enrollmentId,
        req.body,
        req.user?.id
      );
      res
        .status(200)
        .json({ success: true, message: 'Enrollment completed successfully', data: enrollment });
    } catch (error: any) {
      const status = error.message === 'Enrollment not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to complete enrollment' });
    }
  }

  async dropEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const data: DropEnrollmentRequest = req.body;
      if (!data.dropReason) {
        res.status(400).json({ success: false, message: 'Drop reason is required' });
        return;
      }
      const enrollment = await trainingBatchService.dropEnrollment(req.params.enrollmentId, data);
      res
        .status(200)
        .json({ success: true, message: 'Enrollment dropped successfully', data: enrollment });
    } catch (error: any) {
      const status = error.message === 'Enrollment not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to drop enrollment' });
    }
  }

  async removeEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const result = await trainingBatchService.removeEnrollment(req.params.enrollmentId);
      res.status(200).json(result);
    } catch (error: any) {
      const status =
        error.message === 'Enrollment not found'
          ? 404
          : error.message.includes('only remove')
            ? 400
            : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to remove enrollment' });
    }
  }

  // ==================== ELIGIBLE PROFILES ====================
  async getEligibleProfiles(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const profiles = await trainingBatchService.getEligibleProfiles(req.params.id, search);
      res.status(200).json({ success: true, data: profiles, total: profiles.length });
    } catch (error: any) {
      const status = error.message === 'Training batch not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to fetch eligible profiles' });
    }
  }

  // ==================== TRAINERS ====================
  async getTrainers(req: Request, res: Response): Promise<void> {
    try {
      const trainers = await trainingBatchService.getTrainers(req.params.id);
      res.status(200).json({ success: true, data: trainers });
    } catch (error: any) {
      const status = error.message === 'Training batch not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to fetch trainers' });
    }
  }

  async assignTrainer(req: Request, res: Response): Promise<void> {
    try {
      const data: AssignTrainerRequest = req.body;

      if (!data.trainerProfileId) {
        res.status(400).json({ success: false, message: 'Trainer profile ID is required' });
        return;
      }

      if (!data.shift || !['shift_1', 'shift_2'].includes(data.shift)) {
        res.status(400).json({
          success: false,
          message: 'Shift is required and must be either "shift_1" or "shift_2"',
        });
        return;
      }

      const trainer = await trainingBatchService.assignTrainer(req.params.id, data, req.user?.id);
      res
        .status(201)
        .json({ success: true, message: 'Trainer assigned successfully', data: trainer });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('already') || error.message.includes('conflicting')
          ? 400
          : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to assign trainer' });
    }
  }

  async removeTrainer(req: Request, res: Response): Promise<void> {
    try {
      const shift = req.query.shift as string | undefined;
      await trainingBatchService.removeTrainer(req.params.id, req.params.trainerId, shift);
      res.status(200).json({ success: true, message: 'Trainer removed successfully' });
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to remove trainer' });
    }
  }

  // ==================== BULK ENROLLMENT ====================
  async bulkEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const { profileIds } = req.body;

      if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'profileIds array is required and must not be empty',
        });
        return;
      }

      if (profileIds.length > 100) {
        res.status(400).json({
          success: false,
          message: 'Maximum 100 profiles can be enrolled at once',
        });
        return;
      }

      const result = await trainingBatchService.bulkEnrollment(
        req.params.id,
        profileIds,
        req.user?.id
      );

      res.status(200).json({
        success: true,
        message: `Bulk enrollment completed: ${result.successCount} succeeded, ${result.failureCount} failed`,
        data: result,
      });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('completed')
          ? 400
          : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to perform bulk enrollment' });
    }
  }

  // ==================== TRAINING HISTORY ====================
  async getProfileTrainingHistory(req: Request, res: Response): Promise<void> {
    try {
      const result = await trainingBatchService.getProfileTrainingHistory(req.params.profileId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      const status = error.message === 'Profile not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to fetch training history' });
    }
  }
}

export const trainingBatchController = new TrainingBatchController();
export default trainingBatchController;
