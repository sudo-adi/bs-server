import {
  CreateEmployerDto,
  Employer,
  EmployerLoginDto,
  RegisterEmployerDto,
  UpdateEmployerDto,
  VerifyEmployerDto,
} from '@/models/employers/employer.model';
import { EmployerCreateOperation } from './operations/employer-create.operation';
import { EmployerDeleteOperation } from './operations/employer-delete.operation';
import { EmployerLoginOperation } from './operations/employer-login.operation';
import { EmployerRegisterOperation } from './operations/employer-register.operation';
import { EmployerUpdateOperation } from './operations/employer-update.operation';
import { EmployerVerifyOperation } from './operations/employer-verify.operation';
import { EmployerQuery } from './queries/employer.query';

export class EmployerService {
  // ============================================================================
  // QUERIES
  // ============================================================================

  async getAllEmployers(filters?: {
    is_verified?: boolean;
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ employers: Employer[]; total: number }> {
    return EmployerQuery.getAllEmployers(filters);
  }

  async getEmployerById(id: string): Promise<Employer> {
    return EmployerQuery.getEmployerById(id);
  }

  async getEmployerByEmail(email: string): Promise<Employer | null> {
    return EmployerQuery.getEmployerByEmail(email);
  }

  // ============================================================================
  // CREATE, UPDATE, DELETE OPERATIONS
  // ============================================================================

  async registerEmployer(
    data: RegisterEmployerDto
  ): Promise<{ employer: Employer; token: string; projectRequest: any }> {
    return EmployerRegisterOperation.register(data);
  }

  async createEmployer(data: CreateEmployerDto): Promise<Employer> {
    return EmployerCreateOperation.create(data);
  }

  async updateEmployer(id: string, data: UpdateEmployerDto): Promise<Employer> {
    return EmployerUpdateOperation.update(id, data);
  }

  async verifyEmployer(id: string, data: VerifyEmployerDto): Promise<Employer> {
    return EmployerVerifyOperation.verify(id, data);
  }

  async deleteEmployer(id: string, deletedByUserId?: string): Promise<void> {
    return EmployerDeleteOperation.delete(id, deletedByUserId);
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async loginEmployer(data: EmployerLoginDto): Promise<{ employer: Employer; token: string }> {
    return EmployerLoginOperation.login(data);
  }
}

export default new EmployerService();
