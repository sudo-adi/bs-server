import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { sanitizeObject } from '@/utils/sanitize';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { generateProjectCode } from './helpers';

// Types
export interface ProjectCsvRow {
  name: string;
  employer_code: string;
  location?: string;
  contact_phone?: string;
  project_manager?: string;
  description?: string;
  poCoNumber?: string;
  deployment_date?: string;
  award_date?: string;
  start_date?: string;
  end_date?: string;
  revised_completion_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status?: string;
  current_attributable_to?: string;
  on_hold_reason?: string;
  termination_date?: string;
  termination_reason?: string;
  is_accommodation_provided?: string;
  contract_value?: string;
  revised_contract_value?: string;
  budget?: string;
  variation_order_value?: string;
  actual_cost_incurred?: string;
  misc_cost?: string;
}

export interface ProjectImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

export interface ProjectImportRowResult {
  rowNumber: number;
  success: boolean;
  errors?: string[];
  warnings?: string[];
  data?: ProjectCsvRow;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  employerCode?: string;
}

export interface ProjectImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  results: ProjectImportRowResult[];
}

interface ValidationError {
  field: string;
  message: string;
}

export class ProjectCsvImportService {
  /**
   * Parse CSV file content
   */
  private async parseCsv(fileContent: Buffer | string): Promise<ProjectCsvRow[]> {
    return new Promise((resolve, reject) => {
      const records: ProjectCsvRow[] = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });

      const stream = Readable.from(fileContent.toString());

      stream
        .pipe(parser)
        .on('data', (record: ProjectCsvRow) => {
          records.push(record);
        })
        .on('error', (error: Error) => {
          reject(new AppError(`CSV parsing error: ${error.message}`, 400));
        })
        .on('end', () => {
          resolve(records);
        });
    });
  }

  /**
   * Validate a CSV row
   */
  private validateRow(row: ProjectCsvRow): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!row.name?.trim()) {
      errors.push({ field: 'name', message: 'Project name is required' });
    }

    if (!row.employer_code?.trim()) {
      errors.push({ field: 'employer_code', message: 'Employer code is required' });
    }

    return errors;
  }

  /**
   * Parse boolean value from string
   */
  private parseBooleanValue(value?: string): boolean {
    if (!value) return false;
    const lowerValue = value.toLowerCase().trim();
    return ['yes', 'true', '1'].includes(lowerValue);
  }

  /**
   * Import a single CSV row
   */
  private async importRow(
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
      data: row,
    };

    try {
      // Validate row
      const validationErrors = this.validateRow(row);
      if (validationErrors.length > 0) {
        result.errors = validationErrors.map((e) => `${e.field}: ${e.message}`);
        return result;
      }

      // Sanitize data
      const sanitizedRow = sanitizeObject(row) as ProjectCsvRow;

      // Find employer by employer_code
      const employer = await prisma.employer.findFirst({
        where: { employerCode: sanitizedRow.employer_code },
      });

      if (!employer) {
        result.errors?.push(`Employer with code ${sanitizedRow.employer_code} not found`);
        result.employerCode = sanitizedRow.employer_code;
        result.projectName = sanitizedRow.name;
        return result;
      }

      // Check if employer is verified
      if (!employer.isVerified) {
        result.errors?.push(
          `Employer ${sanitizedRow.employer_code} is not verified. Please verify employer before importing their projects.`
        );
        result.employerCode = sanitizedRow.employer_code;
        result.projectName = sanitizedRow.name;
        return result;
      }

      // Normalize contact phone
      const contactPhone = sanitizedRow.contact_phone
        ? sanitizedRow.contact_phone.replace(/[\s\-\(\)]/g, '')
        : null;

      // Check for existing project by name and employer
      const existingProject = await prisma.project.findFirst({
        where: {
          name: sanitizedRow.name,
          employerId: employer.id,
          deletedAt: null,
        },
      });

      if (existingProject) {
        if (options.skipDuplicates) {
          result.warnings?.push('Project already exists, skipped');
          result.success = true;
          result.projectId = existingProject.id;
          result.projectCode = existingProject.projectCode || undefined;
          return result;
        } else if (!options.updateExisting) {
          result.errors?.push('Project with this name already exists for this employer');
          return result;
        }
      }

      // Create project with transaction
      const project = await prisma.$transaction(async (tx) => {
        const projectCode = existingProject?.projectCode || (await generateProjectCode(tx));

        const projectData = {
          name: sanitizedRow.name,
          location: sanitizedRow.location || null,
          contactPhone: contactPhone,
          description: sanitizedRow.description || null,
          poCoNumber: sanitizedRow.poCoNumber || null,
          deploymentDate: sanitizedRow.deployment_date
            ? new Date(sanitizedRow.deployment_date)
            : null,
          awardDate: sanitizedRow.award_date ? new Date(sanitizedRow.award_date) : null,
          startDate: sanitizedRow.start_date ? new Date(sanitizedRow.start_date) : null,
          endDate: sanitizedRow.end_date ? new Date(sanitizedRow.end_date) : null,
          revisedCompletionDate: sanitizedRow.revised_completion_date
            ? new Date(sanitizedRow.revised_completion_date)
            : null,
          actualStartDate: sanitizedRow.actual_start_date
            ? new Date(sanitizedRow.actual_start_date)
            : null,
          actualEndDate: sanitizedRow.actual_end_date
            ? new Date(sanitizedRow.actual_end_date)
            : null,
          stage: sanitizedRow.status?.toLowerCase() || 'planning',
          onHoldAttributableTo: sanitizedRow.current_attributable_to || null,
          stageChangeReason: sanitizedRow.on_hold_reason || null,
          terminationDate: sanitizedRow.termination_date
            ? new Date(sanitizedRow.termination_date)
            : null,
          isAccommodationProvided: this.parseBooleanValue(sanitizedRow.is_accommodation_provided),
          employerId: employer.id,
          createdByProfileId: userId || null,
          updatedAt: new Date(),
        };

        let newProject;
        if (existingProject && options.updateExisting) {
          newProject = await tx.project.update({
            where: { id: existingProject.id },
            data: projectData,
          });
        } else {
          newProject = await tx.project.create({
            data: {
              ...projectData,
              projectCode,
              isActive: true,
              createdAt: new Date(),
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
            contractValue: sanitizedRow.contract_value || null,
            revisedContractValue: sanitizedRow.revised_contract_value || null,
            budget: sanitizedRow.budget || null,
            variationOrderValue: sanitizedRow.variation_order_value || '0',
            actualCostIncurred: sanitizedRow.actual_cost_incurred || '0',
            miscCost: sanitizedRow.misc_cost || '0',
            updatedAt: new Date(),
          };

          const existingFinancials = await tx.projectFinancial.findFirst({
            where: { projectId: newProject.id },
          });

          if (existingFinancials) {
            await tx.projectFinancial.update({
              where: { id: existingFinancials.id },
              data: financialData,
            });
          } else {
            await tx.projectFinancial.create({
              data: {
                projectId: newProject.id,
                ...financialData,
                createdAt: new Date(),
              },
            });
          }
        }

        return newProject;
      });

      result.success = true;
      result.projectId = project.id;
      result.projectCode = project.projectCode || undefined;
      result.projectName = project.name!;
      result.employerCode = sanitizedRow.employer_code;
    } catch (error: unknown) {
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error occurred');
    }

    return result;
  }

  /**
   * Import projects from CSV file
   */
  async importProjects(
    fileContent: Buffer | string,
    options: ProjectImportOptions,
    userId?: string
  ): Promise<ProjectImportResult> {
    try {
      // Parse CSV
      const rows = await this.parseCsv(fileContent);

      if (rows.length === 0) {
        throw new AppError('CSV file is empty', 400);
      }

      // Import each row
      const results: ProjectImportRowResult[] = [];
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const rowResult = await this.importRow(
          rows[i],
          i + 2, // +2 for header row and 1-based indexing
          options,
          userId
        );
        results.push(rowResult);

        if (rowResult.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      logger.info('CSV import completed', { totalRows: rows.length, successCount, failureCount });

      return {
        totalRows: rows.length,
        successCount,
        failureCount,
        results,
      };
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error instanceof Error ? error.message : 'Failed to import CSV file', 400);
    }
  }
}

export default new ProjectCsvImportService();
