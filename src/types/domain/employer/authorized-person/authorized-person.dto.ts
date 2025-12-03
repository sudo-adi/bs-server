import type { EmployerAuthorizedPerson } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';

export type CreateEmployerAuthorizedPersonDto = CreateDTO<EmployerAuthorizedPerson>;
export type UpdateEmployerAuthorizedPersonDto = UpdateDTO<EmployerAuthorizedPerson>;
