import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  CODE_CONFIG,
  CODE_ENTITY_TYPES,
  CODE_PREFIXES,
  CodeEntityType,
  CodePrefix,
} from '@/constants/codes';

/**
 * Universal Code Manager Service
 * Handles all code generation and management for different entity types
 *
 * Supports:
 * - BSC (BuildSewa Candidate): BSC-00001
 * - BSW (BuildSewa Worker): BSW-00001
 * - BSE (BuildSewa Employer): BSE-00001
 * - BSP (BuildSewa Project): BSP-00001
 * - BST (BuildSewa Training): BST-00001
 */
export class CodeManagerService {
  /**
   * Generate the next available code for a given entity type
   * @param entityType - The type of entity (candidate, worker, employer, etc.)
   * @returns The next available code (e.g., "BSC-00001")
   */
  async generateNextCode(entityType: CodeEntityType): Promise<string> {
    try {
      const config = CODE_CONFIG[entityType];
      const lastNumber = await this.getLastCodeNumber(entityType);
      const nextNumber = lastNumber + 1;

      const code = this.formatCode(config.prefix, nextNumber, config.length);

      logger.info('Generated new code', {
        entityType,
        code,
        lastNumber,
        nextNumber,
      });

      return code;
    } catch (error: any) {
      logger.error('Error generating code', { entityType, error });
      throw new Error(`Failed to generate code for ${entityType}: ${error.message}`);
    }
  }

  /**
   * Get the last assigned code number for an entity type
   * Uses MAX on the numeric portion to ensure we get the highest number, not just most recent
   * @param entityType - The type of entity
   * @returns The last assigned number (0 if none exist)
   */
  async getLastCodeNumber(entityType: CodeEntityType): Promise<number> {
    try {
      const config = CODE_CONFIG[entityType];
      let maxNumber = 0;

      // Query based on entity type - find the MAXIMUM code number, not just most recent
      switch (entityType) {
        case CODE_ENTITY_TYPES.CANDIDATE: {
          // Use raw SQL to efficiently find the max numeric portion
          const candidateResult = await prisma.$queryRaw<{ max_num: number | null }[]>`
            SELECT MAX(
              CAST(
                SUBSTRING("candidateCode" FROM '[0-9]+$') AS INTEGER
              )
            ) as max_num
            FROM profiles
            WHERE "candidateCode" IS NOT NULL
            AND "candidateCode" LIKE ${config.prefix + '%'}
          `;
          maxNumber = candidateResult[0]?.max_num || 0;
          break;
        }

        case CODE_ENTITY_TYPES.WORKER: {
          const workerResult = await prisma.$queryRaw<{ max_num: number | null }[]>`
            SELECT MAX(
              CAST(
                SUBSTRING("workerCode" FROM '[0-9]+$') AS INTEGER
              )
            ) as max_num
            FROM profiles
            WHERE "workerCode" IS NOT NULL
            AND "workerCode" LIKE ${config.prefix + '%'}
          `;
          maxNumber = workerResult[0]?.max_num || 0;
          break;
        }

        case CODE_ENTITY_TYPES.EMPLOYER: {
          const employerResult = await prisma.$queryRaw<{ max_num: number | null }[]>`
            SELECT MAX(
              CAST(
                SUBSTRING("employerCode" FROM '[0-9]+$') AS INTEGER
              )
            ) as max_num
            FROM employers
            WHERE "employerCode" IS NOT NULL
            AND "employerCode" LIKE ${config.prefix + '%'}
          `;
          maxNumber = employerResult[0]?.max_num || 0;
          break;
        }

        case CODE_ENTITY_TYPES.PROJECT: {
          // Projects don't have a dedicated code field yet, this is a placeholder
          maxNumber = 0;
          break;
        }

        case CODE_ENTITY_TYPES.TRAINING_BATCH: {
          const batchResult = await prisma.$queryRaw<{ max_num: number | null }[]>`
            SELECT MAX(
              CAST(
                SUBSTRING(code FROM '[0-9]+$') AS INTEGER
              )
            ) as max_num
            FROM training_batches
            WHERE code IS NOT NULL
            AND code LIKE ${config.prefix + '%'}
          `;
          maxNumber = batchResult[0]?.max_num || 0;
          break;
        }

        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      logger.info('Found max code number', { entityType, maxNumber });
      return maxNumber;
    } catch (error: any) {
      logger.error('Error getting last code number', { entityType, error });
      throw error;
    }
  }

  /**
   * Format a code with prefix and zero-padding
   * @param prefix - The code prefix (e.g., "BSC")
   * @param number - The number to format
   * @param length - The desired length of the number part
   * @returns Formatted code (e.g., "BSC-00001")
   */
  private formatCode(prefix: CodePrefix, number: number, length: number): string {
    const paddedNumber = String(number).padStart(length, '0');
    return `${prefix}-${paddedNumber}`;
  }

  /**
   * Validate if a code follows the correct format
   * @param code - The code to validate
   * @param entityType - The entity type
   * @returns True if valid, false otherwise
   */
  validateCode(code: string, entityType: CodeEntityType): boolean {
    const config = CODE_CONFIG[entityType];
    const regex = new RegExp(`^${config.prefix}-\\d{${config.length}}$`);
    return regex.test(code);
  }

  /**
   * Parse a code to extract its components
   * @param code - The code to parse
   * @returns Object with prefix and number
   */
  parseCode(code: string): { prefix: string; number: number } | null {
    const match = code.match(/^([A-Z]+)-(\d+)$/);
    if (match) {
      return {
        prefix: match[1],
        number: parseInt(match[2], 10),
      };
    }
    return null;
  }

  /**
   * Get entity type from code prefix
   * @param prefix - The code prefix
   * @returns Entity type or null if not found
   */
  getEntityTypeFromPrefix(prefix: string): CodeEntityType | null {
    const entries = Object.entries(CODE_PREFIXES) as [string, CodePrefix][];
    const entry = entries.find(([, p]) => p === prefix);
    if (entry) {
      const key = entry[0] as keyof typeof CODE_ENTITY_TYPES;
      return CODE_ENTITY_TYPES[key];
    }
    return null;
  }

  /**
   * Batch generate multiple codes
   * @param entityType - The entity type
   * @param count - Number of codes to generate
   * @returns Array of generated codes
   */
  async generateBatchCodes(entityType: CodeEntityType, count: number): Promise<string[]> {
    try {
      const config = CODE_CONFIG[entityType];
      const lastNumber = await this.getLastCodeNumber(entityType);

      const codes: string[] = [];
      for (let i = 1; i <= count; i++) {
        const nextNumber = lastNumber + i;
        const code = this.formatCode(config.prefix, nextNumber, config.length);
        codes.push(code);
      }

      logger.info('Generated batch codes', {
        entityType,
        count,
        startNumber: lastNumber + 1,
        endNumber: lastNumber + count,
      });

      return codes;
    } catch (error: any) {
      logger.error('Error generating batch codes', { entityType, count, error });
      throw new Error(`Failed to generate batch codes: ${error.message}`);
    }
  }

  /**
   * Check if a code already exists in the database
   * @param code - The code to check
   * @param entityType - The entity type
   * @returns True if exists, false otherwise
   */
  async codeExists(code: string, entityType: CodeEntityType): Promise<boolean> {
    try {
      // CODE_CONFIG[entityType] available if validation against config is needed
      switch (entityType) {
        case CODE_ENTITY_TYPES.CANDIDATE: {
          const candidate = await prisma.profile.findFirst({
            where: { candidateCode: code },
          });
          return !!candidate;
        }

        case CODE_ENTITY_TYPES.WORKER: {
          const worker = await prisma.profile.findFirst({
            where: { workerCode: code },
          });
          return !!worker;
        }

        case CODE_ENTITY_TYPES.EMPLOYER: {
          const employer = await prisma.employer.findFirst({
            where: { employerCode: code },
          });
          return !!employer;
        }

        case CODE_ENTITY_TYPES.TRAINING_BATCH: {
          const batch = await prisma.trainingBatch.findFirst({
            where: { code: code },
          });
          return !!batch;
        }

        default:
          return false;
      }
    } catch (error: any) {
      logger.error('Error checking code existence', { code, entityType, error });
      throw error;
    }
  }
}

export default new CodeManagerService();
