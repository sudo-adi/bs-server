import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { Document, UpdateDocumentDto } from '@/types';
import { VerificationStatus, VERIFICATION_STATUSES } from '@/types/enums';

export class DocumentUpdateOperation {
  static async update(id: string, data: UpdateDocumentDto): Promise<Document> {
    const existingDocument = await prisma.documents.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      throw new AppError('Document not found', 404);
    }

    const updateData: any = {};

    if (data.document_category_id !== undefined) updateData.document_category_id = data.document_category_id;
    if (data.document_number !== undefined) updateData.document_number = data.document_number;
    if (data.file_name !== undefined) updateData.file_name = data.file_name;
    if (data.file_url !== undefined) updateData.file_url = data.file_url;
    if (data.file_size !== undefined) updateData.file_size = data.file_size;
    if (data.verification_status !== undefined) {
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
}
