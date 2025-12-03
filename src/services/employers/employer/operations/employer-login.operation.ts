import { env } from '@/config/env';
import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { Employer, EmployerLoginDto } from '@/types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class EmployerLoginOperation {
  static async login(data: EmployerLoginDto): Promise<{ employer: Employer; token: string }> {
    const employer = await prisma.employers.findFirst({
      where: {
        email: data.email,
        deleted_at: null,
      },
    });

    if (!employer) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!employer.is_verified) {
      throw new AppError(
        'Your account is not verified yet. Please wait for admin verification.',
        403
      );
    }

    if (!employer.is_active) {
      throw new AppError('Account is inactive', 403);
    }

    const isValidPassword = await bcrypt.compare(data.password, employer.password_hash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    await prisma.employers.update({
      where: { id: employer.id },
      data: {
        last_login: new Date(),
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: employer.id,
        email: employer.email,
        type: 'employer',
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...employerWithoutPassword } = employer;

    return { employer: employerWithoutPassword as Employer, token };
  }
}
