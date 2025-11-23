import prisma from '@/config/prisma';
import type { Qualification, CreateQualificationDto } from '@/models/profiles/qualification.model';

export class QualificationCreateOperation {
  static async create(data: CreateQualificationDto): Promise<Qualification> {
    const qualification = await prisma.qualifications.create({
      data: {
        profile_id: data.profile_id,
        qualification_type_id: data.qualification_type_id,
        institution_name: data.institution_name,
        field_of_study: data.field_of_study,
        year_of_completion: data.year_of_completion,
        percentage_or_grade: data.percentage_or_grade,
      },
      include: {
        profiles: true,
        qualification_types: true,
      },
    });

    return qualification;
  }
}
