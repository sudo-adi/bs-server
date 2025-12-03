import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class RoleDeleteOperation {
  /**
   * Delete role (only if no users assigned)
   */
  static async delete(id: string): Promise<void> {
    const role = await prisma.roles.findUnique({
      where: { id },
      include: {
        users: {
          where: { is_active: true },
        },
      },
    });

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    if (role.users.length > 0) {
      throw new AppError('Cannot delete role with active users. Reassign users first.', 400);
    }

    await prisma.roles.delete({
      where: { id },
    });
  }
}
