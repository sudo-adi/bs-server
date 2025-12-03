import prisma from '@/config/prisma';

/**
 * Entity code configuration
 */
export interface CodeConfig {
  prefix: string; // e.g., 'BSW', 'BSC', 'BSE'
  padding: number; // Number of digits to pad (e.g., 5 for 00001, 3 for 001)
  tableName: string; // Prisma table name
  columnName: string; // Column that stores the code
}

/**
 * Predefined code configurations for different entity types
 */
export const CODE_CONFIGS: Record<string, CodeConfig> = {
  // Profile/Worker related
  worker: {
    prefix: 'BSW',
    padding: 5,
    tableName: 'profiles',
    columnName: 'candidate_code',
  },
  candidate: {
    prefix: 'BSC',
    padding: 5,
    tableName: 'profiles',
    columnName: 'candidate_code',
  },

  // Employer related
  employer: {
    prefix: 'BSE',
    padding: 3,
    tableName: 'employers',
    columnName: 'employer_code',
  },

  // Training related
  training: {
    prefix: 'BST',
    padding: 3,
    tableName: 'training_batches',
    columnName: 'batch_code',
  },
  trainee: {
    prefix: 'BST',
    padding: 5,
    tableName: 'batch_enrollments',
    columnName: 'enrollment_code',
  },

  // Project related
  project: {
    prefix: 'BSP',
    padding: 3,
    tableName: 'projects',
    columnName: 'project_code',
  },

  // Trainer related
  trainer: {
    prefix: 'BSW',
    padding: 5,
    tableName: 'trainers',
    columnName: 'employee_code',
  },
};

/**
 * Generic code generator for all entity types
 */
export class CodeGenerator {

  static async generate(entityType: keyof typeof CODE_CONFIGS): Promise<string> {
    const config = CODE_CONFIGS[entityType];

    if (!config) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    return this.generateWithConfig(config);
  }

  static async generateWithConfig(config: CodeConfig): Promise<string> {
    const { prefix, padding, tableName, columnName } = config;

    // Build the search pattern (e.g., 'BSW-')
    const searchPrefix = `${prefix}-`;

    // Query the last code from the specified table
    const lastRecord = await (prisma as any)[tableName].findFirst({
      where: {
        [columnName]: {
          startsWith: searchPrefix,
        },
      },
      orderBy: {
        [columnName]: 'desc',
      },
      select: {
        [columnName]: true,
      },
    });

    // Extract the numeric part and increment
    let nextNumber = 1;
    if (lastRecord?.[columnName]) {
      const regex = new RegExp(`${prefix}-(\\d+)`);
      const match = lastRecord[columnName].match(regex);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format with padding (e.g., 'BSW-00001')
    return `${searchPrefix}${String(nextNumber).padStart(padding, '0')}`;
  }

  static validate(code: string, entityType: keyof typeof CODE_CONFIGS): boolean {
    const config = CODE_CONFIGS[entityType];
    if (!config) return false;

    const regex = new RegExp(`^${config.prefix}-\\d{${config.padding}}$`);
    return regex.test(code);
  }

  static parseNumber(code: string): number | null {
    const match = code.match(/^[A-Z]+-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }


  static getPrefix(entityType: keyof typeof CODE_CONFIGS): string {
    return CODE_CONFIGS[entityType]?.prefix || '';
  }
}

export class ProfileCodeHelper {
  static async generate(): Promise<string> {
    return CodeGenerator.generate('worker');
  }
}
