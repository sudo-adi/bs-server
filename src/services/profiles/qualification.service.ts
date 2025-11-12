import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type {
  Qualification,
  CreateQualificationDto,
  UpdateQualificationDto,
  VerifyQualificationDto,
} from '@/models/profiles/qualification.model';

export class QualificationService {
  async getProfileQualifications(profileId: string): Promise<Qualification[]> {
    const qualifications = await prisma.qualifications.findMany({
      where: { profile_id: profileId },
      orderBy: { year_of_completion: 'desc' },
      include: {
        profiles: true,
      },
    });

    return qualifications;
  }

  async createQualification(data: CreateQualificationDto): Promise<Qualification> {
    const qualification = await prisma.qualifications.create({
      data: {
        profile_id: data.profile_id,
        qualification_type_id: data.qualification_type_id,
        institution_name: data.institution_name,
        field_of_study: data.field_of_study,
        year_of_completion: data.year_of_completion,
        percentage_or_grade: data.percentage_or_grade,
        // Note: certificate_url removed - use documents table for certificates
      },
      include: {
        profiles: true,
        qualification_types: true,
      },
    });

    return qualification;
  }

  async updateQualification(id: string, data: UpdateQualificationDto): Promise<Qualification> {
    // Check if qualification exists
    const existingQualification = await prisma.qualifications.findUnique({
      where: { id },
    });

    if (!existingQualification) {
      throw new AppError('Qualification not found', 404);
    }

    // Build update data object
    const updateData: any = {};

    if (data.qualification_type_id !== undefined) updateData.qualification_type_id = data.qualification_type_id;
    if (data.institution_name !== undefined) updateData.institution_name = data.institution_name;
    if (data.field_of_study !== undefined) updateData.field_of_study = data.field_of_study;
    if (data.year_of_completion !== undefined) updateData.year_of_completion = data.year_of_completion;
    if (data.percentage_or_grade !== undefined) updateData.percentage_or_grade = data.percentage_or_grade;
    // Note: certificate_url removed - use documents table for certificates

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

  async verifyQualification(id: string, data: VerifyQualificationDto): Promise<Qualification> {
    // Check if qualification exists
    const existingQualification = await prisma.qualifications.findUnique({
      where: { id },
    });

    if (!existingQualification) {
      throw new AppError('Qualification not found', 404);
    }

    const qualification = await prisma.qualifications.update({
      where: { id },
      data: {
        verified_by_user_id: data.verified_by_user_id,
        verified_at: new Date(),
      },
      include: {
        profiles: true,
      },
    });

    return qualification;
  }

  async deleteQualification(id: string): Promise<void> {
    // Check if qualification exists
    const existingQualification = await prisma.qualifications.findUnique({
      where: { id },
    });

    if (!existingQualification) {
      throw new AppError('Qualification not found', 404);
    }

    await prisma.qualifications.delete({
      where: { id },
    });
  }
}

export default new QualificationService();
