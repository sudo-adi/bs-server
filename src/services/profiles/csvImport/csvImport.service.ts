import { AppError } from '@/middlewares/errorHandler';
import type { ImportOptions, ImportResult, ImportRowResult } from '@/types';
import { ProfileImportOperation } from './operations/profile-import.operation';
import { CsvParser } from './parsers/csv.parser';

export class CsvImportService {
  /**
   * Import profiles from CSV file
   */
  async importProfiles(
    fileContent: Buffer | string,
    options: ImportOptions,
    userId?: string
  ): Promise<ImportResult> {
    try {
      // Parse CSV
      const rows = await CsvParser.parse(fileContent);

      if (rows.length === 0) {
        throw new AppError('CSV file is empty', 400);
      }

      // Import each row
      const results: ImportRowResult[] = [];
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const rowResult = await ProfileImportOperation.importRow(
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
      throw new AppError(error instanceof Error ? error.message : 'Failed to import CSV file', 400);
    }
  }
}

export default new CsvImportService();
