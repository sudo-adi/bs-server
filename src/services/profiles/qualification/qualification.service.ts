import type {
  CreateQualificationDto,
  Qualification,
  UpdateQualificationDto,
  VerifyQualificationDto,
} from '@/types';
import { QualificationCreateOperation } from './operations/qualification-create.operation';
import { QualificationDeleteOperation } from './operations/qualification-delete.operation';
import { QualificationUpdateOperation } from './operations/qualification-update.operation';
import { QualificationVerifyOperation } from './operations/qualification-verify.operation';
import { QualificationQuery } from './queries/qualification.query';

export class QualificationService {
  async getProfileQualifications(profileId: string): Promise<Qualification[]> {
    return QualificationQuery.getProfileQualifications(profileId);
  }

  async createQualification(data: CreateQualificationDto): Promise<Qualification> {
    return QualificationCreateOperation.create(data);
  }

  async updateQualification(id: string, data: UpdateQualificationDto): Promise<Qualification> {
    return QualificationUpdateOperation.update(id, data);
  }

  async verifyQualification(id: string, data: VerifyQualificationDto): Promise<Qualification> {
    return QualificationVerifyOperation.verify(id, data);
  }

  async deleteQualification(id: string): Promise<void> {
    return QualificationDeleteOperation.delete(id);
  }
}

export default new QualificationService();
