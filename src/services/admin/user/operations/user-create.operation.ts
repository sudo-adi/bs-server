import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { CreateUserDto, UserResponse } from '@/types';
import { PasswordHelper } from '../helpers/password.helper';

export class UserCreateOperation {
  static async create(data: CreateUserDto): Promise<UserResponse> {
    // Check if username or email already exists
    const existing = await prisma.users.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.email }],
      },
    });

    if (existing) {
      throw new AppError('Username or email already exists', 400);
    }

    // Hash password
    const passwordHash = await PasswordHelper.hash(data.password);

    // Create user using Prisma
    const user = await prisma.users.create({
      data: {
        username: data.username,
        email: data.email,
        password_hash: passwordHash,
        full_name: data.full_name,
        phone: data.phone,
        role_id: data.role_id,
        is_active: data.is_active ?? true,
      },
    });

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userResponse } = user;
    return userResponse;
  }
}
