import logger from '@/config/logger';
import prisma from '@/config/prisma';

export interface TrainerWithAvailability {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  workerCode: string | null;
  profilePhotoUrl: string | null;
  dateOfBirth: Date | null;
  age: number | null;
  gender: string | null;
  isActive: boolean;
  shift1Available: boolean;
  shift2Available: boolean;
  activeBatchCount: number;
  isFullyBooked: boolean;
  // Collision info for unavailable shifts
  shift1Collision: BatchCollision | null;
  shift2Collision: BatchCollision | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface BatchCollision {
  batchId: string;
  batchName: string;
  batchCode: string | null;
  startDate: Date | null;
  endDate: Date | null;
  shift: string | null;
}

export interface TrainerListQuery {
  available?: boolean;
  shift?: 'shift_1' | 'shift_2';
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface TrainerLookupQuery {
  batchStartDate: Date;
  batchEndDate: Date;
  shift?: 'shift_1' | 'shift_2';
  search?: string;
  page?: number;
  limit?: number;
}

export interface TrainerLookupResponse {
  available: TrainerWithAvailability[];
  unavailable: TrainerWithAvailability[];
  pagination: {
    total: number;
    availableCount: number;
    unavailableCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class TrainerService {
  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date | null): number | null {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Check if two date ranges overlap
   */
  private datesOverlap(
    start1: Date | null,
    end1: Date | null,
    start2: Date | null,
    end2: Date | null
  ): boolean {
    if (!start1 || !end1 || !start2 || !end2) return false;
    return start1 <= end2 && start2 <= end1;
  }

  /**
   * Get all trainers with their availability status
   */
  async getAllTrainers(query: TrainerListQuery = {}): Promise<{
    data: TrainerWithAvailability[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { available, shift, search, isActive, limit = 50, offset = 0 } = query;
    const page = Math.floor(offset / limit) + 1;

    // Build where clause for profiles
    const where: any = {
      workerType: 'trainer',
      deletedAt: null,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { workerCode: { contains: search, mode: 'insensitive' } },
        { candidateCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get all trainer profiles
    const [trainers, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.profile.count({ where }),
    ]);

    // Get active batch assignments for all trainers
    const trainerIds = trainers.map((t) => t.id);

    // Get batches where these trainers are assigned (via TrainingBatchTrainer)
    const batchAssignments = await prisma.trainingBatchTrainer.findMany({
      where: {
        trainerProfileId: { in: trainerIds },
        trainingBatch: {
          status: { in: ['ongoing', 'upcoming', 'scheduled'] },
        },
      },
      include: {
        trainingBatch: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    // Group batch assignments by trainer and shift
    const trainerBatches: Record<string, typeof batchAssignments> = {};
    for (const assignment of batchAssignments) {
      const trainerId = assignment.trainerProfileId;
      if (trainerId) {
        if (!trainerBatches[trainerId]) {
          trainerBatches[trainerId] = [];
        }
        trainerBatches[trainerId].push(assignment);
      }
    }

    // Build trainer list with availability
    const trainersWithAvailability: TrainerWithAvailability[] = trainers.map((profile) => {
      const assignments = trainerBatches[profile.id] || [];

      const shift1Assignments = assignments.filter((a) => a.shift === 'shift_1');
      const shift2Assignments = assignments.filter((a) => a.shift === 'shift_2');

      const shift1Available = shift1Assignments.length === 0;
      const shift2Available = shift2Assignments.length === 0;
      const isFullyBooked = !shift1Available && !shift2Available;

      // Get collision info
      const shift1Collision =
        shift1Assignments.length > 0
          ? {
              batchId: shift1Assignments[0].trainingBatch?.id || '',
              batchName: shift1Assignments[0].trainingBatch?.name || '',
              batchCode: shift1Assignments[0].trainingBatch?.code || null,
              startDate: shift1Assignments[0].trainingBatch?.startDate || null,
              endDate: shift1Assignments[0].trainingBatch?.endDate || null,
              shift: shift1Assignments[0].shift,
            }
          : null;

      const shift2Collision =
        shift2Assignments.length > 0
          ? {
              batchId: shift2Assignments[0].trainingBatch?.id || '',
              batchName: shift2Assignments[0].trainingBatch?.name || '',
              batchCode: shift2Assignments[0].trainingBatch?.code || null,
              startDate: shift2Assignments[0].trainingBatch?.startDate || null,
              endDate: shift2Assignments[0].trainingBatch?.endDate || null,
              shift: shift2Assignments[0].shift,
            }
          : null;

      return {
        id: profile.id,
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Unknown',
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        workerCode: profile.workerCode || profile.candidateCode,
        profilePhotoUrl: profile.profilePhotoURL,
        dateOfBirth: profile.dateOfBirth,
        age: this.calculateAge(profile.dateOfBirth),
        gender: profile.gender,
        isActive: profile.isActive !== false,
        shift1Available,
        shift2Available,
        activeBatchCount: assignments.length,
        isFullyBooked,
        shift1Collision,
        shift2Collision,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };
    });

    // Apply availability filters
    let filteredTrainers = trainersWithAvailability;

    if (available === true) {
      filteredTrainers = filteredTrainers.filter((t) => !t.isFullyBooked);
    }

    if (shift === 'shift_1') {
      filteredTrainers = filteredTrainers.filter((t) => t.shift1Available);
    } else if (shift === 'shift_2') {
      filteredTrainers = filteredTrainers.filter((t) => t.shift2Available);
    }

    logger.info('Fetched trainers with availability', {
      total: filteredTrainers.length,
      available,
      shift,
    });

    return {
      data: filteredTrainers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get trainers for a specific batch timeline - returns available and unavailable separately
   */
  async getTrainersForBatch(query: TrainerLookupQuery): Promise<TrainerLookupResponse> {
    const { batchStartDate, batchEndDate, shift, search, page = 1, limit = 50 } = query;
    const offset = (page - 1) * limit;

    // Build where clause for profiles
    const where: any = {
      workerType: 'trainer',
      deletedAt: null,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { workerCode: { contains: search, mode: 'insensitive' } },
        { candidateCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get all trainer profiles
    const [trainers, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.profile.count({ where }),
    ]);

    const trainerIds = trainers.map((t) => t.id);

    // Get ALL batch assignments for these trainers (not just active)
    // to check for timeline collisions
    const batchAssignments = await prisma.trainingBatchTrainer.findMany({
      where: {
        trainerProfileId: { in: trainerIds },
        trainingBatch: {
          status: { in: ['ongoing', 'upcoming', 'scheduled'] },
          // Only consider batches that might overlap with our date range
          OR: [
            {
              AND: [{ startDate: { lte: batchEndDate } }, { endDate: { gte: batchStartDate } }],
            },
          ],
        },
      },
      include: {
        trainingBatch: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    // Group by trainer
    const trainerAssignments: Record<string, typeof batchAssignments> = {};
    for (const assignment of batchAssignments) {
      const trainerId = assignment.trainerProfileId;
      if (trainerId) {
        if (!trainerAssignments[trainerId]) {
          trainerAssignments[trainerId] = [];
        }
        trainerAssignments[trainerId].push(assignment);
      }
    }

    const available: TrainerWithAvailability[] = [];
    const unavailable: TrainerWithAvailability[] = [];

    for (const profile of trainers) {
      const assignments = trainerAssignments[profile.id] || [];

      // Check for collisions in the requested date range
      const shift1Collisions = assignments.filter(
        (a) =>
          a.shift === 'shift_1' &&
          this.datesOverlap(
            batchStartDate,
            batchEndDate,
            a.trainingBatch?.startDate || null,
            a.trainingBatch?.endDate || null
          )
      );

      const shift2Collisions = assignments.filter(
        (a) =>
          a.shift === 'shift_2' &&
          this.datesOverlap(
            batchStartDate,
            batchEndDate,
            a.trainingBatch?.startDate || null,
            a.trainingBatch?.endDate || null
          )
      );

      const shift1Available = shift1Collisions.length === 0;
      const shift2Available = shift2Collisions.length === 0;

      // Determine availability based on requested shift
      let isAvailable = false;
      if (shift === 'shift_1') {
        isAvailable = shift1Available;
      } else if (shift === 'shift_2') {
        isAvailable = shift2Available;
      } else {
        // No specific shift requested - available if at least one shift is free
        isAvailable = shift1Available || shift2Available;
      }

      const trainerData: TrainerWithAvailability = {
        id: profile.id,
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Unknown',
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        workerCode: profile.workerCode || profile.candidateCode,
        profilePhotoUrl: profile.profilePhotoURL,
        dateOfBirth: profile.dateOfBirth,
        age: this.calculateAge(profile.dateOfBirth),
        gender: profile.gender,
        isActive: profile.isActive !== false,
        shift1Available,
        shift2Available,
        activeBatchCount: assignments.length,
        isFullyBooked: !shift1Available && !shift2Available,
        shift1Collision:
          shift1Collisions.length > 0
            ? {
                batchId: shift1Collisions[0].trainingBatch?.id || '',
                batchName: shift1Collisions[0].trainingBatch?.name || '',
                batchCode: shift1Collisions[0].trainingBatch?.code || null,
                startDate: shift1Collisions[0].trainingBatch?.startDate || null,
                endDate: shift1Collisions[0].trainingBatch?.endDate || null,
                shift: 'shift_1',
              }
            : null,
        shift2Collision:
          shift2Collisions.length > 0
            ? {
                batchId: shift2Collisions[0].trainingBatch?.id || '',
                batchName: shift2Collisions[0].trainingBatch?.name || '',
                batchCode: shift2Collisions[0].trainingBatch?.code || null,
                startDate: shift2Collisions[0].trainingBatch?.startDate || null,
                endDate: shift2Collisions[0].trainingBatch?.endDate || null,
                shift: 'shift_2',
              }
            : null,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };

      if (isAvailable) {
        available.push(trainerData);
      } else {
        unavailable.push(trainerData);
      }
    }

    logger.info('Fetched trainers for batch lookup', {
      total,
      availableCount: available.length,
      unavailableCount: unavailable.length,
      batchStartDate,
      batchEndDate,
      shift,
    });

    return {
      available,
      unavailable,
      pagination: {
        total,
        availableCount: available.length,
        unavailableCount: unavailable.length,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single trainer by ID with availability
   */
  async getTrainerById(id: string): Promise<TrainerWithAvailability | null> {
    const profile = await prisma.profile.findFirst({
      where: {
        id,
        workerType: 'trainer',
        deletedAt: null,
      },
    });

    if (!profile) {
      return null;
    }

    // Get active batch assignments
    const batchAssignments = await prisma.trainingBatchTrainer.findMany({
      where: {
        trainerProfileId: id,
        trainingBatch: {
          status: { in: ['ongoing', 'upcoming', 'scheduled'] },
        },
      },
      include: {
        trainingBatch: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    const shift1Assignments = batchAssignments.filter((a) => a.shift === 'shift_1');
    const shift2Assignments = batchAssignments.filter((a) => a.shift === 'shift_2');

    const shift1Available = shift1Assignments.length === 0;
    const shift2Available = shift2Assignments.length === 0;

    const shift1Collision =
      shift1Assignments.length > 0
        ? {
            batchId: shift1Assignments[0].trainingBatch?.id || '',
            batchName: shift1Assignments[0].trainingBatch?.name || '',
            batchCode: shift1Assignments[0].trainingBatch?.code || null,
            startDate: shift1Assignments[0].trainingBatch?.startDate || null,
            endDate: shift1Assignments[0].trainingBatch?.endDate || null,
            shift: 'shift_1',
          }
        : null;

    const shift2Collision =
      shift2Assignments.length > 0
        ? {
            batchId: shift2Assignments[0].trainingBatch?.id || '',
            batchName: shift2Assignments[0].trainingBatch?.name || '',
            batchCode: shift2Assignments[0].trainingBatch?.code || null,
            startDate: shift2Assignments[0].trainingBatch?.startDate || null,
            endDate: shift2Assignments[0].trainingBatch?.endDate || null,
            shift: 'shift_2',
          }
        : null;

    return {
      id: profile.id,
      name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Unknown',
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      workerCode: profile.workerCode || profile.candidateCode,
      profilePhotoUrl: profile.profilePhotoURL,
      dateOfBirth: profile.dateOfBirth,
      age: this.calculateAge(profile.dateOfBirth),
      gender: profile.gender,
      isActive: profile.isActive !== false,
      shift1Available,
      shift2Available,
      activeBatchCount: batchAssignments.length,
      isFullyBooked: !shift1Available && !shift2Available,
      shift1Collision,
      shift2Collision,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * Get batches assigned to a trainer
   */
  async getTrainerBatches(trainerId: string, status?: string): Promise<any[]> {
    const where: any = {
      trainerProfileId: trainerId,
    };

    if (status) {
      where.trainingBatch = { status };
    }

    const assignments = await prisma.trainingBatchTrainer.findMany({
      where,
      include: {
        trainingBatch: {
          select: {
            id: true,
            code: true,
            name: true,
            programName: true,
            status: true,
            startDate: true,
            endDate: true,
            location: true,
            maxCapacity: true,
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
      orderBy: {
        trainingBatch: { startDate: 'desc' },
      },
    });

    return assignments.map((a) => ({
      ...a.trainingBatch,
      assignmentId: a.id,
      shift: a.shift,
      assignedAt: a.assignedAt,
      enrollmentCount: a.trainingBatch?._count?.enrollments || 0,
    }));
  }

  /**
   * Create a new trainer (create profile with workerType: 'trainer')
   */
  async createTrainer(data: {
    name: string;
    email?: string;
    phone: string;
    dateOfBirth?: Date;
    gender?: string;
  }): Promise<TrainerWithAvailability> {
    const nameParts = data.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const profile = await prisma.profile.create({
      data: {
        firstName,
        lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        workerType: 'trainer',
        profileType: 'worker',
        isActive: true,
      },
    });

    logger.info('Created new trainer', { id: profile.id, name: data.name });

    return {
      id: profile.id,
      name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      workerCode: profile.workerCode || profile.candidateCode,
      profilePhotoUrl: profile.profilePhotoURL,
      dateOfBirth: profile.dateOfBirth,
      age: this.calculateAge(profile.dateOfBirth),
      gender: profile.gender,
      isActive: true,
      shift1Available: true,
      shift2Available: true,
      activeBatchCount: 0,
      isFullyBooked: false,
      shift1Collision: null,
      shift2Collision: null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * Update a trainer
   */
  async updateTrainer(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      isActive?: boolean;
      dateOfBirth?: Date;
      gender?: string;
    }
  ): Promise<TrainerWithAvailability | null> {
    const updateData: any = {};

    if (data.name) {
      const nameParts = data.name.trim().split(' ');
      updateData.firstName = nameParts[0];
      updateData.lastName = nameParts.slice(1).join(' ') || '';
    }
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
    if (data.gender !== undefined) updateData.gender = data.gender;

    await prisma.profile.update({
      where: { id },
      data: updateData,
    });

    return this.getTrainerById(id);
  }
}

export const trainerService = new TrainerService();
export default trainerService;
