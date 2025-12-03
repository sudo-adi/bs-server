import { AppError } from '@/middlewares/errorHandler';
import type {
  EmployerImportOptions,
  EmployerImportResult,
  EmployerImportRowResult,
} from '@/types';
import { EmployerImportOperation } from './operations/employer-import.operation';
import { EmployerCsvParser } from './parsers/csv.parser';

export class EmployerCsvImportService {
  /**
   * Import employers from CSV file
   */
  async importEmployers(
    fileContent: Buffer | string,
    options: EmployerImportOptions,
    userId?: string
  ): Promise<EmployerImportResult> {
    try {
      // Parse CSV
      const rows = await EmployerCsvParser.parse(fileContent);

      if (rows.length === 0) {
        throw new AppError('CSV file is empty', 400);
      }

      // Import each row
      const results: EmployerImportRowResult[] = [];
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const rowResult = await EmployerImportOperation.importRow(
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

export default new EmployerCsvImportService();
