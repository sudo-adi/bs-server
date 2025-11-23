import type {
  Document,
  CreateDocumentDto,
  UpdateDocumentDto,
  VerifyDocumentDto,
} from '@/models/profiles/document.model';
import { DocumentCreateOperation } from './operations/document-create.operation';
import { DocumentDeleteOperation } from './operations/document-delete.operation';
import { DocumentUpdateOperation } from './operations/document-update.operation';
import { DocumentVerifyOperation } from './operations/document-verify.operation';
import { DocumentQuery } from './queries/document.query';

export class DocumentService {
  async getProfileDocuments(profileId: string): Promise<Document[]> {
    return DocumentQuery.getProfileDocuments(profileId);
  }

  async createDocument(data: CreateDocumentDto): Promise<Document> {
    return DocumentCreateOperation.create(data);
  }

  async updateDocument(id: string, data: UpdateDocumentDto): Promise<Document> {
    return DocumentUpdateOperation.update(id, data);
  }

  async verifyDocument(id: string, data: VerifyDocumentDto): Promise<Document> {
    return DocumentVerifyOperation.verify(id, data);
  }

  async deleteDocument(id: string): Promise<void> {
    return DocumentDeleteOperation.delete(id);
  }
}

export default new DocumentService();
