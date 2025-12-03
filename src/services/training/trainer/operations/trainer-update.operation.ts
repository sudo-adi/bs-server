import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { Trainer, UpdateTrainerDto } from '@/types';

export class TrainerUpdateOperation {
  async updateTrainer(id: string, data: UpdateTrainerDto): Promise<Trainer> {
    // Check if trainer exists
    const existingTrainer = await prisma.trainers.findUnique({
      where: { id },
    });

    if (!existingTrainer) {
      throw new AppError('Trainer not found', 404);
    }

    // Check email uniqueness if being updated
    if (data.email && data.email !== existingTrainer.email) {
      const trainerWithEmail = await prisma.trainers.findUnique({
        where: { email: data.email },
      });

      if (trainerWithEmail && trainerWithEmail.id !== id) {
        throw new AppError('A trainer with this email already exists', 409);
      }
    }

    // Check employee code uniqueness if being updated
    if (data.employee_code && data.employee_code !== existingTrainer.employee_code) {
      const trainerWithCode = await prisma.trainers.findUnique({
        where: { employee_code: data.employee_code },
      });

      if (trainerWithCode && trainerWithCode.id !== id) {
        throw new AppError('A trainer with this employee code already exists', 409);
      }
    }

    // Update trainer
    const updatedTrainer = await prisma.trainers.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.email !== undefined && { email: data.email?.trim() || null }),
        ...(data.phone && { phone: data.phone.trim() }),
        ...(data.profile_photo_url !== undefined && {
          profile_photo_url: data.profile_photo_url?.trim() || null,
        }),
        ...(data.employee_code !== undefined && {
          employee_code: data.employee_code?.trim() || null,
        }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
        updated_at: new Date(),
      },
    });

    return updatedTrainer;
  }
}
