import prisma from '@/config/prisma';
import type { Document, CreateDocumentDto } from '@/types';
import { VerificationStatus } from '@/types/enums';

export class DocumentCreateOperation {
  static async create(data: CreateDocumentDto): Promise<Document> {
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
        verification_status: VerificationStatus.PENDING,
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
}
