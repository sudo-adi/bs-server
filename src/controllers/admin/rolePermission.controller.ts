import { NextFunction, Request, Response } from 'express';
import { rolePermissionService } from '../../services/admin/rolePermission.service';
import { CreateRoleInput, UpdateRoleInput } from '../../types/role.types';

export class RolePermissionController {
  /**
   * Get all roles
   */
  async getAllRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await rolePermissionService.getAllRoles();
      res.status(200).json({
        success: true,
        data: roles,
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
      const roles = await rolePermissionService.getActiveRoles();
      res.status(200).json({
        success: true,
        data: roles,
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
      const role = await rolePermissionService.getRoleById(id);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found',
        });
      }

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
      const input: CreateRoleInput = req.body;

      // Check if role name already exists
      const existing = await rolePermissionService.getRoleByName(input.name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Role with this name already exists',
        });
      }

      const role = await rolePermissionService.createRole(input);

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
      const input: UpdateRoleInput = req.body;

      // Check if role exists
      const existing = await rolePermissionService.getRoleById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Role not found',
        });
      }

      // Check if new name already exists (if name is being updated)
      if (input.name && input.name !== existing.name) {
        const nameExists = await rolePermissionService.getRoleByName(input.name);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Role with this name already exists',
          });
        }
      }

      const role = await rolePermissionService.updateRole(id, input);

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

      // Check if role exists
      const existing = await rolePermissionService.getRoleById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Role not found',
        });
      }

      // Check if any users have this role
      const users = await rolePermissionService.getUsersByRole(id);
      if (users.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete role. ${users.length} user(s) are assigned to this role.`,
        });
      }

      await rolePermissionService.deleteRole(id);

      res.status(200).json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const permissions = await rolePermissionService.getUserPermissions(userId);

      res.status(200).json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check user permission
   */
  async checkPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { module, action } = req.body;

      const hasPermission = await rolePermissionService.checkPermission(userId, module, action);

      res.status(200).json({
        success: true,
        data: {
          hasPermission,
          module,
          action,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;

      // Check if role exists
      const role = await rolePermissionService.getRoleById(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found',
        });
      }

      await rolePermissionService.assignRoleToUser(userId, roleId);

      res.status(200).json({
        success: true,
        message: 'Role assigned successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      await rolePermissionService.removeRoleFromUser(userId);

      res.status(200).json({
        success: true,
        message: 'Role removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { roleId } = req.params;

      const users = await rolePermissionService.getUsersByRole(roleId);

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const rolePermissionController = new RolePermissionController();
