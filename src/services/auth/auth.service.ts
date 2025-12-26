/**
 * Auth Types
 *
 * UserType:
 * - profile: stored in Profile table (candidates and workers)
 * - employer: stored in Employer table
 *
 * ProfileType (for userType='profile'):
 * - candidate: not yet a worker
 * - worker: active worker
 *
 * WorkerType (for profileType='worker'):
 * - blue: blue collar worker
 * - white: white collar worker (super admin is in this category)
 * - trainer: training personnel
 */
export type UserType = 'profile' | 'employer';
export type ProfileType = 'candidate' | 'worker';
export type WorkerType = 'blue' | 'white' | 'trainer';
export type AuthMethod = 'password' | 'otp';

export interface SendOtpRequest {
  phone: string;
  userType: UserType;
  purpose: 'login' | 'signup' | 'reset';
}

export interface LoginRequest {
  phone?: string;
  email?: string;
  password?: string;
  otp?: string;
  userType: UserType;
}

export interface WorkerSignupRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password?: string;
  otp?: string;
  workerType?: WorkerType;
  middleName?: string;
  fathersName?: string;
  gender?: string;
  dateOfBirth?: string;
  altPhone?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  state?: string;
  district?: string;
  villageOrCity?: string;
  pincode?: string;
}

export interface EmployerSignupRequest {
  companyName: string;
  email: string;
  phone?: string;
  password?: string;
  otp?: string;
  clientName?: string;
  altPhone?: string;
  registeredAddress?: string;
  companyRegistrationNumber?: string;
  gstNumber?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  landmark?: string;
  authorizedPersonName?: string;
  authorizedPersonDesignation?: string;
  authorizedPersonEmail?: string;
  authorizedPersonContact?: string;
  authorizedPersonAddress?: string;
  projectName?: string;
  projectDescription?: string;
  siteAddress?: string;
  workerRequirements?: Array<{ category: string; count: number }>;
}

// Import operations
import {
  loginAdmin,
  loginEmployer,
  loginWorker,
  sendLoginOtp,
  type LoginResult,
} from './operations/login.operation';
import {
  changePassword,
  initiatePasswordReset,
  resetPassword,
} from './operations/password-reset.operation';
import { signupEmployer, signupWorker } from './operations/signup.operation';

// Import helpers
import { verifyToken } from './helpers/jwt.helper';

// Thin facade class - delegates to operations
export class AuthService {
  verifyToken = verifyToken;

  async sendLoginOtp(data: SendOtpRequest) {
    return sendLoginOtp(data);
  }

  async login(data: LoginRequest): Promise<LoginResult> {
    const { phone, email, password, otp, userType } = data;
    const identifier = phone || email;
    if (!identifier) throw new Error('Phone or email required');

    if (userType === 'employer') {
      return loginEmployer({ phone, email, password, otp });
    } else {
      // userType === 'profile' (candidates and workers including admins)
      return loginWorker({ phone, email, password, otp });
    }
  }

  // Admin login (convenience method for white workers with admin privileges)
  async loginAdmin(data: { email: string; password: string }): Promise<LoginResult> {
    return loginAdmin(data);
  }

  async signupWorker(data: WorkerSignupRequest) {
    return signupWorker(data);
  }

  async signupEmployer(data: EmployerSignupRequest) {
    return signupEmployer(data);
  }

  async initiatePasswordReset(data: { phone?: string; email?: string; userType: UserType }) {
    return initiatePasswordReset(data);
  }

  async resetPassword(data: {
    phone?: string;
    email?: string;
    otp: string;
    newPassword: string;
    userType: UserType;
  }) {
    return resetPassword(data);
  }

  async changePassword(
    userId: string,
    userType: UserType,
    data: { currentPassword: string; newPassword: string }
  ) {
    return changePassword(userId, userType, data);
  }
}

export default new AuthService();
