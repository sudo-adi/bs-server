import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { UpdateUserDto, UserResponse } from '@/models/admin/user.model';

export class UserUpdateOperation {
  static async update(id: string, data: UpdateUserDto): Promise<UserResponse> {
    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    // Check for unique constraint violations if email or username is being updated
    if (data.email || data.username) {
      const conflictingUser = await prisma.users.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                data.email ? { email: data.email } : {},
                data.username ? { username: data.username } : {},
              ],
            },
          ],
        },
      });

      if (conflictingUser) {
        throw new AppError('Username or email already exists', 400);
      }
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id },
      data: {
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        phone: data.phone_number,
        role_id: data.role_id,
        is_active: data.is_active,
        last_login: data.last_login,
      },
    });

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userResponse } = updatedUser;
    return userResponse;
  }
}
