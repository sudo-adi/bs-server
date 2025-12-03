import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { Employer, VerifyEmployerDto } from '@/types';

export class EmployerVerifyOperation {
  static async verify(id: string, data: VerifyEmployerDto): Promise<Employer> {
    // Check if employer exists and is not deleted
    const existing = await prisma.employers.findUnique({
      where: { id },
    });

    if (!existing || existing.deleted_at) {
      throw new AppError('Employer not found', 404);
    }

    const employer = await prisma.employers.update({
      where: { id },
      data: {
        is_verified: true,
        verified_by_user_id: data.verified_by_user_id,
        verified_at: new Date(),
        updated_at: new Date(),
      },
    });

    return employer;
  }
}
