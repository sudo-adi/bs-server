import { EmployerLoginOperation } from './operations/employer-login.operation';
import { EmployerTokenOperation } from './operations/employer-token.operation';

interface JwtPayload {
  userId: string;
  email: string;
  type: 'employer';
}

class EmployerAuthService {
  generateToken(payload: JwtPayload): string {
    return EmployerTokenOperation.generateToken(payload);
  }

  async login(email: string, password: string) {
    const employer = await EmployerLoginOperation.login(email, password);

    // Generate JWT token
    const token = this.generateToken({
      userId: employer.id,
      email: employer.email,
      type: 'employer',
    });

    return {
      employer,
      token,
    };
  }
}

export default new EmployerAuthService();
