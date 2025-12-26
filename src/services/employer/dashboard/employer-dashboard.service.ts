// import logger from '@/config/logger';
// import prisma from '@/config/prisma';
// import { Prisma } from '@/generated/prisma';
// import { getEmployerOrThrow } from '../helpers/employer-lookup.helper';

// /**
//  * Get employer dashboard overview with projects and statistics
//  */
// export async function getDashboardOverview(employerId: string): Promise<any> {
//   try {
//     await getEmployerOrThrow(employerId);

//     const projects = await prisma.project.findMany({
//       where: {
//         employerId: employerId,
//         isActive: true,
//         deletedAt: null,
//       },
//       include: {
//         workerAssignments: {
//           where: {
//             removedAt: null,
//             onboardedDate: { not: null },
//           },
//         },
//       },
//     });

//     return {
//       totalProjects: projects.length,
//       activeProjects: projects.filter((p) => p.stage === 'ongoing').length,
//       totalWorkers: projects.reduce((sum, p) => sum + p.workerAssignments.length, 0),
//       projects: projects.map((p) => ({
//         id: p.id,
//         name: p.name,
//         stage: p.stage,
//         location: p.location,
//         startDate: p.startDate,
//         endDate: p.endDate,
//         sharedWorkersCount: p.workerAssignments.length,
//       })),
//     };
//   } catch (error: any) {
//     logger.error('Error fetching dashboard overview', { error, employerId });
//     throw new Error(error.message || 'Failed to fetch dashboard overview');
//   }
// }

// /**
//  * Get detailed project information including shared workers
//  */
// export async function getProjectDetails(employerId: string, projectId: string): Promise<any> {
//   try {
//     await getEmployerOrThrow(employerId);

//     const project = await prisma.project.findFirst({
//       where: {
//         id: projectId,
//         employerId: employerId,
//         deletedAt: null,
//       },
//       include: {
//         financials: true,
//         resourceRequirements: {
//           include: {
//             skillCategory: true,
//           },
//         },
//         workerAssignments: {
//           where: {
//             removedAt: null,
//             onboardedDate: { not: null },
//           },
//           include: {
//             profile: {
//               include: {
//                 skills: {
//                   include: {
//                     skillCategory: true,
//                   },
//                 },
//                 addresses: {
//                   where: {
//                     isCurrent: true,
//                   },
//                 },
//               },
//             },
//             skillCategory: true,
//           },
//           orderBy: {
//             onboardedDate: 'desc',
//           },
//         },
//       },
//     });

//     if (!project) {
//       throw new Error('Project not found');
//     }

//     // Transform shared workers data
//     const sharedWorkers = project.workerAssignments.map((assignment) => {
//       const currentAddress = assignment.profile?.addresses?.[0];
//       const addressString = currentAddress
//         ? [
//             currentAddress.houseNumber,
//             currentAddress.villageOrCity,
//             currentAddress.district,
//             currentAddress.state,
//             currentAddress.postalCode,
//           ]
//             .filter(Boolean)
//             .join(', ')
//         : null;

//       return {
//         id: assignment.id,
//         firstName: assignment.profile?.firstName,
//         lastName: assignment.profile?.lastName,
//         candidateCode: assignment.profile?.candidateCode,
//         phone: assignment.profile?.phone,
//         email: assignment.profile?.email,
//         age: assignment.profile?.dateOfBirth
//           ? Math.floor(
//               (new Date().getTime() - new Date(assignment.profile.dateOfBirth).getTime()) /
//                 (365.25 * 24 * 60 * 60 * 1000)
//             )
//           : null,
//         address: addressString,
//         skillMatchedFor: assignment.skillCategory?.name || 'Unknown',
//         sharedAt: assignment.onboardedDate,
//         deployedDate: assignment.deployedDate,
//       };
//     });

//     return {
//       project: {
//         id: project.id,
//         name: project.name,
//         description: project.description,
//         location: project.location,
//         stage: project.stage,
//         startDate: project.startDate,
//         endDate: project.endDate,
//         deploymentDate: project.deploymentDate,
//         awardDate: project.awardDate,
//         revisedCompletionDate: project.revisedCompletionDate,
//         contactPhone: project.contactPhone,
//         poCoNumber: project.poCoNumber,
//         isAccommodationProvided: project.isAccommodationProvided,
//         financials: project.financials
//           ? {
//               contractValue: project.financials.contractValue,
//               revisedContractValue: project.financials.revisedContractValue,
//               variationOrderValue: project.financials.variationOrderValue,
//               budget: project.financials.budget,
//             }
//           : null,
//         resourceRequirements: project.resourceRequirements.map((req) => ({
//           skillCategory: req.skillCategory?.name || 'Unknown',
//           requiredCount: req.requiredCount,
//           allocatedCount: sharedWorkers.filter((w) => w.skillMatchedFor === req.skillCategory?.name)
//             .length,
//         })),
//         sharedWorkers,
//       },
//       workerStats: {
//         totalShared: sharedWorkers.length,
//         deployed: sharedWorkers.filter((w) => w.deployedDate).length,
//         pendingDeployment: sharedWorkers.filter((w) => !w.deployedDate).length,
//       },
//     };
//   } catch (error: any) {
//     logger.error('Error fetching project details', { error, employerId, projectId });
//     throw new Error(error.message || 'Failed to fetch project details');
//   }
// }

// /**
//  * Get list of projects for employer with basic info
//  */
// export async function getEmployerProjects(
//   employerId: string,
//   filters?: {
//     status?: string;
//     search?: string;
//     limit?: number;
//     offset?: number;
//   }
// ): Promise<{ projects: any[]; total: number }> {
//   try {
//     await getEmployerOrThrow(employerId);

//     const where: Prisma.ProjectWhereInput = {
//       employerId: employerId,
//       isActive: true,
//       deletedAt: null,
//     };

//     if (filters?.status) {
//       where.stage = filters.status;
//     }

//     if (filters?.search) {
//       where.OR = [
//         { name: { contains: filters.search, mode: 'insensitive' } },
//         { location: { contains: filters.search, mode: 'insensitive' } },
//       ];
//     }

//     const [projects, total] = await Promise.all([
//       prisma.project.findMany({
//         where,
//         include: {
//           workerAssignments: {
//             where: {
//               removedAt: null,
//               onboardedDate: { not: null },
//             },
//           },
//         },
//         orderBy: { createdAt: 'desc' },
//         take: filters?.limit,
//         skip: filters?.offset,
//       }),
//       prisma.project.count({ where }),
//     ]);

//     return {
//       projects: projects.map((p) => ({
//         id: p.id,
//         name: p.name,
//         stage: p.stage,
//         location: p.location,
//         startDate: p.startDate,
//         endDate: p.endDate,
//         sharedWorkersCount: p.workerAssignments.length,
//         daysRemaining:
//           p.endDate && p.startDate
//             ? Math.max(
//                 0,
//                 Math.ceil(
//                   (new Date(p.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
//                 )
//               )
//             : 0,
//       })),
//       total,
//     };
//   } catch (error: any) {
//     logger.error('Error fetching employer projects', { error, employerId });
//     throw new Error(error.message || 'Failed to fetch employer projects');
//   }
// }
