import { AppError } from '@/middlewares/errorHandler';
import type { TrainerImportOptions, TrainerImportResult, TrainerImportRowResult } from '@/types';
import { TrainerImportOperation } from './operations/trainer-import.operation';
import { TrainerCsvParser } from './parsers/csv.parser';

export class TrainerCsvImportService {
  /**
   * Import trainers from CSV file
   */
  async importTrainers(
    fileContent: Buffer | string,
    options: TrainerImportOptions,
    userId?: string
  ): Promise<TrainerImportResult> {
    try {
      // Parse CSV
      const rows = await TrainerCsvParser.parse(fileContent);

      if (rows.length === 0) {
        throw new AppError('CSV file is empty', 400);
      }

      // Import each row
      const results: TrainerImportRowResult[] = [];
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const rowResult = await TrainerImportOperation.importRow(
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

export default new TrainerCsvImportService();
