import { Prisma } from '@/generated/prisma';
import { ProfileDto } from '../profile/profile.dto';

/**
 * DTO for candidate signup (phone-based registration)
 */
export interface CandidateSignupRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  fathersName?: string;
  phone: string;
  altPhone?: string;
  gender?: string;
  dateOfBirth?: Date | string;
  state?: string;
  villageOrCity?: string;
  pincode?: number;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  metadata?: Prisma.JsonValue;
}

/**
 * Response for candidate signup - sends OTP
 */

export interface CandidateSignupResponse {
  success: boolean;
  message: string;
  data?: {
    phone: string;
    otpSent: boolean;
    expiresIn?: number; // seconds
  };
}

/**
 * DTO for OTP verification
 */
export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

/**
 * Response for OTP verification
 */
export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data?: {
    profile: ProfileDto;
    token: string;
    tokenType: string;
    expiresIn: number;
  };
}

/**
 * DTO for login (profile/employer)
 */
export interface LoginRequest {
  phone?: string;
  email?: string;
  password?: string;
  otp?: string; // For OTP-based login
  loginType: 'profile' | 'employer';
}

/**
 * Response for login
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    profile?: ProfileDto;
    employer?: any;
    token: string;
    tokenType: string;
    expiresIn: number;
    requiresOtp?: boolean; // If OTP needs to be sent
  };
}

/**
 * DTO for logout
 */
export interface LogoutRequest {
  token?: string; // Optional: for token blacklisting
}

/**
 * Response for logout
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * DTO for initiating password reset
 */
export interface InitiateResetPasswordRequest {
  phone?: string;
  email?: string;
  userType: 'profile' | 'employer';
}

/**
 * Response for initiating password reset
 */
export interface InitiateResetPasswordResponse {
  success: boolean;
  message: string;
  data?: {
    phone?: string;
    email?: string;
    otpSent?: boolean;
    expiresIn?: number;
  };
}

/**
 * DTO for resetting password with OTP
 */
export interface ResetPasswordRequest {
  phone?: string;
  email?: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  userType: 'profile' | 'employer';
}

/**
 * Response for password reset
 */
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * DTO for changing password (authenticated user)
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Response for change password
 */
export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

/**
 * DTO for refreshing auth token
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Response for token refresh
 */
export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    tokenType: string;
    expiresIn: number;
  };
}

/**
 * JWT payload interface
 */
export interface JwtPayload {
  id: string;
  phone?: string;
  email?: string;
  userType: 'profile' | 'employer' | 'admin';
  candidateCode?: string;
  workerCode?: string;
  isActive: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  phone?: string;
  email?: string;
  userType: 'profile' | 'employer';
  // Profile-specific fields
  profileType?: 'candidate' | 'worker';
  workerType?: 'blue' | 'white' | 'trainer';
  candidateCode?: string;
  workerCode?: string;
  currentStage?: string;
  isActive?: boolean;
  isAdmin?: boolean; // true for super admin (white worker with admin role)
  // Name fields
  firstName?: string;
  lastName?: string;
  // Employer-specific fields
  companyName?: string;
  employerCode?: string;
}

/**
 * Base interface for unified signup with common fields
 */
interface BaseSignupRequest {
  userType: 'candidate' | 'employer';
  phone: string;
  password: string;
  altPhone?: string;
}

/**
 * Candidate signup request for unified signup API
 */
export interface CandidateSignupRequestV2 extends BaseSignupRequest {
  userType: 'candidate';
  firstName: string;
  middleName?: string;
  lastName: string;
  fathersName?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: Date | string;
  state?: string;
  villageOrCity?: string;
  pincode?: number;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  metadata?: Prisma.JsonValue;
}

/**
 * Employer signup request for unified signup API
 */
export interface EmployerSignupRequestV2 extends BaseSignupRequest {
  userType: 'employer';
  companyName: string;
  clientName: string;
  email: string;
  registeredAddress?: string;
  companyRegistrationNumber?: string;
  gstNumber?: string;
  city: string;
  district: string;
  state: string;
  landmark?: string;
  postalCode: string;
  authorizedPersonName: string;
  authorizedPersonDesignation: string;
  authorizedPersonEmail: string;
  authorizedPersonContact: string;
  authorizedPersonAddress: string;
  projectName: string;
  projectDescription: string;
  siteAddress: string;
  projectType?: string;
  durationMonths?: number;
  workerRequirements?: Array<{ category: string; count: number }>;
}

/**
 * Discriminated union type for unified signup requests
 */
export type UnifiedSignupRequest = CandidateSignupRequestV2 | EmployerSignupRequestV2;

/**
 * Response for unified signup
 */
export interface UnifiedSignupResponse {
  success: boolean;
  message: string;
  data?: {
    profile?: ProfileDto;
    employer?: any;
    project?: any;
    token: string;
    tokenType: string;
    expiresIn: number;
  };
}
