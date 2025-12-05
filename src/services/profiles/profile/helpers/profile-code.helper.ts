import { CodeGenerator } from '@/utils/codeGenerator';

/**
 * Profile Code Helper - Generates BSC codes for candidates
 */
export class ProfileCodeHelper {
  /**
   * Generate unique profile code in format: BSC-00001 (BuildSewa Candidate)
   * Changed from BSW (Worker) to BSC (Candidate) as per requirement
   */
  static async generate(): Promise<string> {
    return CodeGenerator.generate('candidate');
  }
}
