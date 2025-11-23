import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class DocumentDeleteOperation {
  static async delete(id: string): Promise<void> {
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
