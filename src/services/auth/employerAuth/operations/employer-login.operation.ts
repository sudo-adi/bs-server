import prisma from '@/config/prisma';
import bcrypt from 'bcrypt';

export class EmployerLoginOperation {
  /**
   * Login employer with email and password
   */
  static async login(email: string, password: string) {
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

    // Remove password from response

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...employerData } = employer;

    return employerData;
  }
}
