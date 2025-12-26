import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { CODE_ENTITY_TYPES } from '@/constants/codes';
import { PROFILE_STAGES } from '@/constants/stages';
import { ConvertToWorkerDto, ProfileDto } from '@/dtos/profile/profile.dto';
import codeManagerService from '@/services/code/codeManager.service';

export class StageConvertWorkerOperation {
  static async execute(id: string, request: ConvertToWorkerDto): Promise<ProfileDto> {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id, deletedAt: null },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      if (!profile.candidateApprovedAt) {
        throw new Error('Profile must be approved as candidate first');
      }

      if (profile.workerConvertedAt) {
        throw new Error('Already converted to worker');
      }

      // Generate worker code using Code Manager Service if not provided
      let workerCode = request.workerCode;
      if (!workerCode) {
        workerCode = await codeManagerService.generateNextCode(CODE_ENTITY_TYPES.WORKER);
      }

      const updatedProfile = await prisma.profile.update({
        where: { id },
        data: {
          workerCode,
          profileType: 'worker',
          workerConvertedAt: new Date(),
          workerCodeAssignedAt: new Date(),
          currentStage: PROFILE_STAGES.BENCHED,
        },
      });

      await prisma.profileStageHistory.create({
        data: {
          profileId: id,
          previousStage: profile.currentStage || 'candidate_approved',
          newStage: PROFILE_STAGES.BENCHED,
          changedByProfileId: id,
          changedAt: new Date(),
          reason: 'Converted to worker - default stage: benched',
          metadata: { workerCode },
        },
      });

      logger.info('Candidate converted to worker', { id, workerCode });

      const { passwordHash, ...profileWithoutPassword } = updatedProfile;
      return profileWithoutPassword as ProfileDto;
    } catch (error: any) {
      logger.error('Error converting to worker', { error, id });
      throw new Error(error.message || 'Failed to convert to worker');
    }
  }
}
