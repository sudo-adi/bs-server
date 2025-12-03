import { AppError } from '@/middlewares/errorHandler';
import type {
  ProjectImportOptions,
  ProjectImportResult,
  ProjectImportRowResult,
} from '@/types';
import { ProjectImportOperation } from './operations/project-import.operation';
import { ProjectCsvParser } from './parsers/csv.parser';

export class ProjectCsvImportService {
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
      const rows = await ProjectCsvParser.parse(fileContent);

      if (rows.length === 0) {
        throw new AppError('CSV file is empty', 400);
      }

      // Import each row
      const results: ProjectImportRowResult[] = [];
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const rowResult = await ProjectImportOperation.importRow(
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
      throw new AppError(
        error instanceof Error ? error.message : 'Failed to import CSV file',
        400
      );
    }
  }
}

export default new ProjectCsvImportService();
