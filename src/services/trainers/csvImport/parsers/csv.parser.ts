import Papa from 'papaparse';
import type { TrainerCsvRow } from '@/types';

export class TrainerCsvParser {
  static async parse(fileContent: Buffer | string): Promise<TrainerCsvRow[]> {
    const content = fileContent instanceof Buffer ? fileContent.toString('utf-8') : fileContent;

    return new Promise((resolve, reject) => {
      Papa.parse(content as string, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: (results) => {
          resolve(results.data as TrainerCsvRow[]);
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  }
}
