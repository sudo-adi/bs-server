import prisma from '@/config/prisma';
import { User } from '@/models/admin/user.model';
import { PasswordHelper } from '../helpers/password.helper';

export class UserVerifyPasswordOperation {
  /**
   * Verify password for authentication
   */
  static async verify(username: string, password: string): Promise<User | null> {
    const user = await prisma.users.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    const isValid = await PasswordHelper.compare(password, user.password_hash);

    if (!isValid) {
      return null;
    }

    return user;
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(id: string): Promise<void> {
    await prisma.users.update({
      where: { id },
      data: { last_login: new Date() },
    });
  }
}
