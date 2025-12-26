/**
 * Employer Portal Service
 * Business logic for employer-facing APIs
 */

import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  CreateProjectRequestDto,
  EmployerInfoDto,
  PaginatedResponse,
  ProjectDetailsDto,
  ProjectListItemDto,
  ProjectQueryParams,
  ProjectRequestDetailDto,
  ProjectRequestListItemDto,
  ProjectRequestQueryParams,
} from '@/dtos/employerPortal';
import { Prisma } from '@/generated/prisma';

// Stages where project details are visible to employer
const SHARED_STAGES = ['shared', 'started', 'on_hold', 'completed', 'terminated', 'short_closed'];

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date | null): number | null {
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

// ============================================================================
// Employer Info
// ============================================================================

/**
 * Get employer info by ID
 */
export async function getEmployerInfo(employerId: string): Promise<EmployerInfoDto> {
  try {
    const employer = await prisma.employer.findUnique({
      where: { id: employerId, deletedAt: null },
      include: {
        authorizedPersons: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!employer) {
      throw new Error('Employer not found');
    }

    return {
      id: employer.id,
      employerCode: employer.employerCode,
      companyName: employer.companyName,
      clientName: employer.clientName,
      email: employer.email,
      phone: employer.phone,
      altPhone: employer.altPhone,
      registeredAddress: employer.registeredAddress,
      city: employer.city,
      district: employer.district,
      state: employer.state,
      postalCode: employer.postalCode,
      landmark: employer.landmark,
      gstNumber: employer.gstNumber,
      companyRegistrationNumber: employer.companyRegistrationNumber,
      logoUrl: employer.logoUrl,
      isVerified: employer.isVerified,
      isActive: employer.isActive,
      authorizedPersons: employer.authorizedPersons.map((person) => ({
        id: person.id,
        name: person.name,
        designation: person.designation,
        email: person.email,
        phone: person.phone,
        address: person.address,
        isPrimary: person.isPrimary,
      })),
    };
  } catch (error: any) {
    logger.error('Error fetching employer info', { error, employerId });
    throw new Error(error.message || 'Failed to fetch employer info');
  }
}

// ============================================================================
// Project Requests
// ============================================================================

/**
 * Get project requests for an employer with pagination
 */
export async function getMyProjectRequests(
  employerId: string,
  params: ProjectRequestQueryParams
): Promise<PaginatedResponse<ProjectRequestListItemDto>> {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectRequestWhereInput = {
      employerId,
    };

    if (params.status) {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      prisma.projectRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          projectTitle: true,
          location: true,
          status: true,
          estimatedStartDate: true,
          estimatedBudget: true,
          createdAt: true,
          reviewedAt: true,
        },
      }),
      prisma.projectRequest.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        estimatedBudget: item.estimatedBudget ? Number(item.estimatedBudget) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    logger.error('Error fetching project requests', { error, employerId });
    throw new Error(error.message || 'Failed to fetch project requests');
  }
}

/**
 * Get project request details (only if belongs to employer)
 */
export async function getMyProjectRequestById(
  employerId: string,
  requestId: string
): Promise<ProjectRequestDetailDto> {
  try {
    const projectRequest = await prisma.projectRequest.findFirst({
      where: {
        id: requestId,
        employerId,
      },
      include: {
        requirements: {
          include: {
            skillCategory: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!projectRequest) {
      throw new Error('Project request not found');
    }

    return {
      id: projectRequest.id,
      projectTitle: projectRequest.projectTitle,
      projectDescription: projectRequest.projectDescription,
      location: projectRequest.location,
      estimatedStartDate: projectRequest.estimatedStartDate,
      estimatedDurationDays: projectRequest.estimatedDurationDays,
      estimatedBudget: projectRequest.estimatedBudget
        ? Number(projectRequest.estimatedBudget)
        : null,
      additionalNotes: projectRequest.additionalNotes,
      status: projectRequest.status,
      createdAt: projectRequest.createdAt,
      reviewedAt: projectRequest.reviewedAt,
      requirements: projectRequest.requirements.map((req) => ({
        id: req.id,
        skillCategory: req.skillCategory,
        requiredCount: req.requiredCount,
      })),
    };
  } catch (error: any) {
    logger.error('Error fetching project request', { error, employerId, requestId });
    throw new Error(error.message || 'Failed to fetch project request');
  }
}

/**
 * Create project request
 */
export async function createMyProjectRequest(
  employerId: string,
  data: CreateProjectRequestDto
): Promise<ProjectRequestDetailDto> {
  try {
    // Verify employer exists
    const employer = await prisma.employer.findUnique({
      where: { id: employerId, deletedAt: null },
    });

    if (!employer) {
      throw new Error('Employer not found');
    }

    if (!employer.isVerified) {
      throw new Error('Your account must be verified to submit project requests');
    }

    const { requirements, ...requestData } = data;

    const projectRequest = await prisma.projectRequest.create({
      data: {
        projectTitle: requestData.projectTitle,
        projectDescription: requestData.projectDescription,
        location: requestData.location,
        estimatedStartDate: requestData.estimatedStartDate
          ? new Date(requestData.estimatedStartDate)
          : null,
        estimatedDurationDays: requestData.estimatedDurationDays,
        estimatedBudget: requestData.estimatedBudget
          ? new Prisma.Decimal(requestData.estimatedBudget)
          : null,
        additionalNotes: requestData.additionalNotes,
        employerId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: requirements
          ? {
              create: requirements.map((req) => ({
                skillCategoryId: req.skillCategoryId,
                requiredCount: req.requiredCount,
                createdAt: new Date(),
                updatedAt: new Date(),
              })),
            }
          : undefined,
      },
      include: {
        requirements: {
          include: {
            skillCategory: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    logger.info('Project request created by employer', {
      id: projectRequest.id,
      employerId,
    });

    return {
      id: projectRequest.id,
      projectTitle: projectRequest.projectTitle,
      projectDescription: projectRequest.projectDescription,
      location: projectRequest.location,
      estimatedStartDate: projectRequest.estimatedStartDate,
      estimatedDurationDays: projectRequest.estimatedDurationDays,
      estimatedBudget: projectRequest.estimatedBudget
        ? Number(projectRequest.estimatedBudget)
        : null,
      additionalNotes: projectRequest.additionalNotes,
      status: projectRequest.status,
      createdAt: projectRequest.createdAt,
      reviewedAt: projectRequest.reviewedAt,
      requirements: projectRequest.requirements.map((req) => ({
        id: req.id,
        skillCategory: req.skillCategory,
        requiredCount: req.requiredCount,
      })),
    };
  } catch (error: any) {
    logger.error('Error creating project request', { error, employerId });
    throw new Error(error.message || 'Failed to create project request');
  }
}

// ============================================================================
// Projects
// ============================================================================

/**
 * Get projects for an employer (approved projects only)
 */
export async function getMyProjects(
  employerId: string,
  params: ProjectQueryParams
): Promise<PaginatedResponse<ProjectListItemDto>> {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      employerId,
      deletedAt: null,
    };

    if (params.stage) {
      where.stage = params.stage;
    }

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          projectCode: true,
          name: true,
          location: true,
          stage: true,
          deploymentDate: true,
          startDate: true,
          endDate: true,
          createdAt: true,
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        isShared: SHARED_STAGES.includes(item.stage || ''),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    logger.error('Error fetching projects', { error, employerId });
    throw new Error(error.message || 'Failed to fetch projects');
  }
}

/**
 * Get project details (only if belongs to employer)
 * Returns full details only if project is shared, otherwise just stage info
 */
export async function getMyProjectById(
  employerId: string,
  projectId: string
): Promise<ProjectDetailsDto> {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        employerId,
        deletedAt: null,
      },
      include: {
        projectManager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        documents: {
          where: { stageHistoryId: null }, // Only project-level documents
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            documentType: true,
            fileName: true,
            documentUrl: true,
            createdAt: true,
          },
        },
        stageHistory: {
          orderBy: { changedAt: 'desc' },
          include: {
            documents: {
              select: {
                id: true,
                documentType: true,
                fileName: true,
                documentUrl: true,
                createdAt: true,
              },
            },
          },
        },
        workerAssignments: {
          where: {
            removedAt: null,
          },
          include: {
            profile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                bloodGroup: true,
              },
            },
          },
        },
        resourceRequirements: {
          include: {
            skillCategory: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const isShared = SHARED_STAGES.includes(project.stage || '');

    // If not shared, return only basic info
    if (!isShared) {
      return {
        id: project.id,
        projectCode: project.projectCode,
        name: project.name,
        stage: project.stage,
        isShared: false,
        message: 'Project details will be available once shared',
      };
    }

    // Count assigned workers per skill category
    const assignedCounts: Record<string, number> = {};
    for (const req of project.resourceRequirements) {
      if (req.skillCategoryId) {
        assignedCounts[req.skillCategoryId] = project.workerAssignments.filter(
          (wa) => wa.stage !== 'removed'
        ).length;
      }
    }

    // Full details for shared projects
    return {
      id: project.id,
      projectCode: project.projectCode,
      name: project.name,
      stage: project.stage,
      isShared: true,
      projectDetails: {
        location: project.location,
        description: project.description,
        deploymentDate: project.deploymentDate,
        startDate: project.startDate,
        endDate: project.endDate,
        actualStartDate: project.actualStartDate,
        actualEndDate: project.actualEndDate,
        contactPhone: project.contactPhone,
        poCoNumber: project.poCoNumber,
        isAccommodationProvided: project.isAccommodationProvided,
        projectManager: project.projectManager,
      },
      documents: project.documents.map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        fileName: doc.fileName,
        documentUrl: doc.documentUrl,
        createdAt: doc.createdAt,
      })),
      stageHistory: project.stageHistory.map((history) => ({
        id: history.id,
        previousStage: history.previousStage,
        newStage: history.newStage,
        reason: history.reason,
        changedAt: history.changedAt,
        documents: history.documents.map((doc) => ({
          id: doc.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          documentUrl: doc.documentUrl,
          createdAt: doc.createdAt,
        })),
      })),
      workers: project.workerAssignments
        .filter((wa) => wa.profile)
        .map((wa) => ({
          id: wa.profile!.id,
          firstName: wa.profile!.firstName,
          lastName: wa.profile!.lastName,
          age: calculateAge(wa.profile!.dateOfBirth),
          bloodGroup: wa.profile!.bloodGroup,
          assignedAt: wa.assignedAt,
          deployedAt: wa.deployedAt,
        })),
      resourceRequirements: project.resourceRequirements.map((req) => ({
        skillCategory: req.skillCategory,
        requiredCount: req.requiredCount,
        assignedCount: project.workerAssignments.filter((wa) => wa.stage !== 'removed').length,
      })),
    };
  } catch (error: any) {
    logger.error('Error fetching project details', { error, employerId, projectId });
    throw new Error(error.message || 'Failed to fetch project details');
  }
}
