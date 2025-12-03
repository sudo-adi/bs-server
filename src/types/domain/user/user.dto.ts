import type { User } from '@/types/prisma.types';
import type { CreateDTO, LoginDTO, UpdateDTO } from '@/types/shared';

// CreateUserDto excludes system fields and role_id (optional)
export type CreateUserDto = CreateDTO<User, 'role_id' | 'last_login'> & {
  role_id?: string; // Optional role assignment
  password: string; // Required for creation (will be hashed)
};

// UpdateUserDto excludes system-managed and sensitive fields
export type UpdateUserDto = UpdateDTO<
  User,
  | 'password_hash' // Cannot update password directly
  | 'role_id' // Use separate endpoint for role changes
  | 'last_login' // System-managed
>;

// LoginDto requires email and password
export type UserLoginDto = LoginDTO<User, 'email'> & {
  password: string;
};

// User without password hash (for API responses)
export type UserResponse = Omit<User, 'password_hash'> & {
  user_roles?: Array<{
    role_id: string;
    role_name: string;
    role_code: string;
  }>;
};

// Change Password DTO
export interface ChangePasswordDto {
  old_password: string;
  new_password: string;
}
