import db from '@/config/database';
import { AppError } from '@/middlewares/errorHandler';
import {
  CreateRoleDto,
  Role,
  RolePermission,
  RoleWithPermissions,
  UpdateRoleDto,
} from '@/models/admin/role.model';

export class RoleService {
  /**
   * Get all roles with optional filters
   */
  async getAllRoles(filters?: {
    is_active?: boolean;
    department?: string;
    include_permissions?: boolean;
  }): Promise<RoleWithPermissions[]> {
    let query = `
      SELECT r.*,
        (SELECT COUNT(*) FROM users WHERE role_id = r.id AND is_active = true) as active_users_count
      FROM roles r
      WHERE 1=1
    `;

    const values: unknown[] = [];
    let paramCount = 1;

    if (filters?.is_active !== undefined) {
      query += ` AND r.is_active = $${paramCount}`;
      values.push(filters.is_active);
      paramCount++;
    }

    if (filters?.department) {
      query += ` AND r.department = $${paramCount}`;
      values.push(filters.department);
      paramCount++;
    }

    query += ' ORDER BY r.hierarchy_level, r.created_at DESC';

    const result = await db.query(query, values);
    const roles: RoleWithPermissions[] = result.rows;

    // Include permissions if requested
    if (filters?.include_permissions) {
      for (const role of roles) {
        role.permissions = await this.getRolePermissions(role.id);
      }
    }

    return roles;
  }

  /**
   * Get role by ID with permissions
   */
  async getRoleById(id: number, include_permissions = true): Promise<RoleWithPermissions | null> {
    const result = await db.query(
      `SELECT r.*,
        (SELECT COUNT(*) FROM users WHERE role_id = r.id AND is_active = true) as active_users_count
       FROM roles r 
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const role: RoleWithPermissions = result.rows[0];

    if (include_permissions) {
      role.permissions = await this.getRolePermissions(id);
    }

    return role;
  }

  /**
   * Get role by code
   */
  async getRoleByCode(role_code: string): Promise<Role | null> {
    const result = await db.query('SELECT * FROM roles WHERE role_code = $1', [role_code]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(role_id: number): Promise<RolePermission[]> {
    const result = await db.query(
      'SELECT * FROM role_permissions WHERE role_id = $1 ORDER BY module',
      [role_id]
    );

    return result.rows;
  }

  /**
   * Create a new role with permissions
   */
  async createRole(data: CreateRoleDto, created_by_user_id: number): Promise<RoleWithPermissions> {
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

  /**
   * Update role and permissions
   */
  async updateRole(id: number, data: UpdateRoleDto): Promise<RoleWithPermissions> {
    // Check if role exists
    const existing = await this.getRoleById(id, false);
    if (!existing) {
      throw new AppError('Role not found', 404);
    }

    // Prevent modification of system roles
    if (existing.is_system_role && data.role_name) {
      throw new AppError('Cannot modify system role name', 403);
    }

    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Update role basic info
      const fields: string[] = [];
      const values: unknown[] = [];
      let paramCount = 1;

      if (data.role_name) {
        fields.push(`role_name = $${paramCount}`);
        values.push(data.role_name);
        paramCount++;
      }

      if (data.description !== undefined) {
        fields.push(`description = $${paramCount}`);
        values.push(data.description);
        paramCount++;
      }

      if (data.department !== undefined) {
        fields.push(`department = $${paramCount}`);
        values.push(data.department);
        paramCount++;
      }

      if (data.hierarchy_level !== undefined) {
        fields.push(`hierarchy_level = $${paramCount}`);
        values.push(data.hierarchy_level);
        paramCount++;
      }

      if (data.access_level !== undefined) {
        fields.push(`access_level = $${paramCount}`);
        values.push(data.access_level);
        paramCount++;
      }

      if (data.is_active !== undefined) {
        fields.push(`is_active = $${paramCount}`);
        values.push(data.is_active);
        paramCount++;
      }

      if (fields.length > 0) {
        values.push(id);
        const query = `
          UPDATE roles
          SET ${fields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `;
        await client.query(query, values);
      }

      // Update permissions if provided
      if (data.permissions && data.permissions.length > 0) {
        // Delete existing permissions
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);

        // Insert new permissions
        for (const perm of data.permissions) {
          await client.query(
            `INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export, can_approve, can_verify)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              id,
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
        }
      }

      await client.query('COMMIT');

      // Fetch updated role with permissions
      const updated = await this.getRoleById(id, true);
      if (!updated) {
        throw new AppError('Failed to retrieve updated role', 500);
      }

      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete role (only if no users assigned and not system role)
   */
  async deleteRole(id: number): Promise<void> {
    const role = await this.getRoleById(id, false);

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    if (role.is_system_role) {
      throw new AppError('Cannot delete system role', 403);
    }

    if (role.active_users_count && role.active_users_count > 0) {
      throw new AppError('Cannot delete role with active users. Reassign users first.', 400);
    }

    await db.query('DELETE FROM roles WHERE id = $1', [id]);
  }

  /**
   * Get users assigned to a role
   */
  async getRoleUsers(role_id: number): Promise<unknown[]> {
    const result = await db.query(
      `SELECT id, username, email, full_name, employee_id, designation, department, is_active, last_login, created_at
       FROM users
       WHERE role_id = $1
       ORDER BY created_at DESC`,
      [role_id]
    );

    return result.rows;
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(
    user_id: number,
    module: string,
    action:
      | 'can_view'
      | 'can_create'
      | 'can_edit'
      | 'can_delete'
      | 'can_export'
      | 'can_approve'
      | 'can_verify'
  ): Promise<boolean> {
    const result = await db.query(
      `SELECT rp.${action}
       FROM users u
       JOIN role_permissions rp ON rp.role_id = u.role_id
       WHERE u.id = $1 AND rp.module = $2`,
      [user_id, module]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0][action] === true;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(user_id: number): Promise<Record<string, Record<string, boolean>>> {
    const result = await db.query(
      `SELECT rp.*
       FROM users u
       JOIN role_permissions rp ON rp.role_id = u.role_id
       WHERE u.id = $1`,
      [user_id]
    );

    const permissions: Record<string, Record<string, boolean>> = {};

    for (const row of result.rows) {
      permissions[row.module] = {
        can_view: row.can_view,
        can_create: row.can_create,
        can_edit: row.can_edit,
        can_delete: row.can_delete,
        can_export: row.can_export,
        can_approve: row.can_approve,
        can_verify: row.can_verify,
      };
    }

    return permissions;
  }
}

export default new RoleService();
