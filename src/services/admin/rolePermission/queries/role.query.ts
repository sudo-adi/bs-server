import prisma from '@/config/prisma';
import { Role } from '@/types/role.types';

export class RoleQuery {
  static async getAllRoles(): Promise<Role[]> {
    const roles = await prisma.roles.findMany({
      include: {
        permissions: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return roles as Role[];
  }

  static async getActiveRoles(): Promise<Role[]> {
    const roles = await prisma.roles.findMany({
      where: {
        is_active: true,
      },
      include: {
        permissions: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return roles as Role[];
  }

  static async getRoleById(id: string): Promise<Role | null> {
    const role = await prisma.roles.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });
    return role as Role | null;
  }

  static async getRoleByName(name: string): Promise<Role | null> {
    const role = await prisma.roles.findUnique({
      where: { name },
      include: {
        permissions: true,
      },
    });
    return role as Role | null;
  }

  static async getUsersByRole(roleId: string) {
    const users = await prisma.users.findMany({
      where: {
        role_id: roleId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        is_active: true,
        created_at: true,
      },
    });
    return users;
  }
}
