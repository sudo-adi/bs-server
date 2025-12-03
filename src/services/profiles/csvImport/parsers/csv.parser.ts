import { AppError } from '@/middlewares/errorHandler';
import type { ProfileCsvRow } from '@/types';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

export class CsvParser {
  static async parse(fileContent: Buffer | string): Promise<ProfileCsvRow[]> {
    return new Promise((resolve, reject) => {
      const records: ProfileCsvRow[] = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true, // Handle BOM in CSV files
      });

      const stream = Readable.from(fileContent.toString());

      stream
        .pipe(parser)
        .on('data', (record: ProfileCsvRow) => {
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
