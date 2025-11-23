import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { Document, VerifyDocumentDto } from '@/models/profiles/document.model';
import { VerificationStatus, VERIFICATION_STATUSES } from '@/types/enums';

export class DocumentVerifyOperation {
  static async verify(id: string, data: VerifyDocumentDto): Promise<Document> {
    const existingDocument = await prisma.documents.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      throw new AppError('Document not found', 404);
    }

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
}
