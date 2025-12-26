import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { CODE_ENTITY_TYPES } from '@/constants/codes';
import { EmployerResponseDto, VerifyEmployerRequest } from '@/dtos/employer/employer.dto';
import codeManagerService from '@/services/code/codeManager.service';
import { getEmployerOrThrow } from '../helpers/employer-lookup.helper';
import { toEmployerResponse } from '../helpers/response-mapper.helper';
import { createStatusHistoryEntry } from '../helpers/status-history.helper';

/**
 * Verify employer
 * On verification, generates the employer code (BSE-XXXXX) using CodeManagerService
 */
export async function verifyEmployer(
  id: string,
  request: VerifyEmployerRequest,
  verifiedByProfileId: string
): Promise<EmployerResponseDto> {
  try {
    const employer = await getEmployerOrThrow(id);

    if (employer.isVerified) {
      throw new Error('Employer is already verified');
    }

    const employerCode = await codeManagerService.generateNextCode(CODE_ENTITY_TYPES.EMPLOYER);

    const updatedEmployer = await prisma.employer.update({
      where: { id },
      data: {
        employerCode,
        isVerified: true,
        verifiedAt: new Date(),
        verifiedByProfileId,
        status: 'verified',
      },
    });

    await createStatusHistoryEntry(
      id,
      employer.status || 'pending',
      'verified',
      verifiedByProfileId,
      request.reason || 'Employer verified',
      request.metadata
    );

    logger.info('Employer verified and code assigned', {
      id,
      employerCode,
      verifiedByProfileId,
    });

    return toEmployerResponse(updatedEmployer) as EmployerResponseDto;
  } catch (error: any) {
    logger.error('Error verifying employer', { error, id });
    throw new Error(error.message || 'Failed to verify employer');
  }
}

/**
 * Reject employer
 */
export async function rejectEmployer(
  id: string,
  reason: string | undefined,
  rejectedByProfileId: string
): Promise<EmployerResponseDto> {
  try {
    const employer = await getEmployerOrThrow(id);

    const updatedEmployer = await prisma.employer.update({
      where: { id },
      data: {
        isVerified: false,
        status: 'rejected',
      },
    });

    await createStatusHistoryEntry(
      id,
      employer.status || 'pending',
      'rejected',
      rejectedByProfileId,
      reason || 'Employer rejected'
    );

    logger.info('Employer rejected', { id, rejectedByProfileId });

    return toEmployerResponse(updatedEmployer) as EmployerResponseDto;
  } catch (error: any) {
    logger.error('Error rejecting employer', { error, id });
    throw new Error(error.message || 'Failed to reject employer');
  }
}
