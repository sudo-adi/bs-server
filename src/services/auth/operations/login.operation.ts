import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { UserType } from '../auth.service';
import {
  generateWorkerToken,
  generateEmployerToken,
  generateAdminToken,
  verifyPassword,
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTP,
  getOtpExpirySeconds,
} from '../helpers';

export interface LoginResult {
  user: any;
  token: string;
  userType: UserType;
  requiresOtp?: boolean;
}

export async function loginWorker(data: {
  phone?: string;
  email?: string;
  password?: string;
  otp?: string;
}): Promise<LoginResult> {
  const profile = await prisma.profile.findFirst({
    where: { OR: [{ phone: data.phone }, { email: data.email }], deletedAt: null },
  });

  if (!profile) throw new Error('Account not found');
  if (!profile.isActive) throw new Error('Account is inactive');

  // OTP login
  if (data.otp) {
    verifyOTP(data.phone || data.email || '', data.otp, 'login');
  }
  // Password login
  else if (data.password && profile.passwordHash) {
    const valid = await verifyPassword(data.password, profile.passwordHash);
    if (!valid) throw new Error('Invalid password');
  }
  // No password set - require OTP
  else if (!profile.passwordHash) {
    const otp = generateOTP();
    await sendOTP(profile.phone || '', otp);
    storeOTP(data.phone || data.email || '', otp, 'login');
    return { user: null, token: '', userType: 'profile', requiresOtp: true };
  } else {
    throw new Error('Password or OTP required');
  }

  await prisma.profile.update({ where: { id: profile.id }, data: { updatedAt: new Date() } });

  const token = generateWorkerToken(profile);
  const { passwordHash: _, ...user } = profile;

  logger.info('Profile login successful', { id: profile.id, profileType: profile.profileType, workerType: profile.workerType });
  return { user, token, userType: 'profile' };
}

export async function loginEmployer(data: {
  phone?: string;
  email?: string;
  password?: string;
  otp?: string;
}): Promise<LoginResult> {
  const employer = await prisma.employer.findFirst({
    where: { OR: [{ phone: data.phone }, { email: data.email }], deletedAt: null },
  });

  if (!employer) throw new Error('Account not found');
  if (!employer.isActive) throw new Error('Account is inactive');
  if (!employer.isVerified) throw new Error('Account pending verification');

  // OTP login
  if (data.otp) {
    verifyOTP(data.phone || data.email || '', data.otp, 'login');
  }
  // Password login
  else if (data.password && employer.passwordHash) {
    const valid = await verifyPassword(data.password, employer.passwordHash);
    if (!valid) throw new Error('Invalid password');
  }
  // No password - require OTP
  else if (!employer.passwordHash) {
    const otp = generateOTP();
    await sendOTP(employer.phone || '', otp);
    storeOTP(data.phone || data.email || '', otp, 'login');
    return { user: null, token: '', userType: 'employer', requiresOtp: true };
  } else {
    throw new Error('Password or OTP required');
  }

  await prisma.employer.update({ where: { id: employer.id }, data: { lastLogin: new Date() } });

  const token = generateEmployerToken(employer);
  const { passwordHash: _, ...user } = employer;

  logger.info('Employer login successful', { id: employer.id });
  return { user, token, userType: 'employer' };
}

export async function loginAdmin(data: { email: string; password: string }): Promise<LoginResult> {
  const profile = await prisma.profile.findFirst({
    where: {
      workerType: 'white', // Staff/admin users are white collar
      isActive: true,
      deletedAt: null,
      OR: [
        { email: { equals: data.email, mode: 'insensitive' } },
        { phone: data.email }, // Allow login with phone number
        { firstName: { equals: data.email, mode: 'insensitive' } },
      ],
    },
    include: { roleAssignments: { where: { revokedAt: null }, include: { role: true } } },
  });

  if (!profile) throw new Error('Invalid credentials');
  if (!profile.passwordHash) throw new Error('Account not configured for password login');

  const valid = await verifyPassword(data.password, profile.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  await prisma.profile.update({ where: { id: profile.id }, data: { updatedAt: new Date() } });

  const token = generateAdminToken(profile);
  const role = profile.roleAssignments?.[0]?.role;

  const user = {
    id: profile.id,
    email: profile.email,
    fullName: [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' '),
    roleId: role?.id,
    roleName: role?.name,
  };

  logger.info('Admin login successful', { id: profile.id, workerType: 'white' });
  return { user, token, userType: 'profile' };
}

export async function sendLoginOtp(data: {
  phone: string;
  userType: UserType;
  purpose: 'login' | 'signup' | 'reset';
}): Promise<{ otpSent: boolean; expiresIn: number }> {
  const { phone, userType, purpose } = data;

  // Verify user exists
  if (userType === 'employer') {
    const employer = await prisma.employer.findFirst({ where: { phone, deletedAt: null } });
    if (!employer) throw new Error('Account not found');
  } else {
    const profile = await prisma.profile.findFirst({ where: { phone, deletedAt: null } });
    if (!profile) throw new Error('Account not found');
  }

  const otp = generateOTP();
  await sendOTP(phone, otp);
  storeOTP(phone, otp, purpose);

  return { otpSent: true, expiresIn: getOtpExpirySeconds() };
}
