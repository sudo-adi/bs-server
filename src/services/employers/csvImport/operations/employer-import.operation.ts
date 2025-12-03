import prisma from '@/config/prisma';
import type {
  EmployerImportOptions,
  EmployerImportRowResult,
  EmployerCsvRow,
} from '@/types';
import { sanitizeObject } from '@/utils/sanitize';
import { EmployerCsvRowValidator } from '../validators/csv-row.validator';
import bcrypt from 'bcrypt';

export class EmployerImportOperation {
  static async generateEmployerCode(): Promise<string> {
    const prefix = 'BSE-';

    // Get the latest employer code
    const latestEmployer = await prisma.employers.findFirst({
      where: {
        employer_code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    let nextNumber = 1;
    if (latestEmployer) {
      const lastNumber = parseInt(latestEmployer.employer_code.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  static async importRow(
    row: EmployerCsvRow,
    rowNumber: number,
    options: EmployerImportOptions,
    userId?: string
  ): Promise<EmployerImportRowResult> {
    const result: EmployerImportRowResult = {
      rowNumber,
      success: false,
      errors: [],
      warnings: [],
      data: row, // Include row data for error reporting
    };

    try {
      // Validate row
      const validationErrors = EmployerCsvRowValidator.validate(row, rowNumber);
      if (validationErrors.length > 0) {
        result.errors = validationErrors.map((e) => `${e.field}: ${e.message}`);
        return result;
      }

      // Sanitize data
      const sanitizedRow = sanitizeObject(row);

      // Normalize phone number
      const phone = sanitizedRow.phone.replace(/[\s\-\(\)]/g, '');

      // Check for existing employer by email
      const existingEmployer = await prisma.employers.findFirst({
        where: {
          email: sanitizedRow.email,
          deleted_at: null,
        },
      });

      if (existingEmployer) {
        if (options.skipDuplicates) {
          result.warnings?.push('Employer already exists, skipped');
          result.success = true;
          result.employerId = existingEmployer.id;
          result.employerCode = existingEmployer.employer_code;
          return result;
        } else if (options.updateExisting) {
          result.warnings?.push('Employer already exists, will be updated');
        } else {
          result.errors?.push('Employer with this email already exists');
          return result;
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(sanitizedRow.password, 10);

      // Generate employer code
      const employerCode = await this.generateEmployerCode();

      // Create employer with transaction
      const employer = await prisma.$transaction(async (tx) => {
        // Create or update employer
        let newEmployer;

        if (existingEmployer && options.updateExisting) {
          // Update existing employer
          newEmployer = await tx.employers.update({
            where: { id: existingEmployer.id },
            data: {
              company_name: sanitizedRow.company_name,
              client_name: sanitizedRow.client_name,
              phone,
              alt_phone: sanitizedRow.alt_phone || null,
              registered_address: sanitizedRow.registered_address || null,
              company_registration_number: sanitizedRow.company_registration_number || null,
              gst_number: sanitizedRow.gst_number?.toUpperCase() || null,
              updated_at: new Date(),
            },
          });
        } else {
          // Create new employer
          newEmployer = await tx.employers.create({
            data: {
              employer_code: employerCode,
              company_name: sanitizedRow.company_name,
              client_name: sanitizedRow.client_name,
              email: sanitizedRow.email,
              password_hash: passwordHash,
              phone,
              alt_phone: sanitizedRow.alt_phone || null,
              registered_address: sanitizedRow.registered_address || null,
              company_registration_number: sanitizedRow.company_registration_number || null,
              gst_number: sanitizedRow.gst_number?.toUpperCase() || null,
              is_active: true,
              is_verified: false,
            },
          });
        }

        // Create authorized person if provided
        if (
          sanitizedRow.authorized_person_name ||
          sanitizedRow.authorized_person_email ||
          sanitizedRow.authorized_person_phone
        ) {
          await tx.employer_authorized_persons.create({
            data: {
              employer_id: newEmployer.id,
              name: sanitizedRow.authorized_person_name || null,
              designation: sanitizedRow.authorized_person_designation || null,
              email: sanitizedRow.authorized_person_email || null,
              phone: sanitizedRow.authorized_person_phone || null,
              address: sanitizedRow.authorized_person_address || null,
              is_primary: true,
            },
          });
        }

        return newEmployer;
      });

      result.success = true;
      result.employerId = employer.id;
      result.employerCode = employer.employer_code;
    } catch (error: unknown) {
      result.errors?.push(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }

    return result;
  }
}
