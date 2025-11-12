/**
 * User model types - Re-exported from Prisma types
 * These align with the Prisma schema for the users table
 */

import type { User as PrismaUser, UserWithRoles } from '@/types/prisma.types';

// Re-export Prisma User type
export type User = PrismaUser;

// User without password hash (for API responses)
export interface UserResponse extends Omit<User, 'password_hash'> {
  user_roles?: Array<{
    role_id: string;
    role_name: string;
    role_code: string;
  }>;
}

// Create User DTO
export interface CreateUserDto {
  username: string;
  email: string;
  password: string; // Will be hashed in service
  full_name?: string;
  phone_number?: string;
  role_id?: string; // UUID
  is_active?: boolean;
}

// Update User DTO
export interface UpdateUserDto {
  email?: string;
  username?: string;
  full_name?: string;
  phone_number?: string;
  role_id?: string; // UUID
  is_active?: boolean;
  last_login?: Date;
}

// Login DTO
export interface LoginDto {
  username: string;
  password: string;
}

// Change Password DTO
export interface ChangePasswordDto {
  old_password: string;
  new_password: string;
}

// Re-export UserWithRoles for convenience
export type { UserWithRoles };
