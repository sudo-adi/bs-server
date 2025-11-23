import db from '@/config/database';
import { AppError } from '@/middlewares/errorHandler';
import { RoleBaseQuery } from '../queries/role-base.query';
export class RoleDeleteOperation {
  /**
   * Delete role (only if no users assigned and not system role)
   */
  static async delete(id: number): Promise<void> {
    const role = await RoleBaseQuery.getRoleById(id, false);

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
}
