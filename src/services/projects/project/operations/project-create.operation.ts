import prisma from '@/config/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';
import { AppError } from '@/middlewares/errorHandler';
import { ProjectStatus } from '@/types/enums';
import type { CreateProjectDto, ProjectWithDetails } from '@/types/prisma.types';

export class ProjectCreateOperation {
  /**
   * Create a new project with resource requirements
   */
  static async create(data: CreateProjectDto): Promise<ProjectWithDetails> {
    try {
      await prisma.$connect();

      // Generate unique project code in format: BSP-001
      const lastProject = await prisma.projects.findFirst({
        where: { code: { startsWith: 'BSP-' } },
        orderBy: { code: 'desc' },
        select: { code: true },
      });

      let nextCode = 1;
      if (lastProject) {
        const match = lastProject.code.match(/BSP-(\d+)/);
        if (match) nextCode = parseInt(match[1]) + 1;
      }

      const code = `BSP-${String(nextCode).padStart(3, '0')}`;

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

      // Convert Date fields
      const dateFields: any = {};
      if (projectData.deployment_date)
        dateFields.deployment_date = new Date(projectData.deployment_date);
      if (projectData.award_date) dateFields.award_date = new Date(projectData.award_date);
      if (projectData.start_date) dateFields.start_date = new Date(projectData.start_date);
      if (projectData.end_date) dateFields.end_date = new Date(projectData.end_date);
      if (projectData.revised_completion_date)
        dateFields.revised_completion_date = new Date(projectData.revised_completion_date);

      const project = await prisma.$transaction(
        async (tx) => {
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

          if (resource_requirements && resource_requirements.length > 0) {
            for (const req of resource_requirements) {
              const skillCategory = await tx.skill_categories.findUnique({
                where: { id: req.skill_category_id },
              });

              if (!skillCategory) {
                throw new AppError(
                  `Skill category with ID '${req.skill_category_id}' not found`,
                  400
                );
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

          return await tx.projects.findUnique({
            where: { id: createdProject.id },
            include: {
              employers: true,
              project_resource_requirements: {
                include: { skill_categories: true },
              },
            },
          });
        },
        { maxWait: 10000, timeout: 20000 }
      );

      if (!project) {
        throw new AppError('Failed to create project', 500);
      }

      return project as ProjectWithDetails;
    } catch (error) {
      console.error('Create project error:', error);
      if (error instanceof AppError) throw error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AppError(`Failed to create project: ${errorMessage}`, 500);
    }
  }
}
