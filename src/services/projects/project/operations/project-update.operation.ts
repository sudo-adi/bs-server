import prisma from '@/config/prisma';
import type { Prisma } from '@/generated/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';
import { AppError } from '@/middlewares/errorHandler';
import type { ProjectWithDetails, UpdateProjectDto } from '@/types/prisma.types';

export class ProjectUpdateOperation {
  /**
   * Update a project and its resource requirements
   */
  static async update(id: string, data: UpdateProjectDto): Promise<ProjectWithDetails> {
    try {
      const { resource_requirements, ...projectData } = data;

      const project = await prisma.$transaction(async (tx) => {
        const existing = await tx.projects.findUnique({ where: { id } });

        if (!existing || existing.deleted_at) {
          throw new AppError('Project not found', 404);
        }

        const updateData: Prisma.projectsUpdateInput = {};
        const financialUpdates: any = {};
        let hasFinancialUpdates = false;

        // Handle financial data
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

        await tx.projects.update({ where: { id }, data: updateData });

        // Update resource requirements
        if (resource_requirements !== undefined) {
          await tx.project_resource_requirements.deleteMany({ where: { project_id: id } });

          if (resource_requirements.length > 0) {
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
                  project_id: id,
                  skill_category_id: req.skill_category_id,
                  required_count: req.required_count,
                  notes: req.notes,
                },
              });
            }
          }
        }

        return await tx.projects.findUnique({
          where: { id },
          include: {
            employers: true,
            project_resource_requirements: {
              include: { skill_categories: true },
            },
            project_assignments: {
              orderBy: { deployment_date: 'desc' },
              include: { profiles: true },
            },
            project_requests: true,
            project_financials: true,
          },
        });
      });

      if (!project) {
        throw new AppError('Failed to update project', 500);
      }

      return project as ProjectWithDetails;
    } catch (error) {
      console.error('Update project error:', error);
      if (error instanceof AppError) throw error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AppError(`Failed to update project: ${errorMessage}`, 500);
    }
  }
}
