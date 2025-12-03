import type { ActivityLog } from '@/types/prisma.types';
import type { CreateDTO } from '@/types/shared';
import type { BaseFilter } from '@/types/shared/filter.types';

export type CreateActivityLogDto = CreateDTO<ActivityLog>;

export interface ActivityLogQueryParams extends BaseFilter {
  user_id?: string;
  module?: string;
  action?: string;
  start_date?: string | Date;
  end_date?: string | Date;
}
