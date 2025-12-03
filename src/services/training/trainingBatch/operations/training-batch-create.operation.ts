import prisma from '@/config/prisma';
import { CreateTrainingBatchDto, TrainingBatch } from '@/types';
import { TrainingBatchStatus } from '@/types/enums';

export class TrainingBatchCreateOperation {
  static async create(data: CreateTrainingBatchDto): Promise<TrainingBatch> {
    // Validate: trainer cannot have more than 2 batches per day
    if (data.trainer_id && data.start_date && data.end_date && data.shift) {
      await this.validateTrainerSchedule(
        data.trainer_id,
        data.start_date,
        data.end_date,
        data.shift
      );
    }

    // Generate batch code in format: BST-001
    const lastBatch = await prisma.training_batches.findFirst({
      where: {
        code: {
          startsWith: 'BST-',
        },
      },
      orderBy: {
        code: 'desc',
      },
      select: {
        code: true,
      },
    });

    let nextCode = 1;
    if (lastBatch?.code) {
      const match = lastBatch.code.match(/BST-(\d+)/);
      if (match) {
        nextCode = parseInt(match[1]) + 1;
      }
    }

    const code = `BST-${String(nextCode).padStart(3, '0')}`;

    const batch = await prisma.training_batches.create({
      data: {
        code,
        name: data.name,
        program_name: data.program_name,
        provider: data.provider,
        trainer_id: data.trainer_id,
        shift: data.shift,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
        duration_days: data.duration_days,
        max_capacity: data.max_capacity,
        status: data.status || TrainingBatchStatus.UPCOMING,
        location: data.location,
        description: data.description,
        created_by_user_id: data.created_by_user_id,
      },
    });

    return batch;
  }

  /**
   * Validate that trainer doesn't have conflicting batches on same days
   * Rules:
   * - Max 2 batches per trainer per day (one per shift)
   * - Cannot have 2 batches with same shift on same day
   */
  private static async validateTrainerSchedule(
    trainerId: string,
    startDate: Date | string,
    endDate: Date | string,
    shift: string
  ): Promise<void> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all batches for this trainer that overlap with the date range
    const overlappingBatches = await prisma.training_batches.findMany({
      where: {
        trainer_id: trainerId,
        OR: [
          {
            // Batch starts within our range
            start_date: {
              gte: start,
              lte: end,
            },
          },
          {
            // Batch ends within our range
            end_date: {
              gte: start,
              lte: end,
            },
          },
          {
            // Batch completely encompasses our range
            AND: [{ start_date: { lte: start } }, { end_date: { gte: end } }],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        shift: true,
        start_date: true,
        end_date: true,
      },
    });

    // Check for conflicts day by day
    const conflicts: string[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Find batches that include this date
      const batchesOnThisDay = overlappingBatches.filter((batch) => {
        if (!batch.start_date || !batch.end_date) return false;

        const batchStart = new Date(batch.start_date);
        const batchEnd = new Date(batch.end_date);
        const checkDate = new Date(dateStr);

        return checkDate >= batchStart && checkDate <= batchEnd;
      });

      // Check if same shift already exists on this day
      const sameShiftBatch = batchesOnThisDay.find((b) => b.shift === shift);
      if (sameShiftBatch) {
        conflicts.push(
          `${dateStr}: Trainer already has a ${shift === 'shift_1' ? 'Shift 1 (Morning)' : 'Shift 2 (Afternoon)'} batch (${sameShiftBatch.name})`
        );
      }

      // Check if trainer already has 2 batches on this day
      if (batchesOnThisDay.length >= 2) {
        conflicts.push(`${dateStr}: Trainer already has 2 batches scheduled (max limit reached)`);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (conflicts.length > 0) {
      const errorMessage = `Cannot assign trainer to this batch. Schedule conflicts:\n${conflicts.slice(0, 5).join('\n')}${
        conflicts.length > 5 ? `\n... and ${conflicts.length - 5} more conflicts` : ''
      }`;
      throw new Error(errorMessage);
    }
  }
}
