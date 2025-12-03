import { CodeGenerator } from '@/utils/codeGenerator';

/**
 * @deprecated Use CodeGenerator from '@/utils/codeGenerator' instead
 * This helper is kept for backward compatibility only
 */
export class ProfileCodeHelper {
  /**
   * Generate unique profile code in format: BSW-00001
   * @deprecated Use CodeGenerator.generate('worker') instead
   */
  static async generate(): Promise<string> {
    return CodeGenerator.generate('worker');
  }
}
