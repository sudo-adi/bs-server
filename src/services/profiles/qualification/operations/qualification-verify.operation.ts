import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { Qualification, VerifyQualificationDto } from '@/types';

export class QualificationVerifyOperation {
  static async verify(id: string, data: VerifyQualificationDto): Promise<Qualification> {
    const existingQualification = await prisma.qualifications.findUnique({
      where: { id },
    });

    if (!existingQualification) {
      throw new AppError('Qualification not found', 404);
    }

    const qualification = await prisma.qualifications.update({
      where: { id },
      data: {
        verified_by_user_id: data.verified_by_user_id,
        verified_at: new Date(),
      },
      include: {
        profiles: true,
      },
    });

    return qualification;
  }
}
