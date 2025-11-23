import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  email: string;
  type: 'employer';
}

export class EmployerTokenOperation {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = '7d';

  /**
   * Generate JWT token for employer
   */
  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }
}
