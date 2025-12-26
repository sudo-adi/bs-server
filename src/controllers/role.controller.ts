import roleService from '@/services/role.service';
import { Request, Response } from 'express';

/**
 * Role Controller
 * Manages ProfileRoles and ProfileRolePermissions
 * Worker types: 'blue', 'white', 'trainer'
 */

export class RoleController {
  // ==================== ROLES ====================
  async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        search: req.query.search as string,
        isActive:
          req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };
      const result = await roleService.getAllRoles(query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch roles' });
    }
  }

  async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const role = await roleService.getRoleById(req.params.id);
      res.status(200).json({ success: true, data: role });
    } catch (error: any) {
      const status = error.message === 'Role not found' ? 404 : 500;
      res.status(status).json({ success: false, message: error.message || 'Failed to fetch role' });
    }
  }

  async createRole(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body.name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      const role = await roleService.createRole(req.body);
      res.status(201).json({ success: true, message: 'Role created successfully', data: role });
    } catch (error: any) {
      const status = error.message.includes('already exists') ? 400 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to create role' });
    }
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const role = await roleService.updateRole(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Role updated successfully', data: role });
    } catch (error: any) {
      const status = error.message === 'Role not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to update role' });
    }
  }

  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      await roleService.deleteRole(req.params.id);
      res.status(200).json({ success: true, message: 'Role deleted successfully' });
    } catch (error: any) {
      const status =
        error.message === 'Role not found'
          ? 404
          : error.message.includes('active assignments')
            ? 400
            : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to delete role' });
    }
  }

  // ==================== PERMISSIONS ====================
  async addPermission(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body.moduleName) {
        res.status(400).json({ success: false, message: 'Module name is required' });
        return;
      }
      const permission = await roleService.addPermission(req.params.id, req.body);
      res
        .status(201)
        .json({ success: true, message: 'Permission added successfully', data: permission });
    } catch (error: any) {
      const status =
        error.message === 'Role not found'
          ? 404
          : error.message.includes('already exists')
            ? 400
            : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to add permission' });
    }
  }

  async updatePermission(req: Request, res: Response): Promise<void> {
    try {
      const permission = await roleService.updatePermission(req.params.permissionId, req.body);
      res
        .status(200)
        .json({ success: true, message: 'Permission updated successfully', data: permission });
    } catch (error: any) {
      const status = error.message === 'Permission not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to update permission' });
    }
  }

  async deletePermission(req: Request, res: Response): Promise<void> {
    try {
      await roleService.deletePermission(req.params.permissionId);
      res.status(200).json({ success: true, message: 'Permission deleted successfully' });
    } catch (error: any) {
      const status = error.message === 'Permission not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to delete permission' });
    }
  }

  // ==================== ROLE ASSIGNMENTS ====================
  async assignRole(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.params.id;
      const { roleId } = req.body;
      if (!roleId) {
        res.status(400).json({ success: false, message: 'Role ID is required' });
        return;
      }
      const assignment = await roleService.assignRoleToProfile(profileId, roleId, req.user?.id);
      res
        .status(201)
        .json({ success: true, message: 'Role assigned successfully', data: assignment });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('already assigned')
          ? 400
          : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to assign role' });
    }
  }

  async revokeRole(req: Request, res: Response): Promise<void> {
    try {
      const assignment = await roleService.revokeRoleFromProfile(
        req.params.assignmentId,
        req.user?.id
      );
      res
        .status(200)
        .json({ success: true, message: 'Role revoked successfully', data: assignment });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('already revoked')
          ? 400
          : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to revoke role' });
    }
  }

  async getProfileRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await roleService.getProfileRoles(req.params.id);
      res.status(200).json({ success: true, data: roles });
    } catch (error: any) {
      const status = error.message === 'Profile not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to fetch profile roles' });
    }
  }
}

export const roleController = new RoleController();
export default roleController;
