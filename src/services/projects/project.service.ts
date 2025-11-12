import prisma from '@/config/prisma';
import type { Prisma } from '@/generated/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';
import { AppError } from '@/middlewares/errorHandler';
import { PROJECT_STATUSES, ProjectMatchedProfileStatus, ProjectStatus } from '@/types/enums';
import type { CreateProjectDto, ProjectWithDetails, UpdateProjectDto } from '@/types/prisma.types';

export class ProjectService {
  /**
   * Get all projects with optional filters
   */
  async getAllProjects(filters?: {
    employer_id?: string;
    status?: string;
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ projects: ProjectWithDetails[]; total: number }> {
    const where: Prisma.projectsWhereInput = {};

    if (filters?.employer_id) {
      where.employer_id = filters.employer_id;
    }

    if (filters?.status) {
      // Validate status
      if (!PROJECT_STATUSES.includes(filters.status as ProjectStatus)) {
        throw new AppError(
          `Invalid status: ${filters.status}. Must be one of: ${PROJECT_STATUSES.join(', ')}`,
          400
        );
      }
      where.status = filters.status;
    }

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { po_co_number: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Filter out soft-deleted projects
    where.deleted_at = null;

    const [projects, total] = await Promise.all([
      prisma.projects.findMany({
        where,
        include: {
          employers: true,
          project_resource_requirements: {
            include: {
              skill_categories: true,
            },
          },
          project_assignments: {
            take: 5,
            orderBy: { deployment_date: 'desc' },
          },
          project_requests: true,
        },
        orderBy: { created_at: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
      }),
      prisma.projects.count({ where }),
    ]);

    return {
      projects: projects as ProjectWithDetails[],
      total,
    };
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string, includeDetails = false): Promise<ProjectWithDetails> {
    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        employers: includeDetails,
        project_resource_requirements: {
          include: {
            skill_categories: true,
          },
        },
        project_assignments: includeDetails
          ? {
              orderBy: { deployment_date: 'desc' },
              include: {
                profiles: true,
              },
            }
          : false,
        project_requests: includeDetails,
        project_financials: true,
      },
    });

    if (!project || project.deleted_at) {
      throw new AppError('Project not found', 404);
    }

    return project as ProjectWithDetails;
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectDto): Promise<ProjectWithDetails> {
    try {
      // Ensure prisma is connected
      await prisma.$connect();

      // Generate unique project code
      const lastProject = await prisma.projects.findFirst({
        where: {
          code: {
            startsWith: 'PRJ',
          },
        },
        orderBy: {
          code: 'desc',
        },
        select: {
          code: true,
        },
      });

      let nextCode = 1;
      if (lastProject) {
        const match = lastProject.code.match(/PRJ(\d+)/);
        if (match) {
          nextCode = parseInt(match[1]) + 1;
        }
      }

      const code = `PRJ${String(nextCode).padStart(5, '0')}`;

      // Separate resource_requirements and financial data from project data
      const {
        resource_requirements,
        contract_value,
        revised_contract_value,
        variation_order_value,
        actual_cost_incurred,
        misc_cost,
        budget,
        ...projectData
      } = data;

      // Convert Date fields if present
      const dateFields: any = {};
      if (projectData.deployment_date)
        dateFields.deployment_date = new Date(projectData.deployment_date);
      if (projectData.award_date) dateFields.award_date = new Date(projectData.award_date);
      if (projectData.start_date) dateFields.start_date = new Date(projectData.start_date);
      if (projectData.end_date) dateFields.end_date = new Date(projectData.end_date);
      if (projectData.revised_completion_date)
        dateFields.revised_completion_date = new Date(projectData.revised_completion_date);

      // Create project with resource requirements in a transaction
      const project = await prisma.$transaction(
        async (tx) => {
          // Create the project
          const createdProject = await tx.projects.create({
          data: {
            ...projectData,
            ...dateFields,
            code,
            status: projectData.status || ProjectStatus.PLANNING,
            is_active: projectData.is_active !== undefined ? projectData.is_active : true,
            is_accommodation_provided: projectData.is_accommodation_provided || false,
            project_financials:
              contract_value ||
              revised_contract_value ||
              variation_order_value ||
              actual_cost_incurred ||
              misc_cost ||
              budget
                ? {
                    create: {
                      contract_value: contract_value ? new Decimal(contract_value) : null,
                      revised_contract_value: revised_contract_value
                        ? new Decimal(revised_contract_value)
                        : null,
                      variation_order_value: variation_order_value
                        ? new Decimal(variation_order_value)
                        : null,
                      actual_cost_incurred: actual_cost_incurred
                        ? new Decimal(actual_cost_incurred)
                        : null,
                      misc_cost: misc_cost ? new Decimal(misc_cost) : null,
                      budget: budget ? new Decimal(budget) : null,
                    },
                  }
                : undefined,
          },
        });

        // Create resource requirements if provided
        if (resource_requirements && resource_requirements.length > 0) {
          for (const req of resource_requirements) {
            // Verify skill category exists
            const skillCategory = await tx.skill_categories.findUnique({
              where: { id: req.skill_category_id },
            });

            if (!skillCategory) {
              throw new AppError(`Skill category with ID '${req.skill_category_id}' not found`, 400);
            }

            await tx.project_resource_requirements.create({
              data: {
                project_id: createdProject.id,
                skill_category_id: req.skill_category_id,
                required_count: req.required_count,
                notes: req.notes,
              },
            });
          }
        }

          // Fetch the complete project with relations
          return await tx.projects.findUnique({
            where: { id: createdProject.id },
            include: {
              employers: true,
              project_resource_requirements: {
                include: {
                  skill_categories: true,
                },
              },
            },
          });
        },
        {
          maxWait: 10000, // 10 seconds max wait to connect
          timeout: 20000, // 20 seconds transaction timeout
        }
      );

      if (!project) {
        throw new AppError('Failed to create project', 500);
      }

      return project as ProjectWithDetails;
    } catch (error) {
      console.error('Create project error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      // Log the actual error for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AppError(`Failed to create project: ${errorMessage}`, 500);
    }
  }

  /**
   * Update a project
   */
  async updateProject(id: string, data: UpdateProjectDto): Promise<ProjectWithDetails> {
    try {
      const { resource_requirements, ...projectData } = data;

      const project = await prisma.$transaction(async (tx) => {
        // Check if project exists and not deleted
        const existing = await tx.projects.findUnique({
          where: { id },
        });

        if (!existing || existing.deleted_at) {
          throw new AppError('Project not found', 404);
        }

        // Prepare update data
        const updateData: Prisma.projectsUpdateInput = {};

        // Handle financial data separately
        const financialUpdates: any = {};
        let hasFinancialUpdates = false;

        if (projectData.contract_value !== undefined) {
          financialUpdates.contract_value =
            projectData.contract_value !== null ? new Decimal(projectData.contract_value) : null;
          hasFinancialUpdates = true;
        }
        if (projectData.revised_contract_value !== undefined) {
          financialUpdates.revised_contract_value =
            projectData.revised_contract_value !== null
              ? new Decimal(projectData.revised_contract_value)
              : null;
          hasFinancialUpdates = true;
        }
        if (projectData.variation_order_value !== undefined) {
          financialUpdates.variation_order_value =
            projectData.variation_order_value !== null
              ? new Decimal(projectData.variation_order_value)
              : null;
          hasFinancialUpdates = true;
        }
        if (projectData.actual_cost_incurred !== undefined) {
          financialUpdates.actual_cost_incurred =
            projectData.actual_cost_incurred !== null
              ? new Decimal(projectData.actual_cost_incurred)
              : null;
          hasFinancialUpdates = true;
        }
        if (projectData.misc_cost !== undefined) {
          financialUpdates.misc_cost =
            projectData.misc_cost !== null ? new Decimal(projectData.misc_cost) : null;
          hasFinancialUpdates = true;
        }
        if (projectData.budget !== undefined) {
          financialUpdates.budget =
            projectData.budget !== null ? new Decimal(projectData.budget) : null;
          hasFinancialUpdates = true;
        }

        // Update or create project_financials if needed
        if (hasFinancialUpdates) {
          updateData.project_financials = {
            upsert: {
              create: financialUpdates,
              update: financialUpdates,
            },
          };
        }

        // Copy other fields with Date conversion
        Object.entries(projectData).forEach(([key, value]) => {
          if (
            value !== undefined &&
            ![
              'contract_value',
              'revised_contract_value',
              'variation_order_value',
              'actual_cost_incurred',
              'misc_cost',
              'budget',
            ].includes(key)
          ) {
            // Convert Date fields
            if (
              [
                'deployment_date',
                'award_date',
                'start_date',
                'end_date',
                'revised_completion_date',
              ].includes(key)
            ) {
              (updateData as any)[key] = value ? new Date(value as any) : null;
            } else {
              (updateData as any)[key] = value === '' ? null : value;
            }
          }
        });

        // Update project
        await tx.projects.update({
          where: { id },
          data: updateData,
        });

        // Update resource requirements if provided
        if (resource_requirements !== undefined) {
          // Delete existing requirements
          await tx.project_resource_requirements.deleteMany({
            where: { project_id: id },
          });

          // Insert new requirements
          if (resource_requirements.length > 0) {
            for (const req of resource_requirements) {
              const skillCategory = await tx.skill_categories.findUnique({
                where: { id: req.skill_category_id },
              });

              if (!skillCategory) {
                throw new AppError(`Skill category with ID '${req.skill_category_id}' not found`, 400);
              }

              await tx.project_resource_requirements.create({
                data: {
                  project_id: id,
                  skill_category_id: req.skill_category_id,
                  required_count: req.required_count,
                  notes: req.notes,
                },
              });
            }
          }
        }

        // Fetch updated project with relations
        return await tx.projects.findUnique({
          where: { id },
          include: {
            employers: true,
            project_resource_requirements: {
              include: {
                skill_categories: true,
              },
            },
            project_assignments: {
              take: 5,
              orderBy: { deployment_date: 'desc' },
            },
          },
        });
      });

      if (!project) {
        throw new AppError('Failed to update project', 500);
      }

      return project as ProjectWithDetails;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update project', 500);
    }
  }

  /**
   * Approve or reject a project
   */
  async approveProject(
    id: string,
    data: {
      approved_by_user_id: string;
      approve: boolean;
      approval_notes?: string;
      rejection_reason?: string;
    }
  ): Promise<ProjectWithDetails> {
    const project = await prisma.projects.findUnique({
      where: { id },
    });

    if (!project || project.deleted_at) {
      throw new AppError('Project not found', 404);
    }

    if (project.status !== ProjectStatus.PLANNING) {
      throw new AppError('Only planning projects can be approved or rejected', 400);
    }

    const updateData: Prisma.projectsUpdateInput = data.approve
      ? {
          status: ProjectStatus.APPROVED,
          is_active: true,
        }
      : {
          status: ProjectStatus.CANCELLED,
          is_active: false,
        };

    const updatedProject = await prisma.projects.update({
      where: { id },
      data: updateData,
      include: {
        employers: true,
        project_resource_requirements: {
          include: {
            skill_categories: true,
          },
        },
      },
    });

    return updatedProject as ProjectWithDetails;
  }

  /**
   * Soft delete a project
   */
  async deleteProject(id: string, deleted_by_user_id?: string): Promise<void> {
    const project = await prisma.projects.findUnique({
      where: { id },
    });

    if (!project || project.deleted_at) {
      throw new AppError('Project not found', 404);
    }

    await prisma.projects.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_user_id,
        is_active: false,
      },
    });
  }

  /**
   * Get matched profiles for a project
   * Returns all profiles matched to this project with their skill categories
   */
  async getMatchedProfiles(projectId: string): Promise<any> {
    // Verify project exists
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
    });

    if (!project || project.deleted_at) {
      throw new AppError('Project not found', 404);
    }

    // Get all matched profiles with profile details and skill categories
    const matchedProfiles = await prisma.project_matched_profiles.findMany({
      where: {
        project_id: projectId,
      },
      include: {
        profiles: {
          include: {
            profile_skills: {
              include: {
                skill_categories: true,
              },
            },
          },
        },
        skill_categories: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return matchedProfiles;
  }

  /**
   * Save matched profiles for a project
   * Only uses status enum: matched, shared, onboarded
   */
  async saveMatchedProfiles(
    projectId: string,
    matchedProfiles: Array<{
      profile_id: string;
      skill_category_id: string;
    }>
  ): Promise<any> {
    // Verify project exists
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
    });

    if (!project || project.deleted_at) {
      throw new AppError('Project not found', 404);
    }

    // Use upsert to handle duplicates
    await Promise.all(
      matchedProfiles.map((profile) =>
        prisma.project_matched_profiles.upsert({
          where: {
            project_id_profile_id_skill_category_id: {
              project_id: projectId,
              profile_id: profile.profile_id,
              skill_category_id: profile.skill_category_id,
            },
          },
          create: {
            project_id: projectId,
            profile_id: profile.profile_id,
            skill_category_id: profile.skill_category_id,
            status: ProjectMatchedProfileStatus.MATCHED,
          },
          update: {
            status: ProjectMatchedProfileStatus.MATCHED,
            updated_at: new Date(),
          },
        })
      )
    );

    return {
      project_id: projectId,
      matched_count: matchedProfiles.length,
    };
  }

  /**
   * Share matched profiles with employer
   * Changes status from 'matched' to 'shared'
   */
  async shareMatchedProfilesWithEmployer(projectId: string, userId?: string): Promise<any> {
    // Verify project exists
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
    });

    if (!project || project.deleted_at) {
      throw new AppError('Project not found', 404);
    }

    // Update all matched profiles to shared status
    const result = await prisma.project_matched_profiles.updateMany({
      where: {
        project_id: projectId,
        status: ProjectMatchedProfileStatus.MATCHED,
      },
      data: {
        status: ProjectMatchedProfileStatus.SHARED,
        shared_at: new Date(),
        shared_by_user_id: userId,
      },
    });

    return {
      project_id: projectId,
      shared_count: result.count,
      shared_at: new Date(),
    };
  }

  /**
   * Get shared profiles for a project (for employer view)
   * Only returns profiles with status = 'shared' or 'onboarded'
   */
  async getSharedProfiles(projectId: string): Promise<any> {
    const sharedProfiles = await prisma.project_matched_profiles.findMany({
      where: {
        project_id: projectId,
        status: {
          in: [ProjectMatchedProfileStatus.SHARED, ProjectMatchedProfileStatus.ONBOARDED],
        },
      },
      include: {
        profiles: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            candidate_code: true,
            phone: true,
            email: true,
            profile_photo_url: true,
          },
        },
        skill_categories: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Group by skill
    const groupedBySkill: Record<string, any> = {};

    sharedProfiles.forEach((matchedProfile: any) => {
      const skillName = matchedProfile.skill_categories.name;

      if (!groupedBySkill[skillName]) {
        groupedBySkill[skillName] = {
          skill_id: matchedProfile.skill_categories.id,
          skill_name: skillName,
          profiles: [],
        };
      }

      groupedBySkill[skillName].profiles.push({
        id: matchedProfile.id,
        profile_id: matchedProfile.profiles.id,
        first_name: matchedProfile.profiles.first_name,
        last_name: matchedProfile.profiles.last_name,
        candidate_code: matchedProfile.profiles.candidate_code,
        phone: matchedProfile.profiles.phone,
        email: matchedProfile.profiles.email,
        profile_photo_url: matchedProfile.profiles.profile_photo_url,
        status: matchedProfile.status,
        shared_at: matchedProfile.shared_at,
      });
    });

    return {
      project_id: projectId,
      skills: Object.values(groupedBySkill),
      total_profiles: sharedProfiles.length,
    };
  }

  /**
   * Mark matched profile as onboarded
   */
  async onboardMatchedProfile(
    projectId: string,
    profileId: string,
    skillCategoryId: string
  ): Promise<any> {
    const matchedProfile = await prisma.project_matched_profiles.findUnique({
      where: {
        project_id_profile_id_skill_category_id: {
          project_id: projectId,
          profile_id: profileId,
          skill_category_id: skillCategoryId,
        },
      },
    });

    if (!matchedProfile) {
      throw new AppError('Matched profile not found', 404);
    }

    if (matchedProfile.status !== ProjectMatchedProfileStatus.SHARED) {
      throw new AppError(
        `Cannot onboard profile with status '${matchedProfile.status}'. Must be 'shared'`,
        400
      );
    }

    const updated = await prisma.project_matched_profiles.update({
      where: {
        project_id_profile_id_skill_category_id: {
          project_id: projectId,
          profile_id: profileId,
          skill_category_id: skillCategoryId,
        },
      },
      data: {
        status: ProjectMatchedProfileStatus.ONBOARDED,
      },
    });

    return updated;
  }

  /**
   * Create project from project request (approve project request)
   * This method converts a pending project request into an actual project
   */
  async createProjectFromRequest(
    projectRequestId: string,
    userId: string
  ): Promise<ProjectWithDetails> {
    // Fetch the project request with all details
    const projectRequest = await prisma.project_requests.findUnique({
      where: { id: projectRequestId },
      include: {
        project_request_requirements: {
          include: {
            skill_categories: true,
          },
        },
        employers: true,
      },
    });

    if (!projectRequest) {
      throw new AppError('Project request not found', 404);
    }

    if (projectRequest.status === 'project_created') {
      throw new AppError('Project already created from this request', 400);
    }

    if (!projectRequest.employers) {
      throw new AppError('Employer not found for this project request', 404);
    }

    // Use transaction to create project and update request status
    const result = await prisma.$transaction(
      async (tx) => {
        // Generate unique project code using timestamp + random
        const prjTimestamp = Date.now().toString().substring(5);
        const prjRandom = Math.floor(Math.random() * 100)
          .toString()
          .padStart(2, '0');
        const code = `PRJ${prjTimestamp}${prjRandom}`;

        // Create the project from the request
        const project = await tx.projects.create({
          data: {
            code,
            name: projectRequest.project_title,
            description: projectRequest.project_description,
            location: projectRequest.location,
            employer_id: projectRequest.employer_id!,
            contact_phone: projectRequest.employers?.phone || '',
            status: 'planning', // Initial status when created from request
            is_active: true,
            created_by_user_id: userId,
          },
          include: {
            employers: true,
            project_resource_requirements: {
              include: {
                skill_categories: true,
              },
            },
          },
        });

        // Create project resource requirements from project request requirements
        if (projectRequest.project_request_requirements.length > 0) {
          await tx.project_resource_requirements.createMany({
            data: projectRequest.project_request_requirements.map((req) => ({
              project_id: project.id,
              skill_category_id: req.skill_category_id,
              required_count: req.required_count,
              notes: req.notes,
            })),
          });
        }

        // Update project request status to project_created and link to project
        await tx.project_requests.update({
          where: { id: projectRequestId },
          data: {
            status: 'project_created',
            reviewed_at: new Date(),
            reviewed_by_user_id: userId,
            project_id: project.id,
          },
        });

        // Fetch the complete project with all requirements
        const completeProject = await tx.projects.findUnique({
          where: { id: project.id },
          include: {
            employers: true,
            project_resource_requirements: {
              include: {
                skill_categories: true,
              },
            },
          },
        });

        return completeProject!;
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );

    return result as ProjectWithDetails;
  }
}

export default new ProjectService();
