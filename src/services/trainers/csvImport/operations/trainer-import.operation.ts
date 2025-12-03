import prisma from '@/config/prisma';
import type { TrainerCsvRow, TrainerImportOptions, TrainerImportRowResult } from '@/types';
import { sanitizeObject } from '@/utils/sanitize';
import { TrainerCsvRowValidator } from '../validators/csv-row.validator';
import bcrypt from 'bcrypt';

export class TrainerImportOperation {
  static async generateEmployeeCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TRN-${year}-`;

    // Get the latest trainer code for this year
    const latestTrainer = await prisma.trainers.findFirst({
      where: {
        employee_code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    let nextNumber = 1;
    if (latestTrainer && latestTrainer.employee_code) {
      const lastNumber = parseInt(latestTrainer.employee_code.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }

  static async importRow(
    row: TrainerCsvRow,
    rowNumber: number,
    options: TrainerImportOptions,
    userId?: string
  ): Promise<TrainerImportRowResult> {
    const result: TrainerImportRowResult = {
      rowNumber,
      success: false,
      errors: [],
      warnings: [],
      data: row, // Include row data for error reporting
    };

    try {
      // Validate row
      const validationErrors = TrainerCsvRowValidator.validate(row, rowNumber);
      if (validationErrors.length > 0) {
        result.errors = validationErrors.map((e) => `${e.field}: ${e.message}`);
        return result;
      }

      // Sanitize data
      const sanitizedRow = sanitizeObject(row);

      // Normalize phone number
      const phone = sanitizedRow.phone.replace(/[\s\-()]/g, '');

      // Check for existing trainer by phone or email
      const existingTrainer = await prisma.trainers.findFirst({
        where: {
          OR: [{ phone }, ...(sanitizedRow.email ? [{ email: sanitizedRow.email }] : [])],
        },
      });

      if (existingTrainer) {
        if (options.skipDuplicates) {
          result.warnings?.push('Trainer already exists, skipped');
          result.success = true;
          result.trainerId = existingTrainer.id;
          result.employeeCode = existingTrainer.employee_code || undefined;
          return result;
        } else if (options.updateExisting) {
          result.warnings?.push('Trainer already exists, will be updated');
        } else {
          result.errors?.push('Trainer with this phone/email already exists');
          return result;
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(sanitizedRow.password, 10);

      // Generate employee code
      const employeeCode = await this.generateEmployeeCode();

      // Create trainer
      let trainer;

      if (existingTrainer && options.updateExisting) {
        // Update existing trainer
        trainer = await prisma.trainers.update({
          where: { id: existingTrainer.id },
          data: {
            name: sanitizedRow.name,
            phone,
            email: sanitizedRow.email || null,
            password_hash: passwordHash,
            profile_photo_url: sanitizedRow.profile_photo_url || null,
            updated_at: new Date(),
          },
        });
      } else {
        // Create new trainer
        trainer = await prisma.trainers.create({
          data: {
            name: sanitizedRow.name,
            phone,
            email: sanitizedRow.email || null,
            password_hash: passwordHash,
            employee_code: employeeCode,
            profile_photo_url: sanitizedRow.profile_photo_url || null,
            is_active: true,
            created_by_user_id: userId || null,
          },
        });
      }

      result.success = true;
      result.trainerId = trainer.id;
      result.employeeCode = trainer.employee_code || undefined;
    } catch (error: unknown) {
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error occurred');
    }

    return result;
  }
}
