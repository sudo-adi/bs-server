import { roleService } from '@/services/role.service';
import { NextFunction, Request, Response } from 'express';

export class RolePermissionController {
  /**
   * Get all roles
   */
  async getAllRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, isActive } = req.query;
      const result = await roleService.getAllRoles({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active roles only
   */
  async getActiveRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.getAllRoles({ isActive: true });
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const role = await roleService.getRoleById(id);

      res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new role
   */
  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await roleService.createRole(req.body);

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a role
   */
  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const role = await roleService.updateRole(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await roleService.deleteRole(id);

      res.status(200).json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get profile permissions (all permissions from assigned roles)
   */
  async getProfilePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { profileId } = req.params;
      const roleAssignments = await roleService.getProfileRoles(profileId);

      // Aggregate all permissions from assigned roles
      const permissions = roleAssignments.flatMap((assignment) => assignment.role?.permissions || []);

      res.status(200).json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign role to profile
   */
  async assignRoleToProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { profileId } = req.params;
      const { roleId } = req.body;
      const assignedByProfileId = req.user?.id;

      const assignment = await roleService.assignRoleToProfile(profileId, roleId, assignedByProfileId);

      res.status(200).json({
        success: true,
        message: 'Role assigned successfully',
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke role from profile
   */
  async revokeRoleFromProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { assignmentId } = req.params;
      const revokedByProfileId = req.user?.id;

      await roleService.revokeRoleFromProfile(assignmentId, revokedByProfileId);

      res.status(200).json({
        success: true,
        message: 'Role revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get profiles by role
   */
  async getProfilesByRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { roleId } = req.params;
      const profiles = await roleService.getProfilesByRole(roleId);

      res.status(200).json({
        success: true,
        count: profiles.length,
        data: profiles,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add permission to role
   */
  async addPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { roleId } = req.params;
      const permission = await roleService.addPermission(roleId, req.body);

      res.status(201).json({
        success: true,
        message: 'Permission added successfully',
        data: permission,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update permission
   */
  async updatePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissionId } = req.params;
      const permission = await roleService.updatePermission(permissionId, req.body);

      res.status(200).json({
        success: true,
        message: 'Permission updated successfully',
        data: permission,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete permission
   */
  async deletePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissionId } = req.params;
      await roleService.deletePermission(permissionId);

      res.status(200).json({
        success: true,
        message: 'Permission deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const rolePermissionController = new RolePermissionController();
