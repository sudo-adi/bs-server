import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

export class RoleService {
  // ==================== ROLES ====================
  async getAllRoles(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 50, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProfileRoleWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [roles, total] = await Promise.all([
      prisma.profileRole.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          permissions: true,
          _count: { select: { assignments: true } },
        },
      }),
      prisma.profileRole.count({ where }),
    ]);

    return {
      data: roles,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRoleById(id: string) {
    const role = await prisma.profileRole.findUnique({
      where: { id },
      include: {
        permissions: true,
        assignments: {
          where: { revokedAt: null },
          include: {
            profile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                candidateCode: true,
                workerCode: true,
              },
            },
          },
        },
      },
    });
    if (!role) throw new Error('Role not found');
    return role;
  }

  async createRole(data: {
    name: string;
    permissions?: {
      moduleName: string;
      canView?: boolean;
      canManage?: boolean;
      canExport?: boolean;
      isSuperAdmin?: boolean;
    }[];
  }) {
    const existing = await prisma.profileRole.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existing) throw new Error('Role with this name already exists');

    const { permissions, ...roleData } = data;

    const role = await prisma.profileRole.create({
      data: {
        name: roleData.name,
        permissions: permissions
          ? {
              create: permissions.map((p) => ({
                moduleName: p.moduleName,
                canView: p.canView ?? false,
                canManage: p.canManage ?? false,
                canExport: p.canExport ?? false,
                isSuperAdmin: p.isSuperAdmin ?? false,
              })),
            }
          : undefined,
      },
      include: { permissions: true },
    });

    logger.info('Role created', { id: role.id, name: role.name });
    return role;
  }

  async updateRole(
    id: string,
    data: {
      name?: string;
    }
  ) {
    const role = await prisma.profileRole.findUnique({ where: { id } });
    if (!role) throw new Error('Role not found');

    const updated = await prisma.profileRole.update({
      where: { id },
      data: { name: data.name },
      include: { permissions: true },
    });

    logger.info('Role updated', { id });
    return updated;
  }

  async deleteRole(id: string) {
    const role = await prisma.profileRole.findUnique({ where: { id } });
    if (!role) throw new Error('Role not found');

    // Check if role has active assignments
    const activeAssignments = await prisma.profileRoleAssignment.count({
      where: { roleId: id, revokedAt: null },
    });
    if (activeAssignments > 0) {
      throw new Error('Cannot delete role with active assignments');
    }

    await prisma.profileRole.delete({ where: { id } });
    logger.info('Role deleted', { id });
  }

  // ==================== PERMISSIONS ====================
  async addPermission(
    roleId: string,
    data: {
      moduleName: string;
      canView?: boolean;
      canManage?: boolean;
      canExport?: boolean;
      isSuperAdmin?: boolean;
    }
  ) {
    const role = await prisma.profileRole.findUnique({ where: { id: roleId } });
    if (!role) throw new Error('Role not found');

    const existing = await prisma.profileRolePermission.findFirst({
      where: { roleId, moduleName: data.moduleName },
    });
    if (existing) throw new Error('Permission for this module already exists');

    return prisma.profileRolePermission.create({
      data: {
        roleId,
        moduleName: data.moduleName,
        canView: data.canView ?? false,
        canManage: data.canManage ?? false,
        canExport: data.canExport ?? false,
        isSuperAdmin: data.isSuperAdmin ?? false,
      },
    });
  }

  async updatePermission(
    permissionId: string,
    data: {
      canView?: boolean;
      canManage?: boolean;
      canExport?: boolean;
      isSuperAdmin?: boolean;
    }
  ) {
    const permission = await prisma.profileRolePermission.findUnique({
      where: { id: permissionId },
    });
    if (!permission) throw new Error('Permission not found');

    return prisma.profileRolePermission.update({
      where: { id: permissionId },
      data,
    });
  }

  async deletePermission(permissionId: string) {
    const permission = await prisma.profileRolePermission.findUnique({
      where: { id: permissionId },
    });
    if (!permission) throw new Error('Permission not found');

    await prisma.profileRolePermission.delete({ where: { id: permissionId } });
    logger.info('Permission deleted', { id: permissionId });
  }

  // ==================== ROLE ASSIGNMENTS ====================
  async assignRoleToProfile(profileId: string, roleId: string, assignedByProfileId?: string) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId, deletedAt: null } });
    if (!profile) throw new Error('Profile not found');

    const role = await prisma.profileRole.findUnique({ where: { id: roleId } });
    if (!role) throw new Error('Role not found');

    // Check if already assigned
    const existing = await prisma.profileRoleAssignment.findFirst({
      where: { profileId, roleId, revokedAt: null },
    });
    if (existing) throw new Error('Role already assigned to this profile');

    const assignment = await prisma.profileRoleAssignment.create({
      data: {
        profileId,
        roleId,
        assignedByProfileId,
        assignedAt: new Date(),
      },
      include: {
        role: { include: { permissions: true } },
        profile: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    logger.info('Role assigned to profile', { profileId, roleId });
    return assignment;
  }

  async revokeRoleFromProfile(assignmentId: string, revokedByProfileId?: string) {
    const assignment = await prisma.profileRoleAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new Error('Role assignment not found');
    if (assignment.revokedAt) throw new Error('Role already revoked');

    const updated = await prisma.profileRoleAssignment.update({
      where: { id: assignmentId },
      data: {
        revokedAt: new Date(),
        revokedByProfileId,
      },
    });

    logger.info('Role revoked from profile', { assignmentId });
    return updated;
  }

  async getProfileRoles(profileId: string) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId, deletedAt: null } });
    if (!profile) throw new Error('Profile not found');

    return prisma.profileRoleAssignment.findMany({
      where: { profileId, revokedAt: null },
      include: {
        role: { include: { permissions: true } },
        assignedByProfile: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getProfilesByRole(roleId: string) {
    const role = await prisma.profileRole.findUnique({ where: { id: roleId } });
    if (!role) throw new Error('Role not found');

    const assignments = await prisma.profileRoleAssignment.findMany({
      where: { roleId, revokedAt: null },
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            workerType: true,
            isActive: true,
          },
        },
      },
    });

    return assignments.map((a) => a.profile).filter(Boolean);
  }

  // ==================== PERMISSION CHECKS (for middleware) ====================

  async isSuperAdmin(profileId: string): Promise<boolean> {
    const assignments = await prisma.profileRoleAssignment.findMany({
      where: { profileId, revokedAt: null },
      include: {
        role: { include: { permissions: true } },
      },
    });

    return assignments.some((a) => a.role?.permissions?.some((p) => p.isSuperAdmin === true));
  }

  async checkPermission(
    profileId: string,
    moduleName: string,
    action: 'view' | 'manage' | 'export'
  ): Promise<boolean> {
    const assignments = await prisma.profileRoleAssignment.findMany({
      where: { profileId, revokedAt: null },
      include: {
        role: {
          include: {
            permissions: {
              where: { moduleName },
            },
          },
        },
      },
    });

    for (const assignment of assignments) {
      const permissions = assignment.role?.permissions || [];
      for (const perm of permissions) {
        if (perm.isSuperAdmin) return true;
        if (action === 'view' && perm.canView) return true;
        if (action === 'manage' && perm.canManage) return true;
        if (action === 'export' && perm.canExport) return true;
      }
    }

    return false;
  }

  async getUserPermissions(profileId: string) {
    const assignments = await prisma.profileRoleAssignment.findMany({
      where: { profileId, revokedAt: null },
      include: {
        role: { include: { permissions: true } },
      },
    });

    const permissionsMap = new Map<
      string,
      {
        module_name: string;
        can_view: boolean;
        can_manage: boolean;
        can_export: boolean;
        is_super_admin: boolean;
      }
    >();

    for (const assignment of assignments) {
      const permissions = assignment.role?.permissions || [];
      for (const perm of permissions) {
        const existing = permissionsMap.get(perm.moduleName || '');
        if (existing) {
          // Merge permissions (OR logic)
          existing.can_view = existing.can_view || (perm.canView ?? false);
          existing.can_manage = existing.can_manage || (perm.canManage ?? false);
          existing.can_export = existing.can_export || (perm.canExport ?? false);
          existing.is_super_admin = existing.is_super_admin || (perm.isSuperAdmin ?? false);
        } else {
          permissionsMap.set(perm.moduleName || '', {
            module_name: perm.moduleName || '',
            can_view: perm.canView ?? false,
            can_manage: perm.canManage ?? false,
            can_export: perm.canExport ?? false,
            is_super_admin: perm.isSuperAdmin ?? false,
          });
        }
      }
    }

    return Array.from(permissionsMap.values());
  }
}

export const roleService = new RoleService();
export default roleService;
