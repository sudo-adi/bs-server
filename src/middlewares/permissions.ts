// @ts-nocheck
// revv
import { roleService } from '@/services/role.service';
import { NextFunction, Request, Response } from 'express';
import { ModuleName, RolePermission } from '../types/role.types';

// Note: Express.Request.user type is defined in @/dtos/auth/auth.dto.ts

/**
 * Middleware to check if user has permission for a specific module and action
 */
export const checkPermission = (
  moduleName: ModuleName,
  action: 'view' | 'manage' | 'export' = 'view'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Check if user is super admin (bypass permission check)
      const isSuperAdmin = await roleService.isSuperAdmin(req.user.id);
      if (isSuperAdmin) {
        return next();
      }

      // Check permission
      const hasPermission = await roleService.checkPermission(req.user.id, moduleName, action);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to ${action} ${moduleName}`,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is super admin
 */
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const isSuperAdmin = await roleService.isSuperAdmin(req.user.id);

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has at least view permission for any module
 */
export const requireAnyPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const permissions = await roleService.getUserPermissions(req.user.id);

    if (!permissions || permissions.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No permissions assigned',
      });
    }

    // Check if user has at least one view permission
    const hasAnyPermission = permissions.some((p: RolePermission) => p.can_view);

    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        message: 'No access permissions granted',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to attach user permissions to request object
 */
export const attachUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user && req.user.id) {
      const permissions = await roleService.getUserPermissions(req.user.id);
      (req as any).permissions = permissions;
    }
    next();
  } catch (error) {
    next(error);
  }
};
