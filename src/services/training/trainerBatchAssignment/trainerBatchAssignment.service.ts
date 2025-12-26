import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export interface AssignTrainerDto {
  trainerProfileId: string;
  trainingBatchId: string;
  shift: 'shift_1' | 'shift_2';
  assignedByProfileId?: string;
}

export interface BulkAssignTrainersDto {
  trainingBatchId: string;
  assignments: Array<{
    trainerProfileId: string;
    shift: 'shift_1' | 'shift_2';
  }>;
  assignedByProfileId?: string;
}

export class TrainerBatchAssignmentService {
  /**
   * Check if two date ranges overlap
   */
  private datesOverlap(
    start1: Date | null,
    end1: Date | null,
    start2: Date | null,
    end2: Date | null
  ): boolean {
    if (!start1 || !end1 || !start2 || !end2) return false;
    return start1 <= end2 && start2 <= end1;
  }

  /**
   * Assign a trainer (profile) to a training batch for a specific shift
   */
  async assignTrainer(data: AssignTrainerDto): Promise<any> {
    // 1. Verify profile exists and is a trainer
    const profile = await prisma.profile.findUnique({
      where: { id: data.trainerProfileId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        workerType: true,
      },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    if (profile.workerType !== 'trainer') {
      throw new AppError('Profile is not a trainer', 400);
    }

    // 2. Verify training batch exists
    const batch = await prisma.trainingBatch.findUnique({
      where: { id: data.trainingBatchId },
      select: {
        id: true,
        code: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (!batch) {
      throw new AppError('Training batch not found', 404);
    }

    // 3. Check if this shift is already assigned for this batch
    const existingShiftAssignment = await prisma.trainingBatchTrainer.findFirst({
      where: {
        trainingBatchId: data.trainingBatchId,
        shift: data.shift,
      },
      include: {
        trainerProfile: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (existingShiftAssignment) {
      const trainerName = `${existingShiftAssignment.trainerProfile?.firstName || ''} ${existingShiftAssignment.trainerProfile?.lastName || ''}`.trim();
      throw new AppError(
        `${data.shift === 'shift_1' ? 'Shift 1' : 'Shift 2'} is already assigned to ${trainerName}`,
        400
      );
    }

    // 4. Check if trainer has conflicting assignments in the same date range
    const conflictingAssignments = await prisma.trainingBatchTrainer.findMany({
      where: {
        trainerProfileId: data.trainerProfileId,
        shift: data.shift,
        trainingBatch: {
          status: { in: ['ongoing', 'upcoming', 'scheduled'] },
        },
      },
      include: {
        trainingBatch: {
          select: {
            id: true,
            code: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    // Check for date overlap
    for (const assignment of conflictingAssignments) {
      if (
        this.datesOverlap(
          batch.startDate,
          batch.endDate,
          assignment.trainingBatch?.startDate || null,
          assignment.trainingBatch?.endDate || null
        )
      ) {
        throw new AppError(
          `Trainer has a conflicting ${data.shift === 'shift_1' ? 'Shift 1' : 'Shift 2'} assignment with batch "${assignment.trainingBatch?.name}" (${assignment.trainingBatch?.code})`,
          400
        );
      }
    }

    // 5. Create the assignment
    const assignment = await prisma.trainingBatchTrainer.create({
      data: {
        trainingBatchId: data.trainingBatchId,
        trainerProfileId: data.trainerProfileId,
        shift: data.shift,
        assignedByProfileId: data.assignedByProfileId,
        assignedAt: new Date(),
      },
      include: {
        trainerProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            workerCode: true,
            candidateCode: true,
            profilePhotoURL: true,
          },
        },
        trainingBatch: {
          select: {
            id: true,
            code: true,
            name: true,
            programName: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
    });

    return assignment;
  }

  /**
   * Assign multiple trainers to a training batch (for both shifts)
   */
  async bulkAssignTrainers(data: BulkAssignTrainersDto): Promise<any[]> {
    const results: any[] = [];
    const errors: Array<{ profileId: string; shift: string; error: string }> = [];

    for (const assignment of data.assignments) {
      try {
        const result = await this.assignTrainer({
          trainerProfileId: assignment.trainerProfileId,
          trainingBatchId: data.trainingBatchId,
          shift: assignment.shift,
          assignedByProfileId: data.assignedByProfileId,
        });
        results.push(result);
      } catch (error) {
        errors.push({
          profileId: assignment.trainerProfileId,
          shift: assignment.shift,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new AppError(
        `Failed to assign trainers: ${errors.map((e) => `${e.profileId} (${e.shift}): ${e.error}`).join(', ')}`,
        400
      );
    }

    return results;
  }

  /**
   * Get all trainer assignments for a training batch
   */
  async getTrainersByBatch(batchId: string): Promise<any[]> {
    const assignments = await prisma.trainingBatchTrainer.findMany({
      where: {
        trainingBatchId: batchId,
      },
      include: {
        trainerProfile: {
          select: {
            id: true,
            candidateCode: true,
            workerCode: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            profilePhotoURL: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        trainingBatch: {
          select: {
            id: true,
            code: true,
            name: true,
            programName: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        assignedByProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ shift: 'asc' }, { assignedAt: 'desc' }],
    });

    return assignments.map((a) => ({
      id: a.id,
      shift: a.shift,
      assignedAt: a.assignedAt,
      trainer: {
        id: a.trainerProfile?.id,
        name: `${a.trainerProfile?.firstName || ''} ${a.trainerProfile?.lastName || ''}`.trim(),
        firstName: a.trainerProfile?.firstName,
        lastName: a.trainerProfile?.lastName,
        workerCode: a.trainerProfile?.workerCode || a.trainerProfile?.candidateCode,
        phone: a.trainerProfile?.phone,
        email: a.trainerProfile?.email,
        profilePhotoUrl: a.trainerProfile?.profilePhotoURL,
        dateOfBirth: a.trainerProfile?.dateOfBirth,
        gender: a.trainerProfile?.gender,
      },
      batch: a.trainingBatch,
      assignedBy: a.assignedByProfile
        ? {
            id: a.assignedByProfile.id,
            name: `${a.assignedByProfile.firstName || ''} ${a.assignedByProfile.lastName || ''}`.trim(),
          }
        : null,
    }));
  }

  /**
   * Get all batch assignments for a specific trainer (by profileId)
   */
  async getBatchesByTrainer(profileId: string): Promise<any[]> {
    const assignments = await prisma.trainingBatchTrainer.findMany({
      where: {
        trainerProfileId: profileId,
      },
      include: {
        trainerProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            workerCode: true,
            candidateCode: true,
          },
        },
        trainingBatch: true,
      },
      orderBy: [{ trainingBatch: { startDate: 'desc' } }, { shift: 'asc' }],
    });

    return assignments.map((a) => ({
      id: a.id,
      shift: a.shift,
      assignedAt: a.assignedAt,
      batch: a.trainingBatch,
      trainer: {
        id: a.trainerProfile?.id,
        name: `${a.trainerProfile?.firstName || ''} ${a.trainerProfile?.lastName || ''}`.trim(),
        workerCode: a.trainerProfile?.workerCode || a.trainerProfile?.candidateCode,
        phone: a.trainerProfile?.phone,
        email: a.trainerProfile?.email,
      },
    }));
  }

  /**
   * Remove a trainer from a training batch by assignment ID
   */
  async removeTrainerFromBatch(assignmentId: string): Promise<void> {
    const assignment = await prisma.trainingBatchTrainer.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new AppError('Trainer assignment not found', 404);
    }

    await prisma.trainingBatchTrainer.delete({
      where: { id: assignmentId },
    });
  }

  /**
   * Remove a trainer from a batch by profileId, batchId and shift
   */
  async removeTrainerByProfile(
    trainerProfileId: string,
    trainingBatchId: string,
    shift?: 'shift_1' | 'shift_2'
  ): Promise<void> {
    const where: any = {
      trainerProfileId,
      trainingBatchId,
    };

    if (shift) {
      where.shift = shift;
    }

    const assignment = await prisma.trainingBatchTrainer.findFirst({ where });

    if (!assignment) {
      throw new AppError('Trainer assignment not found', 404);
    }

    await prisma.trainingBatchTrainer.delete({
      where: { id: assignment.id },
    });
  }

  /**
   * Remove trainer from a batch by shift only
   */
  async removeTrainerByShift(trainingBatchId: string, shift: 'shift_1' | 'shift_2'): Promise<void> {
    const assignment = await prisma.trainingBatchTrainer.findFirst({
      where: {
        trainingBatchId,
        shift,
      },
    });

    if (!assignment) {
      throw new AppError(`No trainer assigned to ${shift === 'shift_1' ? 'Shift 1' : 'Shift 2'}`, 404);
    }

    await prisma.trainingBatchTrainer.delete({
      where: { id: assignment.id },
    });
  }

  /**
   * Update trainer assignment (change trainer for a shift)
   */
  async updateTrainerAssignment(
    trainingBatchId: string,
    shift: 'shift_1' | 'shift_2',
    newTrainerProfileId: string,
    assignedByProfileId?: string
  ): Promise<any> {
    // Remove existing assignment for this shift if exists
    const existing = await prisma.trainingBatchTrainer.findFirst({
      where: { trainingBatchId, shift },
    });

    if (existing) {
      await prisma.trainingBatchTrainer.delete({
        where: { id: existing.id },
      });
    }

    // Assign new trainer
    return this.assignTrainer({
      trainerProfileId: newTrainerProfileId,
      trainingBatchId,
      shift,
      assignedByProfileId,
    });
  }
}

export const trainerBatchAssignmentService = new TrainerBatchAssignmentService();
export default trainerBatchAssignmentService;
