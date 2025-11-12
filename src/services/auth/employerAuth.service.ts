import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '@/config/prisma';

interface JwtPayload {
  userId: string;
  email: string;
  type: 'employer';
}

class EmployerAuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN = '7d';

  generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  async login(email: string, password: string) {
    // Find employer by email
    const employer = await prisma.employers.findUnique({
      where: { email },
      select: {
        id: true,
        employer_code: true,
        company_name: true,
        client_name: true,
        email: true,
        password_hash: true,
        phone: true,
        is_verified: true,
        is_active: true,
      },
    });

    if (!employer) {
      throw new Error('Invalid credentials');
    }

    // Check if employer is verified and active
    if (!employer.is_verified) {
      throw new Error('Your account is not verified yet. Please wait for admin verification.');
    }

    if (!employer.is_active) {
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, employer.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.employers.update({
      where: { id: employer.id },
      data: { last_login: new Date() },
    });

    // Generate JWT token
    const token = this.generateToken({
      userId: employer.id,
      email: employer.email,
      type: 'employer',
    });

    // Remove password from response
    const { password_hash, ...employerData } = employer;

    return {
      employer: employerData,
      token,
    };
  }
}

export default new EmployerAuthService();
