import prisma from '@/config/prisma';
import type { Document } from '@/models/profiles/document.model';

export class DocumentQuery {
  static async getProfileDocuments(profileId: string): Promise<Document[]> {
    const documents = await prisma.documents.findMany({
      where: { profile_id: profileId },
      orderBy: { uploaded_at: 'desc' },
      include: {
        profiles: true,
      },
    });

    return documents;
  }
}
