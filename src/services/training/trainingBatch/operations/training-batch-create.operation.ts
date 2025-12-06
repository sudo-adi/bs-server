import prisma from '@/config/prisma';
import { CreateTrainingBatchDto, TrainingBatch } from '@/types';
import { TrainingBatchStatus } from '@/types/enums';

export class TrainingBatchCreateOperation {
  static async create(data: CreateTrainingBatchDto): Promise<TrainingBatch> {
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
}
