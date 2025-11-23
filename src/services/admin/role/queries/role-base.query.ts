import db from '@/config/database';
import { Role, RolePermission, RoleWithPermissions } from '@/models/admin/role.model';

export class RoleBaseQuery {
  /**
   * Get all roles with optional filters
   */
  static async getAllRoles(filters?: {
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
  static async getRoleById(
    id: number,
    include_permissions = true
  ): Promise<RoleWithPermissions | null> {
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
  static async getRoleByCode(role_code: string): Promise<Role | null> {
    const result = await db.query('SELECT * FROM roles WHERE role_code = $1', [role_code]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get role permissions
   */
  static async getRolePermissions(role_id: number): Promise<RolePermission[]> {
    const result = await db.query(
      'SELECT * FROM role_permissions WHERE role_id = $1 ORDER BY module',
      [role_id]
    );

    return result.rows;
  }

  /**
   * Get users assigned to a role
   */
  static async getRoleUsers(role_id: number): Promise<unknown[]> {
    const result = await db.query(
      `SELECT id, username, email, full_name, employee_id, designation, department, is_active, last_login, created_at
       FROM users
       WHERE role_id = $1
       ORDER BY created_at DESC`,
      [role_id]
    );

    return result.rows;
  }
}
