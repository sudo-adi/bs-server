import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type {
  Document,
  CreateDocumentDto,
  UpdateDocumentDto,
  VerifyDocumentDto,
} from '@/models/profiles/document.model';
import {
  VerificationStatus,
  VERIFICATION_STATUSES,
} from '@/types/enums';

export class DocumentService {
  async getProfileDocuments(profileId: string): Promise<Document[]> {
    const documents = await prisma.documents.findMany({
      where: { profile_id: profileId },
      orderBy: { uploaded_at: 'desc' },
      include: {
        profiles: true,
      },
    });

    return documents;
  }

  async createDocument(data: CreateDocumentDto): Promise<Document> {
    const document = await prisma.documents.create({
      data: {
        profile_id: data.profile_id,
        document_category_id: data.document_category_id,
        qualification_id: data.qualification_id,
        batch_enrollment_id: data.batch_enrollment_id,
        document_number: data.document_number,
        file_name: data.file_name,
        file_url: data.file_url,
        file_size: data.file_size,
        uploaded_by_user_id: data.uploaded_by_user_id,
        expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
        verification_status: VerificationStatus.PENDING, // Always pending when created
      },
      include: {
        profiles: true,
        document_categories: true,
        qualifications: true,
        batch_enrollments: true,
      },
    });

    return document;
  }

  async updateDocument(id: string, data: UpdateDocumentDto): Promise<Document> {
    // Check if document exists
    const existingDocument = await prisma.documents.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      throw new AppError('Document not found', 404);
    }

    // Build update data object
    const updateData: any = {};

    if (data.document_category_id !== undefined) updateData.document_category_id = data.document_category_id;
    if (data.document_number !== undefined) updateData.document_number = data.document_number;
    if (data.file_name !== undefined) updateData.file_name = data.file_name;
    if (data.file_url !== undefined) updateData.file_url = data.file_url;
    if (data.file_size !== undefined) updateData.file_size = data.file_size;
    if (data.verification_status !== undefined) {
      // Validate verification_status
      if (!VERIFICATION_STATUSES.includes(data.verification_status as VerificationStatus)) {
        throw new AppError(
          `Invalid verification_status: ${data.verification_status}. Must be one of: ${VERIFICATION_STATUSES.join(', ')}`,
          400
        );
      }
      updateData.verification_status = data.verification_status;
    }
    if (data.verified_at !== undefined) updateData.verified_at = data.verified_at;
    if (data.verified_by_user_id !== undefined) updateData.verified_by_user_id = data.verified_by_user_id;
    if (data.expiry_date !== undefined) {
      updateData.expiry_date = data.expiry_date ? new Date(data.expiry_date) : null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const document = await prisma.documents.update({
      where: { id },
      data: updateData,
      include: {
        profiles: true,
      },
    });

    return document;
  }

  async verifyDocument(id: string, data: VerifyDocumentDto): Promise<Document> {
    // Check if document exists
    const existingDocument = await prisma.documents.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      throw new AppError('Document not found', 404);
    }

    // Validate verification_status
    if (!VERIFICATION_STATUSES.includes(data.verification_status as VerificationStatus)) {
      throw new AppError(
        `Invalid verification_status: ${data.verification_status}. Must be one of: ${VERIFICATION_STATUSES.join(', ')}`,
        400
      );
    }

    const document = await prisma.documents.update({
      where: { id },
      data: {
        verification_status: data.verification_status,
        verified_by_user_id: data.verified_by_user_id,
        verified_at: new Date(),
      },
      include: {
        profiles: true,
      },
    });

    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    // Check if document exists
    const existingDocument = await prisma.documents.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      throw new AppError('Document not found', 404);
    }

    await prisma.documents.delete({
      where: { id },
    });
  }
}

export default new DocumentService();
