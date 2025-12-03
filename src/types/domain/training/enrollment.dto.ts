import type { BatchEnrollment } from '@/types/prisma.types';
import type { UpdateDTO } from '@/types/shared';

// Only batch_id and profile_id are required, all other fields are optional
export type CreateBatchEnrollmentDto = Pick<BatchEnrollment, 'batch_id' | 'profile_id'> &
  Partial<Omit<BatchEnrollment, 'id' | 'batch_id' | 'profile_id' | 'created_at' | 'updated_at'>>;

export type UpdateBatchEnrollmentDto = UpdateDTO<BatchEnrollment>;
