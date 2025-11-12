import roleService from '@/services/admin/role.service';
import { Request, Response } from 'express';

// Get all roles
export const getAllRoles = async (req: Request, res: Response) => {
  const { is_active, department, include_permissions } = req.query;

  const roles = await roleService.getAllRoles({
    is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
    department: department as string,
    include_permissions: include_permissions === 'true',
  });

  res.status(200).json({
    success: true,
    count: roles.length,
    data: roles,
  });
};

// Get role by ID
export const getRoleById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { include_permissions } = req.query;

  const role = await roleService.getRoleById(id, include_permissions !== 'false');

  if (!role) {
    res.status(404).json({
      success: false,
      message: 'Role not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: role,
  });
};

// Create new role
export const createRole = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  const role = await roleService.createRole(req.body, userId);

  res.status(201).json({
    success: true,
    message: 'Role created successfully',
    data: role,
  });
};

// Update role
export const updateRole = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const role = await roleService.updateRole(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Role updated successfully',
    data: role,
  });
};

// Delete role
export const deleteRole = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  await roleService.deleteRole(id);

  res.status(200).json({
    success: true,
    message: 'Role deleted successfully',
  });
};

// Get users assigned to a role
export const getRoleUsers = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const users = await roleService.getRoleUsers(id);

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
};

// Check user permission
export const checkPermission = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { module, action } = req.body;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  const hasPermission = await roleService.checkPermission(userId, module, action);

  res.status(200).json({
    success: true,
    data: {
      has_permission: hasPermission,
    },
  });
};

// Get current user's permissions
export const getUserPermissions = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  const permissions = await roleService.getUserPermissions(userId);

  res.status(200).json({
    success: true,
    data: {
      user_id: userId,
      permissions,
    },
  });
};
