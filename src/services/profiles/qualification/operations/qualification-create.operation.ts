import prisma from '@/config/prisma';
import type { Qualification, CreateQualificationDto } from '@/types';
import { cleanUuid } from '@/utils/uuidHelper';
import { AppError } from '@/middlewares/errorHandler';

export class QualificationCreateOperation {
  static async create(data: CreateQualificationDto): Promise<Qualification> {
    // Clean up data - convert empty strings to null for optional UUID fields
    const cleanData = {
      profile_id: data.profile_id,
      qualification_type_id: cleanUuid(data.qualification_type_id),
      institution_name: data.institution_name,
      field_of_study: data.field_of_study,
      year_of_completion: data.year_of_completion,
      percentage_or_grade: data.percentage_or_grade,
    };

    // Validate qualification_type_id exists and is active
    if (cleanData.qualification_type_id) {
      const qualificationType = await prisma.qualification_types.findFirst({
        where: {
          id: cleanData.qualification_type_id,
          is_active: true,
        },
      });

      if (!qualificationType) {
        throw new AppError(
          'Invalid qualification type. Please select a valid qualification type from the system.',
          400
        );
      }
    }

    const qualification = await prisma.qualifications.create({
      data: cleanData,
      include: {
        profiles: true,
        qualification_types: true,
      },
    });

    return qualification;
  }
}
