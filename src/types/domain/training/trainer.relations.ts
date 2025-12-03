import type { Trainer, TrainingBatch } from '@/types/prisma.types';

export type TrainerWithBatches = Trainer & {
  training_batches?: TrainingBatch[];
  batch_count?: number;
};
