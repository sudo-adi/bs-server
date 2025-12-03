import type { User, Role } from '@/types/prisma.types';
import type { WithRelations } from '@/types/shared';

export type UserWithRole = WithRelations<
  User,
  {
    role?: Role | null;
  }
>;
