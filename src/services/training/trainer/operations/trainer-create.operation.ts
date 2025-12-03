import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { CreateTrainerDto, Trainer } from '@/types';
import { CodeGenerator } from '@/utils/codeGenerator';
import { PasswordHelper } from '@/services/admin/user/helpers/password.helper';

export class TrainerCreateOperation {
  static async create(data: CreateTrainerDto): Promise<Trainer> {
    // Validate required fields
    if (!data.name?.trim()) {
      throw new AppError('Trainer name is required', 400);
    }

    if (!data.phone?.trim()) {
      throw new AppError('Phone number is required', 400);
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingTrainerByEmail = await prisma.trainers.findUnique({
        where: { email: data.email },
      });

      if (existingTrainerByEmail) {
        throw new AppError('A trainer with this email already exists', 409);
      }
    }

    // Auto-generate employee code using BSW- prefix
    const employee_code = await CodeGenerator.generate('trainer');

    // Hash password if provided
    let password_hash: string | null = null;
    if (data.password_hash && typeof data.password_hash === 'string' && data.password_hash.trim()) {
      password_hash = await PasswordHelper.hash(data.password_hash.trim());
    }

    // Create trainer
    const trainer = await prisma.trainers.create({
      data: {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone.trim(),
        profile_photo_url: data.profile_photo_url?.trim() || null,
        employee_code: employee_code,
        password_hash: password_hash,
        is_active: data.is_active ?? true,
        created_by_user_id: data.created_by_user_id || null,
      },
    });

    return trainer;
  }
}
