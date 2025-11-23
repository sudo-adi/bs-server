import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { PasswordHelper } from '../helpers/password.helper';

export class UserChangePasswordOperation {
  static async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    // Get user with password
    const user = await prisma.users.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify old password
    const isValid = await PasswordHelper.compare(oldPassword, user.password_hash);

    if (!isValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const newPasswordHash = await PasswordHelper.hash(newPassword);

    // Update password
    await prisma.users.update({
      where: { id },
      data: { password_hash: newPasswordHash },
    });
  }
}
