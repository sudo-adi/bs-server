import prisma from '@/config/prisma';
import type {
  ProjectImportOptions,
  ProjectImportRowResult,
  ProjectCsvRow,
} from '@/types';
import { sanitizeObject } from '@/utils/sanitize';
import { ProjectCsvRowValidator } from '../validators/csv-row.validator';

export class ProjectImportOperation {
  static async generateProjectCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PRJ-${year}-`;

    // Get the latest project code for this year
    const latestProject = await prisma.projects.findFirst({
      where: {
        code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    let nextNumber = 1;
    if (latestProject) {
      const lastNumber = parseInt(latestProject.code.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }

  static parseBooleanValue(value?: string): boolean {
    if (!value) return false;
    const lowerValue = value.toLowerCase().trim();
    return ['yes', 'true', '1'].includes(lowerValue);
  }

  static async importRow(
    row: ProjectCsvRow,
    rowNumber: number,
    options: ProjectImportOptions,
    userId?: string
  ): Promise<ProjectImportRowResult> {
    const result: ProjectImportRowResult = {
      rowNumber,
      success: false,
      errors: [],
      warnings: [],
      data: row, // Include row data for error reporting
    };

    try {
      // Validate row
      const validationErrors = ProjectCsvRowValidator.validate(row, rowNumber);
      if (validationErrors.length > 0) {
        result.errors = validationErrors.map((e) => `${e.field}: ${e.message}`);
        return result;
      }

      // Sanitize data
      const sanitizedRow = sanitizeObject(row);

      // Find employer by employer_code
      const employer = await prisma.employers.findUnique({
        where: { employer_code: sanitizedRow.employer_code },
      });

      if (!employer) {
        result.errors?.push(`Employer with code ${sanitizedRow.employer_code} not found`);
        result.employerCode = sanitizedRow.employer_code;
        result.projectName = sanitizedRow.name;
        return result;
      }

      // Check if employer is verified
      if (!employer.is_verified) {
        result.errors?.push(`Employer ${sanitizedRow.employer_code} is not verified. Please verify employer before importing their projects.`);
        result.employerCode = sanitizedRow.employer_code;
        result.projectName = sanitizedRow.name;
        return result;
      }

      // Normalize contact phone
      const contactPhone = sanitizedRow.contact_phone
        ? sanitizedRow.contact_phone.replace(/[\s\-\(\)]/g, '')
        : null;

      // Check for existing project by name and employer
      const existingProject = await prisma.projects.findFirst({
        where: {
          name: sanitizedRow.name,
          employer_id: employer.id,
          deleted_at: null,
        },
      });

      if (existingProject) {
        if (options.skipDuplicates) {
          result.warnings?.push('Project already exists, skipped');
          result.success = true;
          result.projectId = existingProject.id;
          result.projectCode = existingProject.code;
          return result;
        } else if (options.updateExisting) {
          result.warnings?.push('Project already exists, will be updated');
        } else {
          result.errors?.push('Project with this name already exists for this employer');
          return result;
        }
      }

      // Generate project code
      const projectCode = await this.generateProjectCode();

      // Create project with transaction
      const project = await prisma.$transaction(async (tx) => {
        // Create or update project
        let newProject;

        const projectData = {
          name: sanitizedRow.name,
          location: sanitizedRow.location || null,
          contact_phone: contactPhone,
          project_manager: sanitizedRow.project_manager || null,
          description: sanitizedRow.description || null,
          po_co_number: sanitizedRow.po_co_number || null,
          deployment_date: sanitizedRow.deployment_date
            ? new Date(sanitizedRow.deployment_date)
            : null,
          award_date: sanitizedRow.award_date ? new Date(sanitizedRow.award_date) : null,
          start_date: sanitizedRow.start_date ? new Date(sanitizedRow.start_date) : null,
          end_date: sanitizedRow.end_date ? new Date(sanitizedRow.end_date) : null,
          revised_completion_date: sanitizedRow.revised_completion_date
            ? new Date(sanitizedRow.revised_completion_date)
            : null,
          actual_start_date: sanitizedRow.actual_start_date
            ? new Date(sanitizedRow.actual_start_date)
            : null,
          actual_end_date: sanitizedRow.actual_end_date
            ? new Date(sanitizedRow.actual_end_date)
            : null,
          status: sanitizedRow.status?.toLowerCase() || 'planning',
          current_attributable_to: sanitizedRow.current_attributable_to || null,
          on_hold_reason: sanitizedRow.on_hold_reason || null,
          termination_date: sanitizedRow.termination_date
            ? new Date(sanitizedRow.termination_date)
            : null,
          termination_reason: sanitizedRow.termination_reason || null,
          is_accommodation_provided: this.parseBooleanValue(
            sanitizedRow.is_accommodation_provided
          ),
          employer_id: employer.id,
          created_by_user_id: userId || null,
          updated_at: new Date(),
        };

        if (existingProject && options.updateExisting) {
          // Update existing project
          newProject = await tx.projects.update({
            where: { id: existingProject.id },
            data: projectData,
          });
        } else {
          // Create new project
          newProject = await tx.projects.create({
            data: {
              ...projectData,
              code: projectCode,
              is_active: true,
            },
          });
        }

        // Create or update project financials if any financial data provided
        const hasFinancialData =
          sanitizedRow.contract_value ||
          sanitizedRow.revised_contract_value ||
          sanitizedRow.budget ||
          sanitizedRow.variation_order_value ||
          sanitizedRow.actual_cost_incurred ||
          sanitizedRow.misc_cost;

        if (hasFinancialData) {
          const financialData = {
            contract_value: sanitizedRow.contract_value
              ? parseFloat(sanitizedRow.contract_value)
              : null,
            revised_contract_value: sanitizedRow.revised_contract_value
              ? parseFloat(sanitizedRow.revised_contract_value)
              : null,
            budget: sanitizedRow.budget ? parseFloat(sanitizedRow.budget) : null,
            variation_order_value: sanitizedRow.variation_order_value
              ? parseFloat(sanitizedRow.variation_order_value)
              : 0,
            actual_cost_incurred: sanitizedRow.actual_cost_incurred
              ? parseFloat(sanitizedRow.actual_cost_incurred)
              : 0,
            misc_cost: sanitizedRow.misc_cost ? parseFloat(sanitizedRow.misc_cost) : 0,
            updated_at: new Date(),
          };

          // Check if financial record exists
          const existingFinancials = await tx.project_financials.findUnique({
            where: { project_id: newProject.id },
          });

          if (existingFinancials) {
            // Update existing
            await tx.project_financials.update({
              where: { project_id: newProject.id },
              data: financialData,
            });
          } else {
            // Create new
            await tx.project_financials.create({
              data: {
                project_id: newProject.id,
                ...financialData,
              },
            });
          }
        }

        return newProject;
      });

      result.success = true;
      result.projectId = project.id;
      result.projectCode = project.code;
      result.projectName = project.name;
      result.employerCode = sanitizedRow.employer_code;
    } catch (error: unknown) {
      result.errors?.push(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }

    return result;
  }
}
