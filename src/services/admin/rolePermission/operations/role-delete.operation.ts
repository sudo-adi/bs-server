import prisma from '@/config/prisma';

export class RoleDeleteOperation {
  static async delete(id: string): Promise<void> {
    await prisma.roles.delete({
      where: { id },
    });
  }
}
