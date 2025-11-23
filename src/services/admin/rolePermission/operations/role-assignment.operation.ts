import prisma from '@/config/prisma';

export class RoleAssignmentOperation {
  static async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await prisma.users.update({
      where: { id: userId },
      data: {
        role_id: roleId,
      },
    });
  }

  static async removeRoleFromUser(userId: string): Promise<void> {
    await prisma.users.update({
      where: { id: userId },
      data: {
        role_id: null,
      },
    });
  }
}
