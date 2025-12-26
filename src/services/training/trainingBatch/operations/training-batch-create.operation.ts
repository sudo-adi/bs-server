import prisma from '@/config/prisma';
import { CreateTrainingBatchRequest } from '@/dtos/training/trainingBatch.dto';
import { TrainingBatch } from '@/generated/prisma';

export class TrainingBatchCreateOperation {
  static async create(
    data: CreateTrainingBatchRequest,
    createdByProfileId?: string
  ): Promise<TrainingBatch> {
    // Generate batch code in format: BST000001
    // Use MAX on numeric portion to find the highest existing code number
    const result = await prisma.$queryRaw<{ max_num: number | null }[]>`
      SELECT MAX(
        CAST(
          SUBSTRING(code FROM '[0-9]+$') AS INTEGER
        )
      ) as max_num
      FROM training_batches
      WHERE code IS NOT NULL
      AND code LIKE 'BST%'
    `;

    const lastNumber = result[0]?.max_num || 0;
    const nextNumber = lastNumber + 1;
    const code = `BST${String(nextNumber).padStart(6, '0')}`;

    // Handle both camelCase and snake_case from frontend
    const startDate = data.startDate || data.start_date;
    const endDate = data.endDate || data.end_date;
    const programName = data.programName || data.program_name;
    const maxCapacity = data.maxCapacity || data.max_capacity;

    const batch = await prisma.trainingBatch.create({
      data: {
        code,
        name: data.name,
        programName,
        provider: data.provider,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        durationDays: data.durationDays,
        maxCapacity,
        status: data.status || 'upcoming',
        location: data.location,
        description: data.description,
        shift: data.shift,
        createdByProfileId,
      },
    });

    return batch;
  }
}
