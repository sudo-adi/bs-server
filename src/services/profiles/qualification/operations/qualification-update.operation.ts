import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { Qualification, UpdateQualificationDto } from '@/models/profiles/qualification.model';

export class QualificationUpdateOperation {
  static async update(id: string, data: UpdateQualificationDto): Promise<Qualification> {
    const existingQualification = await prisma.qualifications.findUnique({
      where: { id },
    });

    if (!existingQualification) {
      throw new AppError('Qualification not found', 404);
    }

    const updateData: any = {};

    if (data.qualification_type_id !== undefined) updateData.qualification_type_id = data.qualification_type_id;
    if (data.institution_name !== undefined) updateData.institution_name = data.institution_name;
    if (data.field_of_study !== undefined) updateData.field_of_study = data.field_of_study;
    if (data.year_of_completion !== undefined) updateData.year_of_completion = data.year_of_completion;
    if (data.percentage_or_grade !== undefined) updateData.percentage_or_grade = data.percentage_or_grade;

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const qualification = await prisma.qualifications.update({
      where: { id },
      data: updateData,
      include: {
        profiles: true,
      },
    });

    return qualification;
  }
}
