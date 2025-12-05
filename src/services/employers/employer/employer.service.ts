import {
  CreateEmployerDto,
  Employer,
  EmployerLoginDto,
  RegisterEmployerDto,
  UpdateEmployerDto,
  VerifyEmployerDto,
} from '@/types';
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

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkVerify(
    employerIds: string[],
    userId: string
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    console.log('🔧 EmployerService.bulkVerify called with:');
    console.log('  - employerIds:', employerIds);
    console.log('  - userId:', userId);
    console.log('  - userId type:', typeof userId);

    const errors: any[] = [];
    let successCount = 0;

    for (const employerId of employerIds) {
      try {
        console.log(`🔧 Verifying employer ${employerId} with user ${userId}`);
        const verifyData = {
          verified_by_user_id: userId,
        };
        console.log('🔧 Calling verifyEmployer with:', { employerId, verifyData });
        await this.verifyEmployer(employerId, verifyData);
        successCount++;
      } catch (error) {
        console.error(`🔧 Error verifying employer ${employerId}:`, error);
        errors.push({
          employer_id: employerId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: successCount,
      failed: errors.length,
      errors,
    };
  }

  async bulkSoftDelete(
    employerIds: string[]
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const errors: any[] = [];
    let successCount = 0;

    for (const employerId of employerIds) {
      try {
        await this.updateEmployer(employerId, {
          is_active: false,
        });
        successCount++;
      } catch (error) {
        errors.push({
          employer_id: employerId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: successCount,
      failed: errors.length,
      errors,
    };
  }

  async bulkHardDelete(
    employerIds: string[],
    userId: string
  ): Promise<{ success: number; failed: number; errors: any[]; projectsDeleted: number }> {
    const errors: any[] = [];
    let successCount = 0;
    let projectsDeleted = 0;

    for (const employerId of employerIds) {
      try {
        // Hard delete employer and cascade to projects
        const result = await EmployerDeleteOperation.hardDelete(employerId, userId);
        projectsDeleted += result.projectsDeleted;
        successCount++;
      } catch (error) {
        errors.push({
          employer_id: employerId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: successCount,
      failed: errors.length,
      errors,
      projectsDeleted,
    };
  }
}

export default new EmployerService();
