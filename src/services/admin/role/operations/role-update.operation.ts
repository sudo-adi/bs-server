import db from '@/config/database';
import { AppError } from '@/middlewares/errorHandler';
import { RoleWithPermissions, UpdateRoleDto } from '@/models/admin/role.model';
import { RoleBaseQuery } from '../queries/role-base.query';
export class RoleUpdateOperation {
  /**
   * Update role and permissions
   */
  static async update(id: number, data: UpdateRoleDto): Promise<RoleWithPermissions> {
    // Check if role exists
    const existing = await RoleBaseQuery.getRoleById(id, false);
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
      const updated = await RoleBaseQuery.getRoleById(id, true);
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
}
