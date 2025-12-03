import { AppError } from '@/middlewares/errorHandler';
import type { ProjectCsvRow } from '@/types';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

export class ProjectCsvParser {
  static async parse(fileContent: Buffer | string): Promise<ProjectCsvRow[]> {
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
}
