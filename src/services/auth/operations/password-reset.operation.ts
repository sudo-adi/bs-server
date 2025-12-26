import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { UserType } from '../auth.service';
import {
  hashPassword,
  verifyPassword,
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTP,
  getOtpExpirySeconds,
} from '../helpers';

export async function initiatePasswordReset(data: {
  phone?: string;
  email?: string;
  userType: UserType;
}): Promise<{ otpSent: boolean; expiresIn: number }> {
  const identifier = data.phone || data.email;
  if (!identifier) throw new Error('Phone or email required');

  if (data.userType === 'employer') {
    const employer = await prisma.employer.findFirst({
      where: { OR: [{ phone: data.phone }, { email: data.email }], deletedAt: null },
    });
    if (!employer) throw new Error('Account not found');
  } else {
    const profile = await prisma.profile.findFirst({
      where: { OR: [{ phone: data.phone }, { email: data.email }], deletedAt: null },
    });
    if (!profile) throw new Error('Account not found');
  }

  const otp = generateOTP();
  if (data.phone) await sendOTP(data.phone, otp);
  storeOTP(identifier, otp, 'reset');

  logger.info('Password reset initiated', { identifier, userType: data.userType });
  return { otpSent: true, expiresIn: getOtpExpirySeconds() };
}

export async function resetPassword(data: {
  phone?: string;
  email?: string;
  otp: string;
  newPassword: string;
  userType: UserType;
}): Promise<void> {
  const identifier = data.phone || data.email;
  if (!identifier) throw new Error('Phone or email required');

  verifyOTP(identifier, data.otp, 'reset');
  const passwordHash = await hashPassword(data.newPassword);

  if (data.userType === 'employer') {
    const employer = await prisma.employer.findFirst({
      where: { OR: [{ phone: data.phone }, { email: data.email }], deletedAt: null },
    });
    if (!employer) throw new Error('Account not found');
    await prisma.employer.update({ where: { id: employer.id }, data: { passwordHash } });
  } else {
    const profile = await prisma.profile.findFirst({
      where: { OR: [{ phone: data.phone }, { email: data.email }], deletedAt: null },
    });
    if (!profile) throw new Error('Account not found');
    await prisma.profile.update({ where: { id: profile.id }, data: { passwordHash } });
  }

  logger.info('Password reset successful', { identifier, userType: data.userType });
}

export async function changePassword(
  userId: string,
  userType: UserType,
  data: { currentPassword: string; newPassword: string }
): Promise<void> {
  if (userType === 'employer') {
    const employer = await prisma.employer.findUnique({ where: { id: userId } });
    if (!employer) throw new Error('Account not found');

    if (employer.passwordHash) {
      const valid = await verifyPassword(data.currentPassword, employer.passwordHash);
      if (!valid) throw new Error('Current password is incorrect');
    }

    const passwordHash = await hashPassword(data.newPassword);
    await prisma.employer.update({ where: { id: userId }, data: { passwordHash } });
  } else {
    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) throw new Error('Account not found');

    if (profile.passwordHash) {
      const valid = await verifyPassword(data.currentPassword, profile.passwordHash);
      if (!valid) throw new Error('Current password is incorrect');
    }

    const passwordHash = await hashPassword(data.newPassword);
    await prisma.profile.update({ where: { id: userId }, data: { passwordHash } });
  }

  logger.info('Password changed', { userId, userType });
}
