import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { WorkerTrainingDto, WorkerTrainingsQueryDto, WorkerTrainingsResponseDto } from '@/dtos/worker/worker.dto';

export class WorkerTrainingsQuery {
  /**
   * Get worker's training enrollments
   */
  static async execute(
    profileId: string,
    query: WorkerTrainingsQueryDto = {}
  ): Promise<WorkerTrainingsResponseDto> {
    try {
      const { status = 'all' } = query;

      // Build where clause based on status filter
      const whereClause: any = {
        profileId,
      };

      if (status !== 'all') {
        whereClause.status = status;
      }

      const enrollments = await prisma.trainingBatchEnrollment.findMany({
        where: whereClause,
        include: {
          batch: {
            select: {
              id: true,
              code: true,
              name: true,
              programName: true,
              provider: true,
              location: true,
              startDate: true,
              endDate: true,
              shift: true,
              status: true,
            },
          },
        },
        orderBy: [{ enrollmentDate: 'desc' }],
      });

      // Filter out enrollments with no batch
      const validEnrollments = enrollments.filter((e) => e.batch !== null);

      // Get trainer info for each batch
      const batchIds = [...new Set(validEnrollments.map((e) => e.batch!.id))];
      const trainers = await prisma.trainingBatchTrainer.findMany({
        where: { trainingBatchId: { in: batchIds } },
        include: {
          trainerProfile: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });
      const trainerMap = new Map(trainers.map((t) => [t.trainingBatchId, t.trainerProfile]));

      // Get certificates for this profile
      const certificates = await prisma.profileTrainingCertificate.findMany({
        where: {
          profileId,
          trainingBatchId: { in: batchIds },
        },
        select: {
          id: true,
          trainingBatchId: true,
          certificateNumber: true,
          certificateFileUrl: true,
          issuedDate: true,
        },
      });
      const certMap = new Map(certificates.map((c) => [c.trainingBatchId, c]));

      const trainings: WorkerTrainingDto[] = validEnrollments.map((enrollment) => {
        const trainer = trainerMap.get(enrollment.batch!.id);
        const cert = certMap.get(enrollment.batch!.id);

        return {
          enrollmentId: enrollment.id,
          batch: {
            id: enrollment.batch!.id,
            code: enrollment.batch!.code,
            name: enrollment.batch!.name,
            programName: enrollment.batch!.programName,
            provider: enrollment.batch!.provider,
            location: enrollment.batch!.location,
            startDate: enrollment.batch!.startDate,
            endDate: enrollment.batch!.endDate,
            shift: enrollment.batch!.shift,
            status: enrollment.batch!.status,
          },
          enrollment: {
            status: enrollment.status,
            enrollmentDate: enrollment.enrollmentDate,
            actualStartDate: enrollment.actualStartDate,
            completionDate: enrollment.completionDate,
          },
          trainer: trainer
            ? {
                firstName: trainer.firstName,
                lastName: trainer.lastName,
                phone: trainer.phone,
              }
            : null,
          certificate: cert
            ? {
                id: cert.id,
                certificateNumber: cert.certificateNumber,
                certificateFileUrl: cert.certificateFileUrl,
                issuedDate: cert.issuedDate,
              }
            : null,
        };
      });

      return {
        trainings,
        total: trainings.length,
      };
    } catch (error) {
      logger.error('Error fetching worker trainings', { error, profileId });
      throw new Error('Failed to fetch worker trainings');
    }
  }
}
