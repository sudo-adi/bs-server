import type { employer_authorized_persons } from '@/generated/prisma';
import {
  CreateEmployerAuthorizedPersonDto,
  UpdateEmployerAuthorizedPersonDto,
} from '@/models/employers/employer.model';
import { AuthorizedPersonCreateOperation } from './operations/authorized-person-create.operation';
import { AuthorizedPersonDeleteOperation } from './operations/authorized-person-delete.operation';
import { AuthorizedPersonUpdateOperation } from './operations/authorized-person-update.operation';
import { AuthorizedPersonQuery } from './queries/authorized-person.query';

export class EmployerAuthorizedPersonService {
  // ============================================================================
  // QUERIES
  // ============================================================================

  async getAllByEmployerId(employerId: string): Promise<employer_authorized_persons[]> {
    return AuthorizedPersonQuery.getAllByEmployerId(employerId);
  }

  async getById(id: string): Promise<employer_authorized_persons> {
    return AuthorizedPersonQuery.getById(id);
  }

  // ============================================================================
  // CREATE, UPDATE, DELETE OPERATIONS
  // ============================================================================

  async create(data: CreateEmployerAuthorizedPersonDto): Promise<employer_authorized_persons> {
    return AuthorizedPersonCreateOperation.create(data);
  }

  async update(
    id: string,
    data: UpdateEmployerAuthorizedPersonDto
  ): Promise<employer_authorized_persons> {
    return AuthorizedPersonUpdateOperation.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return AuthorizedPersonDeleteOperation.delete(id);
  }
}

export default new EmployerAuthorizedPersonService();
