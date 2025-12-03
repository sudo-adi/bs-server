import prisma from '@/config/prisma';

export class QualificationTypeService {
  /**
   * Get all qualification types
   */
  async getAllQualificationTypes(activeOnly = false) {
    const where = activeOnly ? { is_active: true } : {};

    const qualificationTypes = await prisma.qualification_types.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return qualificationTypes;
  }

  /**
   * Get qualification type by ID
   */
  async getQualificationTypeById(id: string) {
    const qualificationType = await prisma.qualification_types.findUnique({
      where: { id },
    });

    return qualificationType;
  }
}

export default new QualificationTypeService();
