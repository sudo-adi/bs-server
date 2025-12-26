import { JwtPayload } from '@/dtos/auth/auth.dto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function generateWorkerToken(profile: {
  id: string;
  phone?: string | null;
  email?: string | null;
  workerCode?: string | null;
  candidateCode?: string | null;
  isActive?: boolean | null;
}): string {
  return generateToken({
    id: profile.id,
    phone: profile.phone || undefined,
    email: profile.email || undefined,
    userType: 'profile',
    workerCode: profile.workerCode || undefined,
    candidateCode: profile.candidateCode || undefined,
    isActive: profile.isActive || false,
  });
}

export function generateEmployerToken(employer: {
  id: string;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean | null;
}): string {
  return generateToken({
    id: employer.id,
    phone: employer.phone || undefined,
    email: employer.email || undefined,
    userType: 'employer',
    isActive: employer.isActive || false,
  });
}

export function generateAdminToken(profile: {
  id: string;
  email?: string | null;
  isActive?: boolean | null;
}): string {
  return generateToken({
    id: profile.id,
    email: profile.email || undefined,
    userType: 'admin',
    isActive: profile.isActive || false,
  });
}
