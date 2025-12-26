import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ENROLLMENT_STATUSES, PROFILE_STAGES } from '@/constants/stages';
import {
  AssignTrainerRequest,
  CompleteEnrollmentRequest,
  CreateEnrollmentRequest,
  CreateTrainingBatchRequest,
  DropEnrollmentRequest,
  TrainingBatchDetailDto,
  TrainingBatchListDto,
  TrainingBatchListQuery,
  UpdateEnrollmentRequest,
  UpdateTrainingBatchRequest,
} from '@/dtos/training/trainingBatch.dto';
import { Prisma } from '@/generated/prisma';
import { generateUuid } from '@/utils/uuidHelper';
import {
  checkWorkerAvailability,
  logAvailabilityEvent,
  removeAvailabilityEvent,
} from '@/utils/workerAvailability';

export class TrainingBatchService {
  async getAllBatches(query: TrainingBatchListQuery): Promise<{
    data: TrainingBatchListDto[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, search, status, provider } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TrainingBatchWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { programName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (provider) where.provider = { contains: provider, mode: 'insensitive' };

    const [batchesRaw, total] = await Promise.all([
      prisma.trainingBatch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          name: true,
          programName: true,
          provider: true,
          startDate: true,
          endDate: true,
          durationDays: true,
          maxCapacity: true,
          status: true,
          location: true,
          shift: true,
          createdAt: true,
          _count: { select: { enrollments: true } },
          trainers: {
            take: 1,
            include: {
              trainerProfile: {
                select: { id: true, firstName: true, lastName: true, phone: true, candidateCode: true },
              },
            },
          },
        },
      }),
      prisma.trainingBatch.count({ where }),
    ]);

    // Flatten the response to match frontend expectations
    const batches = batchesRaw.map((batch) => {
      const primaryTrainer = batch.trainers?.[0];
      const trainerData = primaryTrainer?.trainerProfile
        ? {
            id: primaryTrainer.trainerProfile.id,
            name:
              `${primaryTrainer.trainerProfile.firstName || ''} ${primaryTrainer.trainerProfile.lastName || ''}`.trim() ||
              null,
            phone: primaryTrainer.trainerProfile.phone || null,
            employeeCode: primaryTrainer.trainerProfile.candidateCode || null,
            shift: primaryTrainer.shift || null,
          }
        : null;

      const { trainers: _trainers, _count, ...rest } = batch;
      return {
        ...rest,
        enrolledCount: _count.enrollments,
        trainers: trainerData,
      };
    });

    return {
      data: batches,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getBatchById(id: string): Promise<TrainingBatchDetailDto | null> {
    const batch = await prisma.trainingBatch.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            profile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                candidateCode: true,
                workerCode: true,
              },
            },
          },
          orderBy: { enrollmentDate: 'desc' },
        },
        trainers: {
          include: {
            trainerProfile: {
              select: { id: true, firstName: true, lastName: true, phone: true, candidateCode: true },
            },
          },
        },
        createdByProfile: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { enrollments: true } },
      },
    });

    if (!batch) return null;

    // Flatten the trainers array to a single trainer object (or null)
    const primaryTrainer = batch.trainers?.[0];
    const trainerData = primaryTrainer?.trainerProfile
      ? {
          id: primaryTrainer.trainerProfile.id,
          name: `${primaryTrainer.trainerProfile.firstName || ''} ${primaryTrainer.trainerProfile.lastName || ''}`.trim() || null,
          email: null, // Email not included in select
          phone: primaryTrainer.trainerProfile.phone || null,
          employeeCode: primaryTrainer.trainerProfile.candidateCode || null,
          shift: primaryTrainer.shift || null,
        }
      : null;

    // Remove original trainers array and add flattened version
    const { trainers: _originalTrainers, ...batchWithoutTrainers } = batch;

    return {
      ...batchWithoutTrainers,
      trainers: trainerData,
    } as TrainingBatchDetailDto;
  }

  async createBatch(data: CreateTrainingBatchRequest, createdByProfileId?: string): Promise<any> {
    // Extract trainer_id before creating batch (it's not a column on the table)
    const trainerId = data.trainer_id;

    // Normalize snake_case to camelCase for Prisma
    const normalizedData = {
      name: data.name,
      code: data.code,
      programName: data.programName || data.program_name,
      provider: data.provider,
      startDate: data.startDate || (data.start_date ? new Date(data.start_date) : undefined),
      endDate: data.endDate || (data.end_date ? new Date(data.end_date) : undefined),
      durationDays: data.durationDays,
      maxCapacity: data.maxCapacity || data.max_capacity,
      status: data.status || 'upcoming',
      location: data.location,
      description: data.description,
      shift: data.shift,
    };

    let code = normalizedData.code;
    if (!code) {
      const lastBatch = await prisma.trainingBatch.findFirst({
        where: { code: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { code: true },
      });
      const lastNumber = lastBatch?.code ? parseInt(lastBatch.code.replace(/\D/g, '')) || 0 : 0;
      code = `BST${String(lastNumber + 1).padStart(6, '0')}`;
    }

    // Use transaction to create batch and assign trainer
    const result = await prisma.$transaction(async (tx) => {
      // Create the batch
      const batch = await tx.trainingBatch.create({
        data: {
          id: generateUuid(),
          ...normalizedData,
          code,
          createdByProfileId,
        },
      });

      // If trainer_id provided, create the trainer assignment
      if (trainerId) {
        await tx.trainingBatchTrainer.create({
          data: {
            id: generateUuid(),
            trainingBatchId: batch.id,
            trainerProfileId: trainerId,
            assignedByProfileId: createdByProfileId,
            assignedAt: new Date(),
          },
        });
        logger.info('Trainer assigned to batch', { batchId: batch.id, trainerId });
      }

      return batch;
    });

    logger.info('Training batch created', { id: result.id, code });
    return result;
  }

  async updateBatch(id: string, data: UpdateTrainingBatchRequest): Promise<any> {
    const batch = await prisma.trainingBatch.findUnique({ where: { id } });
    if (!batch) throw new Error('Training batch not found');

    await prisma.trainingBatch.update({ where: { id }, data });
    logger.info('Training batch updated', { id });
    return this.getBatchById(id);
  }

  async deleteBatch(id: string): Promise<void> {
    const batch = await prisma.trainingBatch.findUnique({ where: { id } });
    if (!batch) throw new Error('Training batch not found');

    await prisma.trainingBatch.delete({ where: { id } });
    logger.info('Training batch deleted', { id });
  }

  /**
   * Complete entire batch at once
   * - Updates batch status to 'completed'
   * - Marks all ENROLLED enrollments as COMPLETED
   * - Updates all enrolled profiles to TRAINED stage
   */
  async completeBatch(id: string, completedByProfileId?: string): Promise<any> {
    const batch = await prisma.trainingBatch.findUnique({
      where: { id },
      include: {
        enrollments: {
          where: { status: ENROLLMENT_STATUSES.ENROLLED },
          include: { profile: true },
        },
      },
    });

    if (!batch) throw new Error('Training batch not found');

    if (batch.status === 'completed') {
      throw new Error('Training batch is already completed');
    }

    const now = new Date();
    const completedEnrollments: string[] = [];
    const updatedProfiles: string[] = [];

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Update all ENROLLED enrollments to COMPLETED
      for (const enrollment of batch.enrollments) {
        await tx.trainingBatchEnrollment.update({
          where: { id: enrollment.id },
          data: {
            status: ENROLLMENT_STATUSES.COMPLETED,
            completionDate: now,
            actualEndDate: now,
          },
        });
        completedEnrollments.push(enrollment.id);

        // 2. Update profile stage to TRAINED
        if (enrollment.profileId) {
          await tx.profile.update({
            where: { id: enrollment.profileId },
            data: { currentStage: PROFILE_STAGES.TRAINED },
          });
          updatedProfiles.push(enrollment.profileId);
        }
      }

      // 3. Update batch status to completed
      await tx.trainingBatch.update({
        where: { id },
        data: {
          status: 'completed',
          updatedAt: now,
        },
      });
    });

    logger.info('Training batch completed', {
      batchId: id,
      completedEnrollments: completedEnrollments.length,
      updatedProfiles: updatedProfiles.length,
      completedBy: completedByProfileId,
    });

    return this.getBatchById(id);
  }

  /**
   * Start a training batch
   * - Updates batch status to 'ongoing'
   * - Updates all ENROLLED profiles to IN_TRAINING stage
   */
  async startBatch(id: string): Promise<any> {
    const batch = await prisma.trainingBatch.findUnique({
      where: { id },
      include: {
        enrollments: {
          where: { status: ENROLLMENT_STATUSES.ENROLLED },
          select: { profileId: true },
        },
      },
    });

    if (!batch) throw new Error('Training batch not found');

    if (batch.status === 'ongoing') {
      throw new Error('Training batch is already ongoing');
    }

    if (batch.status === 'completed') {
      throw new Error('Cannot start a completed batch');
    }

    const now = new Date();
    const updatedProfiles: string[] = [];

    await prisma.$transaction(async (tx) => {
      // Update batch status
      await tx.trainingBatch.update({
        where: { id },
        data: {
          status: 'ongoing',
          updatedAt: now,
        },
      });

      // Update all enrolled profiles to IN_TRAINING
      for (const enrollment of batch.enrollments) {
        if (enrollment.profileId) {
          await tx.profile.update({
            where: { id: enrollment.profileId },
            data: { currentStage: PROFILE_STAGES.IN_TRAINING },
          });
          updatedProfiles.push(enrollment.profileId);
        }
      }
    });

    logger.info('Training batch started', {
      batchId: id,
      profilesMovedToInTraining: updatedProfiles.length,
    });
    return this.getBatchById(id);
  }

  // ==================== ENROLLMENTS ====================
  async getEnrollments(batchId: string): Promise<any[]> {
    const batch = await prisma.trainingBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error('Training batch not found');

    return prisma.trainingBatchEnrollment.findMany({
      where: { batchId },
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            candidateCode: true,
            workerCode: true,
          },
        },
        enrolledByProfile: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { enrollmentDate: 'desc' },
    });
  }

  async createEnrollment(
    batchId: string,
    data: CreateEnrollmentRequest,
    enrolledByProfileId?: string
  ): Promise<any> {
    const batch = await prisma.trainingBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error('Training batch not found');

    // Check for duplicate enrollment in same batch
    const existing = await prisma.trainingBatchEnrollment.findFirst({
      where: { batchId, profileId: data.profileId },
    });
    if (existing) throw new Error('Profile is already enrolled in this batch');

    // Business Rule: Check for overlapping projects and training using global availability check
    if (batch.startDate && batch.endDate) {
      const availability = await checkWorkerAvailability(
        data.profileId,
        batch.startDate,
        batch.endDate
      );

      if (!availability.isAvailable) {
        const conflicts = availability.blockingEvents.map((event) => {
          const startStr = event.startDate.toISOString().split('T')[0];
          const endStr = event.endDate.toISOString().split('T')[0];
          return `${event.type}: ${event.entityName} (${startStr} - ${endStr})`;
        });
        throw new Error(
          `Profile has overlapping commitments during training timeline:\n${conflicts.join('\n')}`
        );
      }
    }

    const enrollment = await prisma.trainingBatchEnrollment.create({
      data: {
        batchId,
        profileId: data.profileId,
        enrolledByProfileId,
        enrollmentDate: new Date(),
        status: ENROLLMENT_STATUSES.ENROLLED,
        notes: data.notes,
        isCustomSchedule: data.isCustomSchedule,
        actualStartDate: data.actualStartDate,
        actualEndDate: data.actualEndDate,
      },
      include: { profile: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Update profile stage to TRAINING_SCHEDULED
    await prisma.profile.update({
      where: { id: data.profileId },
      data: { currentStage: PROFILE_STAGES.TRAINING_SCHEDULED },
    });

    // Log availability event for calendar tracking
    if (batch.startDate && batch.endDate) {
      await logAvailabilityEvent(
        data.profileId,
        'TRAINING',
        batchId,
        batch.startDate,
        batch.endDate,
        'ENROLLED'
      );
    }

    logger.info('Enrollment created', { id: enrollment.id, batchId, profileId: data.profileId });
    return enrollment;
  }

  async updateEnrollment(enrollmentId: string, data: UpdateEnrollmentRequest): Promise<any> {
    const enrollment = await prisma.trainingBatchEnrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) throw new Error('Enrollment not found');

    return prisma.trainingBatchEnrollment.update({
      where: { id: enrollmentId },
      data,
      include: { profile: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async completeEnrollment(
    enrollmentId: string,
    data: CompleteEnrollmentRequest,
    completedByProfileId?: string
  ): Promise<any> {
    // Debug logging to catch UUID issues
    logger.info('completeEnrollment called', {
      enrollmentId,
      enrollmentIdType: typeof enrollmentId,
      enrollmentIdLength: enrollmentId?.length,
      enrollmentIdCharCodes: enrollmentId
        ? enrollmentId
            .slice(0, 10)
            .split('')
            .map((c) => c.charCodeAt(0))
        : [],
    });

    const enrollment = await prisma.trainingBatchEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { profile: true },
    });
    if (!enrollment) throw new Error('Enrollment not found');

    const updateData: any = {
      status: ENROLLMENT_STATUSES.COMPLETED,
      completionDate: new Date(),
      notes: data.notes || enrollment.notes,
    };

    if (data.forceComplete) {
      updateData.forceCompletedAt = new Date();
      updateData.forceCompletedByProfileId = completedByProfileId;
      updateData.forceCompletionReason = data.forceCompletionReason;
    }

    const result = await prisma.trainingBatchEnrollment.update({
      where: { id: enrollmentId },
      data: updateData,
      include: { profile: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Update profile stage to trained after completing training
    if (enrollment.profileId) {
      await prisma.profile.update({
        where: { id: enrollment.profileId },
        data: { currentStage: PROFILE_STAGES.TRAINED },
      });

      // Remove/update availability event as training is complete
      if (enrollment.batchId) {
        await removeAvailabilityEvent(enrollment.profileId!, 'TRAINING', enrollment.batchId);
      }

      logger.info('Profile stage updated to trained', { profileId: enrollment.profileId });
    }

    return result;
  }

  async dropEnrollment(enrollmentId: string, data: DropEnrollmentRequest): Promise<any> {
    const enrollment = await prisma.trainingBatchEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { batch: true, profile: true },
    });
    if (!enrollment) throw new Error('Enrollment not found');

    // Auto-calculate droppedBeforeStart if not provided
    let droppedBeforeStart = data.droppedBeforeStart;
    if (droppedBeforeStart === undefined && enrollment.batch?.startDate) {
      droppedBeforeStart = new Date() < enrollment.batch.startDate;
    }

    const result = await prisma.trainingBatchEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: ENROLLMENT_STATUSES.DROPPED,
        dropReason: data.dropReason,
        droppedBeforeStart,
      },
      include: { profile: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Business Rule: If dropped after training starts, track it (stays in history)
    // If dropped before, revert profile to previous stage
    if (enrollment.profileId) {
      // Check if profile has any other active enrollments
      const otherActiveEnrollments = await prisma.trainingBatchEnrollment.findFirst({
        where: {
          profileId: enrollment.profileId,
          id: { not: enrollmentId },
          status: ENROLLMENT_STATUSES.ENROLLED,
        },
      });

      // If no other active enrollments, revert to previous stage
      if (!otherActiveEnrollments) {
        // Determine previous stage based on profile's conversion status
        const profile = enrollment.profile;
        let previousStage: string = PROFILE_STAGES.APPROVED;

        if (profile?.workerConvertedAt) {
          previousStage = PROFILE_STAGES.BENCHED;
        }

        await prisma.profile.update({
          where: { id: enrollment.profileId },
          data: { currentStage: previousStage },
        });
        logger.info('Profile stage reverted after training drop', {
          profileId: enrollment.profileId,
          newStage: previousStage,
          droppedBeforeStart,
        });
      }

      // Remove availability event from calendar
      if (enrollment.batchId) {
        await removeAvailabilityEvent(enrollment.profileId, 'TRAINING', enrollment.batchId);
      }
    }

    return result;
  }

  /**
   * Remove enrollment completely (for UPCOMING batches only)
   * Unlike dropEnrollment, this deletes the enrollment record entirely
   */
  async removeEnrollment(enrollmentId: string): Promise<{ success: boolean; message: string }> {
    const enrollment = await prisma.trainingBatchEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { batch: true, profile: true },
    });
    if (!enrollment) throw new Error('Enrollment not found');

    // Only allow removal for UPCOMING batches
    const batchStatus = enrollment.batch?.status?.toUpperCase();
    if (batchStatus !== 'UPCOMING' && batchStatus !== 'SCHEDULED') {
      throw new Error(
        'Can only remove enrollments from upcoming/scheduled batches. Use drop for ongoing batches.'
      );
    }

    // Revert profile stage if this was their only enrollment
    if (enrollment.profileId) {
      const otherActiveEnrollments = await prisma.trainingBatchEnrollment.findFirst({
        where: {
          profileId: enrollment.profileId,
          id: { not: enrollmentId },
          status: ENROLLMENT_STATUSES.ENROLLED,
        },
      });

      if (!otherActiveEnrollments) {
        const profile = enrollment.profile;
        let previousStage: string = PROFILE_STAGES.APPROVED;
        if (profile?.workerConvertedAt) {
          previousStage = PROFILE_STAGES.BENCHED;
        }

        await prisma.profile.update({
          where: { id: enrollment.profileId },
          data: { currentStage: previousStage },
        });
      }

      // Remove availability event
      if (enrollment.batchId) {
        await removeAvailabilityEvent(enrollment.profileId, 'TRAINING', enrollment.batchId);
      }
    }

    // Delete the enrollment record completely
    await prisma.trainingBatchEnrollment.delete({
      where: { id: enrollmentId },
    });

    logger.info('Enrollment removed from batch', {
      enrollmentId,
      batchId: enrollment.batchId,
      profileId: enrollment.profileId,
    });

    return { success: true, message: 'Enrollment removed successfully' };
  }

  // ==================== ELIGIBLE PROFILES ====================
  /**
   * Get profiles eligible for enrollment in a training batch
   * Criteria:
   * - Stage is APPROVED (candidates with BSC code)
   * - Has a candidate_code (BSC code assigned)
   * - NOT already enrolled in any UPCOMING or ONGOING training batch
   */
  async getEligibleProfiles(batchId: string, search?: string): Promise<any[]> {
    // First verify the batch exists
    const batch = await prisma.trainingBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error('Training batch not found');

    // Get profile IDs already enrolled in any active (UPCOMING/ONGOING) batch
    const activeEnrollments = await prisma.trainingBatchEnrollment.findMany({
      where: {
        status: ENROLLMENT_STATUSES.ENROLLED,
        batch: {
          status: { in: ['UPCOMING', 'ONGOING'] },
        },
      },
      select: { profileId: true },
    });

    const enrolledProfileIds = activeEnrollments
      .map((e) => e.profileId)
      .filter((id): id is string => id !== null);

    // Build query for eligible profiles
    const where: Prisma.ProfileWhereInput = {
      currentStage: PROFILE_STAGES.APPROVED,
      candidateCode: { not: null }, // Must have BSC code
      isActive: true,
      id: enrolledProfileIds.length > 0 ? { notIn: enrolledProfileIds } : undefined,
    };

    // Add search filter if provided
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { candidateCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const profiles = await prisma.profile.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        candidateCode: true,
        currentStage: true,
        profilePhotoURL: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: 500, // Reasonable limit
    });

    logger.info('Fetched eligible profiles for enrollment', {
      batchId,
      totalEligible: profiles.length,
      excludedCount: enrolledProfileIds.length,
    });

    return profiles;
  }

  // ==================== TRAINERS ====================
  async getTrainers(batchId: string): Promise<any[]> {
    const batch = await prisma.trainingBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error('Training batch not found');

    const assignments = await prisma.trainingBatchTrainer.findMany({
      where: { trainingBatchId: batchId },
      include: {
        trainerProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            workerCode: true,
            candidateCode: true,
            profilePhotoURL: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        assignedByProfile: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { shift: 'asc' },
    });

    return assignments.map((a) => ({
      id: a.id,
      shift: a.shift,
      assignedAt: a.assignedAt,
      trainer: {
        id: a.trainerProfile?.id,
        name: `${a.trainerProfile?.firstName || ''} ${a.trainerProfile?.lastName || ''}`.trim(),
        firstName: a.trainerProfile?.firstName,
        lastName: a.trainerProfile?.lastName,
        workerCode: a.trainerProfile?.workerCode || a.trainerProfile?.candidateCode,
        phone: a.trainerProfile?.phone,
        email: a.trainerProfile?.email,
        profilePhotoUrl: a.trainerProfile?.profilePhotoURL,
        dateOfBirth: a.trainerProfile?.dateOfBirth,
        gender: a.trainerProfile?.gender,
      },
      assignedBy: a.assignedByProfile
        ? {
            id: a.assignedByProfile.id,
            name: `${a.assignedByProfile.firstName || ''} ${a.assignedByProfile.lastName || ''}`.trim(),
          }
        : null,
    }));
  }

  async assignTrainer(
    batchId: string,
    data: AssignTrainerRequest,
    assignedByProfileId?: string
  ): Promise<any> {
    const batch = await prisma.trainingBatch.findUnique({
      where: { id: batchId },
      select: { id: true, code: true, name: true, startDate: true, endDate: true, status: true },
    });
    if (!batch) throw new Error('Training batch not found');

    // Check if trainer profile is valid
    const profile = await prisma.profile.findUnique({
      where: { id: data.trainerProfileId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, workerType: true },
    });
    if (!profile) throw new Error('Trainer profile not found');
    if (profile.workerType !== 'trainer') throw new Error('Profile is not a trainer');

    // Check if this shift is already assigned
    const existingShiftAssignment = await prisma.trainingBatchTrainer.findFirst({
      where: { trainingBatchId: batchId, shift: data.shift },
      include: { trainerProfile: { select: { firstName: true, lastName: true } } },
    });

    if (existingShiftAssignment) {
      const trainerName =
        `${existingShiftAssignment.trainerProfile?.firstName || ''} ${existingShiftAssignment.trainerProfile?.lastName || ''}`.trim();
      throw new Error(
        `${data.shift === 'shift_1' ? 'Shift 1' : 'Shift 2'} is already assigned to ${trainerName}`
      );
    }

    // Check for timeline conflicts for this trainer on the same shift
    const conflictingAssignments = await prisma.trainingBatchTrainer.findMany({
      where: {
        trainerProfileId: data.trainerProfileId,
        shift: data.shift,
        trainingBatch: { status: { in: ['ongoing', 'upcoming', 'scheduled'] } },
      },
      include: { trainingBatch: { select: { id: true, code: true, name: true, startDate: true, endDate: true } } },
    });

    for (const assignment of conflictingAssignments) {
      const batchStart = batch.startDate;
      const batchEnd = batch.endDate;
      const existingStart = assignment.trainingBatch?.startDate;
      const existingEnd = assignment.trainingBatch?.endDate;

      if (batchStart && batchEnd && existingStart && existingEnd) {
        if (batchStart <= existingEnd && existingStart <= batchEnd) {
          throw new Error(
            `Trainer has a conflicting ${data.shift === 'shift_1' ? 'Shift 1' : 'Shift 2'} assignment with batch "${assignment.trainingBatch?.name}" (${assignment.trainingBatch?.code})`
          );
        }
      }
    }

    const result = await prisma.trainingBatchTrainer.create({
      data: {
        trainingBatchId: batchId,
        trainerProfileId: data.trainerProfileId,
        shift: data.shift,
        assignedByProfileId,
        assignedAt: new Date(),
      },
      include: {
        trainerProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            workerCode: true,
            candidateCode: true,
            phone: true,
            email: true,
            profilePhotoURL: true,
          },
        },
      },
    });

    logger.info('Trainer assigned to batch', {
      batchId,
      trainerId: data.trainerProfileId,
      shift: data.shift,
    });

    return {
      id: result.id,
      shift: result.shift,
      assignedAt: result.assignedAt,
      trainer: {
        id: result.trainerProfile?.id,
        name: `${result.trainerProfile?.firstName || ''} ${result.trainerProfile?.lastName || ''}`.trim(),
        workerCode: result.trainerProfile?.workerCode || result.trainerProfile?.candidateCode,
        phone: result.trainerProfile?.phone,
        email: result.trainerProfile?.email,
        profilePhotoUrl: result.trainerProfile?.profilePhotoURL,
      },
    };
  }

  async removeTrainer(batchId: string, trainerId: string, shift?: string): Promise<void> {
    const where: any = {
      trainingBatchId: batchId,
      trainerProfileId: trainerId,
    };

    if (shift) {
      where.shift = shift;
    }

    const assignment = await prisma.trainingBatchTrainer.findFirst({ where });
    if (!assignment) throw new Error('Trainer assignment not found');

    await prisma.trainingBatchTrainer.delete({ where: { id: assignment.id } });
    logger.info('Trainer removed from batch', { batchId, trainerId, shift: assignment.shift });
  }

  // ==================== BULK ENROLLMENT ====================
  /**
   * Enroll multiple candidates in a training batch at once
   * Returns results for each profile (success/failure with reason)
   */
  async bulkEnrollment(
    batchId: string,
    profileIds: string[],
    enrolledByProfileId?: string
  ): Promise<{
    totalRequested: number;
    successCount: number;
    failureCount: number;
    results: Array<{
      profileId: string;
      success: boolean;
      enrollmentId?: string;
      error?: string;
    }>;
  }> {
    const batch = await prisma.trainingBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error('Training batch not found');

    if (batch.status === 'completed') {
      throw new Error('Cannot enroll in a completed batch');
    }

    const results: Array<{
      profileId: string;
      success: boolean;
      enrollmentId?: string;
      error?: string;
    }> = [];

    let successCount = 0;
    let failureCount = 0;

    for (const profileId of profileIds) {
      try {
        // Check if profile exists
        const profile = await prisma.profile.findUnique({
          where: { id: profileId },
          select: { id: true, currentStage: true, candidateCode: true, isActive: true },
        });

        if (!profile) {
          results.push({ profileId, success: false, error: 'Profile not found' });
          failureCount++;
          continue;
        }

        if (!profile.isActive) {
          results.push({ profileId, success: false, error: 'Profile is not active' });
          failureCount++;
          continue;
        }

        if (profile.currentStage !== PROFILE_STAGES.APPROVED) {
          results.push({
            profileId,
            success: false,
            error: `Profile stage is "${profile.currentStage}", must be "approved"`,
          });
          failureCount++;
          continue;
        }

        // Check for duplicate enrollment
        const existing = await prisma.trainingBatchEnrollment.findFirst({
          where: { batchId, profileId },
        });
        if (existing) {
          results.push({ profileId, success: false, error: 'Already enrolled in this batch' });
          failureCount++;
          continue;
        }

        // Check availability conflicts
        if (batch.startDate && batch.endDate) {
          const availability = await checkWorkerAvailability(profileId, batch.startDate, batch.endDate);
          if (!availability.isAvailable) {
            const conflicts = availability.blockingEvents.map((event) => {
              return `${event.type}: ${event.entityName}`;
            });
            results.push({
              profileId,
              success: false,
              error: `Has overlapping commitments: ${conflicts.join(', ')}`,
            });
            failureCount++;
            continue;
          }
        }

        // Create enrollment
        const enrollment = await prisma.trainingBatchEnrollment.create({
          data: {
            batchId,
            profileId,
            enrolledByProfileId,
            enrollmentDate: new Date(),
            status: ENROLLMENT_STATUSES.ENROLLED,
          },
        });

        // Update profile stage
        await prisma.profile.update({
          where: { id: profileId },
          data: { currentStage: PROFILE_STAGES.TRAINING_SCHEDULED },
        });

        // Log availability event
        if (batch.startDate && batch.endDate) {
          await logAvailabilityEvent(profileId, 'TRAINING', batchId, batch.startDate, batch.endDate, 'ENROLLED');
        }

        results.push({ profileId, success: true, enrollmentId: enrollment.id });
        successCount++;
      } catch (error: any) {
        results.push({ profileId, success: false, error: error.message || 'Unknown error' });
        failureCount++;
      }
    }

    logger.info('Bulk enrollment completed', {
      batchId,
      totalRequested: profileIds.length,
      successCount,
      failureCount,
    });

    return {
      totalRequested: profileIds.length,
      successCount,
      failureCount,
      results,
    };
  }

  // ==================== TRAINING HISTORY ====================
  /**
   * Get training history for a specific profile
   * Returns all training enrollments (past and present)
   */
  async getProfileTrainingHistory(profileId: string): Promise<{
    profile: {
      id: string;
      name: string;
      candidateCode: string | null;
      workerCode: string | null;
      currentStage: string | null;
    };
    summary: {
      totalEnrollments: number;
      completed: number;
      dropped: number;
      ongoing: number;
      upcoming: number;
    };
    enrollments: Array<{
      id: string;
      status: string | null;
      enrollmentDate: Date | null;
      completionDate: Date | null;
      droppedBeforeStart: boolean | null;
      dropReason: string | null;
      forceCompleted: boolean;
      batch: {
        id: string;
        code: string | null;
        name: string | null;
        programName: string | null;
        provider: string | null;
        startDate: Date | null;
        endDate: Date | null;
        status: string | null;
        location: string | null;
      };
      certificate: {
        id: string;
        certificateNumber: string | null;
        issuedDate: Date | null;
        certificateFileUrl: string | null;
      } | null;
    }>;
  }> {
    // Check if profile exists
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        candidateCode: true,
        workerCode: true,
        currentStage: true,
      },
    });

    if (!profile) throw new Error('Profile not found');

    // Get all enrollments for this profile
    const enrollments = await prisma.trainingBatchEnrollment.findMany({
      where: { profileId },
      include: {
        batch: {
          select: {
            id: true,
            code: true,
            name: true,
            programName: true,
            provider: true,
            startDate: true,
            endDate: true,
            status: true,
            location: true,
          },
        },
      },
      orderBy: { enrollmentDate: 'desc' },
    });

    // Get certificates for this profile
    const certificates = await prisma.profileTrainingCertificate.findMany({
      where: { profileId },
      select: {
        id: true,
        certificateNumber: true,
        issuedDate: true,
        certificateFileUrl: true,
        trainingBatchId: true,
      },
    });

    // Create a map of batchId -> certificate
    const certificateMap = new Map(certificates.map((c) => [c.trainingBatchId, c]));

    // Calculate summary
    const summary = {
      totalEnrollments: enrollments.length,
      completed: enrollments.filter((e) => e.status === ENROLLMENT_STATUSES.COMPLETED).length,
      dropped: enrollments.filter((e) => e.status === ENROLLMENT_STATUSES.DROPPED).length,
      ongoing: enrollments.filter(
        (e) => e.status === ENROLLMENT_STATUSES.ENROLLED && e.batch?.status === 'ongoing'
      ).length,
      upcoming: enrollments.filter(
        (e) => e.status === ENROLLMENT_STATUSES.ENROLLED && e.batch?.status === 'upcoming'
      ).length,
    };

    // Format enrollments with certificates
    const formattedEnrollments = enrollments.map((e) => {
      const cert = e.batchId ? certificateMap.get(e.batchId) : null;
      return {
        id: e.id,
        status: e.status,
        enrollmentDate: e.enrollmentDate,
        completionDate: e.completionDate,
        droppedBeforeStart: e.droppedBeforeStart,
        dropReason: e.dropReason,
        forceCompleted: !!e.forceCompletedAt,
        batch: e.batch!,
        certificate: cert
          ? {
              id: cert.id,
              certificateNumber: cert.certificateNumber,
              issuedDate: cert.issuedDate,
              certificateFileUrl: cert.certificateFileUrl,
            }
          : null,
      };
    });

    logger.info('Fetched training history for profile', {
      profileId,
      totalEnrollments: enrollments.length,
    });

    return {
      profile: {
        id: profile.id,
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        candidateCode: profile.candidateCode,
        workerCode: profile.workerCode,
        currentStage: profile.currentStage,
      },
      summary,
      enrollments: formattedEnrollments,
    };
  }
}

export const trainingBatchService = new TrainingBatchService();
export default trainingBatchService;
