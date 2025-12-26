import logger from '@/config/logger';

const OTP_EXPIRY_MINUTES = 10;

// OTP store (use Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: Date; purpose: string }>();

export type OtpPurpose = 'login' | 'signup' | 'reset';

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(identifier: string, otp: string, purpose: OtpPurpose): void {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);
  otpStore.set(identifier, { otp, expiresAt, purpose });

  // Auto-cleanup after expiry
  setTimeout(() => otpStore.delete(identifier), OTP_EXPIRY_MINUTES * 60 * 1000);
}

export function verifyOTP(identifier: string, otp: string, purpose: OtpPurpose): boolean {
  // DEV MODE: Accept any 6-digit OTP for testing (remove in production)
  const isDevMode = process.env.NODE_ENV !== 'production';
  if (isDevMode && /^\d{6}$/.test(otp)) {
    logger.info('DEV MODE: Accepting any 6-digit OTP', { identifier, purpose });
    otpStore.delete(identifier); // Clean up if exists
    return true;
  }

  const stored = otpStore.get(identifier);

  if (!stored) {
    throw new Error('OTP not found or expired');
  }

  if (stored.purpose !== purpose) {
    throw new Error('Invalid OTP purpose');
  }

  if (new Date() > stored.expiresAt) {
    otpStore.delete(identifier);
    throw new Error('OTP expired');
  }

  if (stored.otp !== otp) {
    throw new Error('Invalid OTP');
  }

  // OTP verified, remove from store
  otpStore.delete(identifier);
  return true;
}

export async function sendOTP(phone: string, otp: string): Promise<boolean> {
  // TODO: Integrate with SMS gateway (Twilio, AWS SNS, etc.)
  logger.info('OTP sent', { phone, otp });
  console.log(`📱 OTP for ${phone}: ${otp}`);
  return true;
}

export function getOtpExpirySeconds(): number {
  return OTP_EXPIRY_MINUTES * 60;
}
