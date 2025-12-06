import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  AssignTrainerByProfileDto,
  BulkAssignTrainersDto,
  TrainerBatchAssignmentWithDetails,
} from '@/types';

export class TrainerBatchAssignmentService {
  /**
   * Assign a trainer to a training batch by profile_id
   * This is the primary method for assigning trainers using their profile
   */
  async assignTrainerByProfile(
    data: AssignTrainerByProfileDto
  ): Promise<TrainerBatchAssignmentWithDetails> {
    // 1. Verify profile exists and is a trainer
    const trainer = await prisma.trainers.findUnique({
      where: { profile_id: data.profile_id },
      include: {
        profiles: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!trainer) {
      throw new AppError(
        'Profile is not registered as a trainer. Please add them to the trainers table first.',
        404
      );
    }

    if (!trainer.is_active) {
      throw new AppError('Trainer is inactive and cannot be assigned to batches', 400);
    }

    // 2. Verify training batch exists
    const batch = await prisma.training_batches.findUnique({
      where: { id: data.training_batch_id },
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
        status: true,
      },
    });

    if (!batch) {
      throw new AppError('Training batch not found', 404);
    }

    // 3. Validate trainer schedule (no conflicts)
    if (batch.start_date && batch.end_date) {
      await this.validateTrainerSchedule(trainer.id, batch.start_date, batch.end_date, data.shift);
    }

    // 4. Create the assignment
    const assignment = await prisma.trainer_batch_assignments.create({
      data: {
        trainer_id: trainer.id,
        training_batch_id: data.training_batch_id,
        shift: data.shift,
        assigned_by_user_id: data.assigned_by_user_id,
        is_active: true,
      },
      include: {
        trainers: {
          include: {
            profiles: {
              select: {
                id: true,
                candidate_code: true,
                first_name: true,
                middle_name: true,
                last_name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        training_batches: true,
      },
    });

    return assignment as TrainerBatchAssignmentWithDetails;
  }

  /**
   * Assign multiple trainers to a training batch
   */
  async bulkAssignTrainers(data: BulkAssignTrainersDto): Promise<TrainerBatchAssignmentWithDetails[]> {
    const results: TrainerBatchAssignmentWithDetails[] = [];
    const errors: Array<{ profile_id: string; error: string }> = [];

    for (const assignment of data.assignments) {
      try {
        const result = await this.assignTrainerByProfile({
          profile_id: assignment.profile_id,
          training_batch_id: data.training_batch_id,
          shift: assignment.shift,
          assigned_by_user_id: data.assigned_by_user_id,
        });
        results.push(result);
      } catch (error) {
        errors.push({
          profile_id: assignment.profile_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new AppError(
        `Failed to assign all trainers: ${errors.map((e) => `${e.profile_id}: ${e.error}`).join(', ')}`,
        400
      );
    }

    return results;
  }

  /**
   * Get all trainer assignments for a training batch
   */
  async getTrainersByBatch(batchId: string): Promise<TrainerBatchAssignmentWithDetails[]> {
    const assignments = await prisma.trainer_batch_assignments.findMany({
      where: {
        training_batch_id: batchId,
        is_active: true,
      },
      include: {
        trainers: {
          include: {
            profiles: {
              select: {
                id: true,
                candidate_code: true,
                first_name: true,
                middle_name: true,
                last_name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        training_batches: {
          select: {
            id: true,
            code: true,
            name: true,
            program_name: true,
            start_date: true,
            end_date: true,
            status: true,
          },
        },
      },
      orderBy: {
        shift: 'asc',
      },
    });

    return assignments as TrainerBatchAssignmentWithDetails[];
  }

  /**
   * Get all batch assignments for a specific trainer (by profile_id)
   */
  async getBatchesByTrainer(profileId: string): Promise<TrainerBatchAssignmentWithDetails[]> {
    const trainer = await prisma.trainers.findUnique({
      where: { profile_id: profileId },
      select: { id: true },
    });

    if (!trainer) {
      throw new AppError('Profile is not registered as a trainer', 404);
    }

    const assignments = await prisma.trainer_batch_assignments.findMany({
      where: {
        trainer_id: trainer.id,
        is_active: true,
      },
      include: {
        trainers: {
          include: {
            profiles: {
              select: {
                id: true,
                candidate_code: true,
                first_name: true,
                middle_name: true,
                last_name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        training_batches: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return assignments as TrainerBatchAssignmentWithDetails[];
  }

  /**
   * Remove a trainer from a training batch
   */
  async removeTrainerFromBatch(assignmentId: string): Promise<void> {
    const assignment = await prisma.trainer_batch_assignments.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new AppError('Trainer assignment not found', 404);
    }

    await prisma.trainer_batch_assignments.update({
      where: { id: assignmentId },
      data: { is_active: false },
    });
  }

  /**
   * Validate that trainer doesn't have conflicting batches on same days
   * Rules:
   * - Max 2 batches per trainer per day (one per shift)
   * - Cannot have 2 batches with same shift on same day
   */
  private async validateTrainerSchedule(
    trainerId: string,
    startDate: Date,
    endDate: Date,
    shift: string
  ): Promise<void> {
    // Get all active assignments for this trainer that overlap with the date range
    const overlappingAssignments = await prisma.trainer_batch_assignments.findMany({
      where: {
        trainer_id: trainerId,
        is_active: true,
        training_batches: {
          OR: [
            {
              // Batch starts within our range
              start_date: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              // Batch ends within our range
              end_date: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              // Batch completely encompasses our range
              AND: [{ start_date: { lte: startDate } }, { end_date: { gte: endDate } }],
            },
          ],
        },
      },
      include: {
        training_batches: {
          select: {
            id: true,
            name: true,
            start_date: true,
            end_date: true,
          },
        },
      },
    });

    // Check for conflicts day by day
    const conflicts: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Find batches that include this date
      const assignmentsOnThisDay = overlappingAssignments.filter((assignment) => {
        const batch = assignment.training_batches;
        if (!batch || !batch.start_date || !batch.end_date) return false;

        const batchStart = new Date(batch.start_date);
        const batchEnd = new Date(batch.end_date);
        const checkDate = new Date(dateStr);

        return checkDate >= batchStart && checkDate <= batchEnd;
      });

      // Check if same shift already exists on this day
      const sameShiftAssignment = assignmentsOnThisDay.find((a) => a.shift === shift);
      if (sameShiftAssignment && sameShiftAssignment.training_batches) {
        conflicts.push(
          `${dateStr}: Trainer already has a ${shift === 'shift_1' ? 'Shift 1 (Morning)' : 'Shift 2 (Afternoon)'} batch (${sameShiftAssignment.training_batches.name})`
        );
      }

      // Check if trainer already has 2 batches on this day
      if (assignmentsOnThisDay.length >= 2) {
        conflicts.push(`${dateStr}: Trainer already has 2 batches scheduled (max limit reached)`);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (conflicts.length > 0) {
      const errorMessage = `Cannot assign trainer to this batch. Schedule conflicts:\n${conflicts.slice(0, 5).join('\n')}${
        conflicts.length > 5 ? `\n... and ${conflicts.length - 5} more conflicts` : ''
      }`;
      throw new AppError(errorMessage, 400);
    }
  }
}

export default new TrainerBatchAssignmentService();
