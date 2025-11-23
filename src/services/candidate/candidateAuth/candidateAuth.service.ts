import { AuthSendOtpOperation } from './operations/auth-send-otp.operation';
import { AuthVerifyOtpOperation } from './operations/auth-verify-otp.operation';
import { AuthVerifyTokenOperation } from './operations/auth-verify-token.operation';
import { AuthProfileQuery } from './queries/auth-profile.query';

interface CandidateJwtPayload {
  profileId: string;
  phone: string;
  type: 'candidate';
}

interface CandidateAuthResponse {
  profile: any;
  token: string;
}

export class CandidateAuthService {
  /**
   * Generate and send OTP to candidate's mobile number
   * For now, this is a mock implementation that returns OTP in response
   * In production, integrate with SMS service (Twilio, AWS SNS, etc.)
   */
  async sendOTP(phone: string): Promise<{ message: string; otp?: string }> {
    return AuthSendOtpOperation.sendOTP(phone);
  }

  /**
   * Verify OTP and return JWT token
   */
  async verifyOTP(phone: string, otp: string): Promise<CandidateAuthResponse> {
    return AuthVerifyOtpOperation.verifyOTP(phone, otp);
  }

  /**
   * Verify JWT token and return profile
   */
  verifyToken(token: string): CandidateJwtPayload {
    return AuthVerifyTokenOperation.verifyToken(token);
  }

  /**
   * Get current candidate profile from token
   */
  async getCurrentCandidate(profileId: string): Promise<any> {
    return AuthProfileQuery.getCurrentCandidate(profileId);
  }
}

export default new CandidateAuthService();
