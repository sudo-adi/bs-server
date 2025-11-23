import db from '@/config/database';
import { AppError } from '@/middlewares/errorHandler';
import {
  CreateRoleDto,
  Role,
  RolePermission,
  RoleWithPermissions,
} from '@/models/admin/role.model';

export class RoleCreateOperation {
  /**
   * Create a new role with permissions
   */
  static async create(
    data: CreateRoleDto,
    created_by_user_id: number
  ): Promise<RoleWithPermissions> {
    // Check if role name already exists
    const existing = await db.query('SELECT id FROM roles WHERE role_name = $1', [data.role_name]);

    if (existing.rows.length > 0) {
      throw new AppError('Role name already exists', 400);
    }

    // Generate role_code from role_name
    const role_code = 'ROLE_' + data.role_name.toUpperCase().replace(/\s+/g, '_');

    // Check if role_code already exists
    const existingCode = await db.query('SELECT id FROM roles WHERE role_code = $1', [role_code]);

    if (existingCode.rows.length > 0) {
      throw new AppError('Role code already exists', 400);
    }

    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Insert role
      const roleResult = await client.query(
        `INSERT INTO roles (role_name, role_code, description, department, hierarchy_level, access_level, created_by_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          data.role_name,
          role_code,
          data.description || null,
          data.department || null,
          data.hierarchy_level || 4,
          data.access_level || 'limited',
          created_by_user_id,
        ]
      );

      const role: Role = roleResult.rows[0];

      // Insert permissions
      const permissions: RolePermission[] = [];
      for (const perm of data.permissions) {
        const permResult = await client.query(
          `INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export, can_approve, can_verify)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            role.id,
            perm.module,
            perm.can_view || false,
            perm.can_create || false,
            perm.can_edit || false,
            perm.can_delete || false,
            perm.can_export || false,
            perm.can_approve || false,
            perm.can_verify || false,
          ]
        );
        permissions.push(permResult.rows[0]);
      }

      await client.query('COMMIT');

      return {
        ...role,
        permissions,
        active_users_count: 0,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
