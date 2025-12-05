import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { Employer, VerifyEmployerDto } from '@/types';

export class EmployerVerifyOperation {
  static async verify(id: string, data: VerifyEmployerDto): Promise<Employer> {
    console.log('🔩 EmployerVerifyOperation.verify called with:');
    console.log('  - id:', id);
    console.log('  - id type:', typeof id);
    console.log('  - id length:', id?.length);
    console.log('  - data:', data);
    console.log('  - data.verified_by_user_id:', data.verified_by_user_id);
    console.log('  - data.verified_by_user_id type:', typeof data.verified_by_user_id);

    // Check if employer exists and is not deleted
    console.log('🔩 About to call prisma.employers.findUnique with id:', id);
    const existing = await prisma.employers.findUnique({
      where: { id },
    });
    console.log('🔩 Found existing employer:', existing ? 'YES' : 'NO');

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
