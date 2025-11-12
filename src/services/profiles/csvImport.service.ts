import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { ProfileStage } from '@/types/enums';
import type {
  ImportOptions,
  ImportResult,
  ImportRowResult,
  ProfileCsvRow,
  ValidationError,
} from '@/types/csvImport.types';
import { sanitizeObject } from '@/utils/sanitize';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

export class CsvImportService {
  /**
   * Generate unique profile code
   */
  private async generateProfileCode(): Promise<string> {
    const prefix = 'BS';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Validate a single CSV row
   */
  private validateRow(row: ProfileCsvRow, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required fields
    if (!row.first_name || row.first_name.trim() === '') {
      errors.push({ field: 'first_name', message: 'First name is required' });
    }

    if (!row.phone || row.phone.trim() === '') {
      errors.push({ field: 'phone', message: 'Phone number is required' });
    } else {
      // Validate phone format (basic validation)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(row.phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push({
          field: 'phone',
          message: 'Phone number must be 10 digits',
        });
      }
    }

    // Validate email if provided
    if (row.email && row.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }
    }

    // Validate gender if provided
    if (row.gender && !['male', 'female', 'other'].includes(row.gender.toLowerCase())) {
      errors.push({
        field: 'gender',
        message: 'Gender must be male, female, or other',
      });
    }

    // Validate date of birth if provided
    if (row.date_of_birth && row.date_of_birth.trim() !== '') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.date_of_birth)) {
        errors.push({
          field: 'date_of_birth',
          message: 'Date of birth must be in YYYY-MM-DD format',
        });
      }
    }

    // Validate bank account if provided
    if (row.account_number && (!row.ifsc_code || !row.account_holder_name)) {
      errors.push({
        field: 'bank_account',
        message: 'IFSC code and account holder name are required when account number is provided',
      });
    }

    return errors;
  }

  /**
   * Parse CSV file content
   */
  async parseCSV(fileContent: Buffer | string): Promise<ProfileCsvRow[]> {
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

  /**
   * Import a single profile from CSV row
   */
  private async importProfileRow(
    row: ProfileCsvRow,
    rowNumber: number,
    options: ImportOptions,
    userId?: string
  ): Promise<ImportRowResult> {
    const result: ImportRowResult = {
      rowNumber,
      success: false,
      errors: [],
      warnings: [],
    };

    try {
      // Validate row
      const validationErrors = this.validateRow(row, rowNumber);
      if (validationErrors.length > 0) {
        result.errors = validationErrors.map((e) => `${e.field}: ${e.message}`);
        return result;
      }

      // Sanitize data
      const sanitizedRow = sanitizeObject(row);

      // Normalize phone number
      const phone = sanitizedRow.phone.replace(/[\s\-\(\)]/g, '');

      // Check for existing profile
      const existingProfile = await prisma.profiles.findFirst({
        where: {
          phone,
          deleted_at: null,
        },
      });

      if (existingProfile) {
        if (options.skipDuplicates) {
          result.warnings?.push('Profile already exists, skipped');
          result.success = true;
          result.profileId = existingProfile.id;
          result.candidateCode = existingProfile.candidate_code;
          return result;
        } else if (options.updateExisting) {
          result.warnings?.push('Profile already exists, will be updated');
        } else {
          result.errors?.push('Profile with this phone number already exists');
          return result;
        }
      }

      // Determine initial stage based on import type
      let initialStage: ProfileStage;
      if (options.importType === 'candidate') {
        initialStage = ProfileStage.NEW_REGISTRATION;
      } else {
        // For workers, default to onboarded
        initialStage = ProfileStage.ONBOARDED;
      }

      // Generate profile code
      const profileCode = await this.generateProfileCode();

      // Create profile with transaction
      const profile = await prisma.$transaction(async (tx) => {
        // Create or update profile
        let newProfile;

        if (existingProfile && options.updateExisting) {
          // Update existing profile
          newProfile = await tx.profiles.update({
            where: { id: existingProfile.id },
            data: {
              first_name: sanitizedRow.first_name,
              middle_name: sanitizedRow.middle_name || null,
              last_name: sanitizedRow.last_name || null,
              fathers_name: sanitizedRow.fathers_name || null,
              alt_phone: sanitizedRow.alt_phone || null,
              email: sanitizedRow.email || null,
              gender: sanitizedRow.gender?.toLowerCase() || null,
              date_of_birth: sanitizedRow.date_of_birth
                ? new Date(sanitizedRow.date_of_birth)
                : null,
              updated_at: new Date(),
            },
          });
        } else {
          // Create new profile
          newProfile = await tx.profiles.create({
            data: {
              candidate_code: profileCode,
              phone,
              alt_phone: sanitizedRow.alt_phone || null,
              email: sanitizedRow.email || null,
              first_name: sanitizedRow.first_name,
              middle_name: sanitizedRow.middle_name || null,
              last_name: sanitizedRow.last_name || null,
              fathers_name: sanitizedRow.fathers_name || null,
              gender: sanitizedRow.gender?.toLowerCase() || null,
              date_of_birth: sanitizedRow.date_of_birth
                ? new Date(sanitizedRow.date_of_birth)
                : null,
              is_active: true,
            },
          });

          // Create initial stage transition
          await tx.stage_transitions.create({
            data: {
              profile_id: newProfile.id,
              to_stage: initialStage,
              notes: `Imported via CSV as ${options.importType}`,
              transitioned_by_user_id: userId || null,
            },
          });
        }

        // Create address if provided
        if (
          sanitizedRow.house_number ||
          sanitizedRow.village_or_city ||
          sanitizedRow.district ||
          sanitizedRow.state
        ) {
          await tx.addresses.create({
            data: {
              profile_id: newProfile.id,
              address_type: sanitizedRow.address_type || 'permanent',
              house_number: sanitizedRow.house_number || null,
              village_or_city: sanitizedRow.village_or_city || null,
              district: sanitizedRow.district || null,
              state: sanitizedRow.state || null,
              postal_code: sanitizedRow.postal_code || null,
              landmark: sanitizedRow.landmark || null,
              police_station: sanitizedRow.police_station || null,
              post_office: sanitizedRow.post_office || null,
              is_current: sanitizedRow.address_type === 'current',
            },
          });
        }

        // Create document if provided
        if (sanitizedRow.doc_type && sanitizedRow.doc_number) {
          // First, find or create document category
          let docCategory = await tx.document_categories.findFirst({
            where: {
              name: {
                equals: sanitizedRow.doc_type,
                mode: 'insensitive',
              },
            },
          });

          if (!docCategory) {
            docCategory = await tx.document_categories.create({
              data: {
                name: sanitizedRow.doc_type,
                is_active: true,
              },
            });
          }

          // Note: We're creating a document record with document_number only
          // The actual file upload will need to be done separately
          // For now, we'll create a placeholder
          await tx.documents.create({
            data: {
              profile_id: newProfile.id,
              document_category_id: docCategory.id,
              document_number: sanitizedRow.doc_number,
              file_name: `${sanitizedRow.doc_type}_${sanitizedRow.doc_number}.pdf`,
              file_url: '', // Placeholder - file needs to be uploaded separately
              verification_status: 'pending',
              uploaded_by_user_id: userId || null,
            },
          });
        }

        // Create bank account if provided
        if (
          sanitizedRow.account_number &&
          sanitizedRow.ifsc_code &&
          sanitizedRow.account_holder_name
        ) {
          await tx.bank_accounts.create({
            data: {
              profile_id: newProfile.id,
              account_holder_name: sanitizedRow.account_holder_name,
              account_number: sanitizedRow.account_number,
              ifsc_code: sanitizedRow.ifsc_code,
              bank_name: sanitizedRow.bank_name || null,
              branch_name: sanitizedRow.branch_name || null,
              account_type: sanitizedRow.account_type || 'savings',
              is_primary: true,
              is_verified: false,
              verification_status: 'pending',
            },
          });
        }

        // Create qualification if provided
        if (sanitizedRow.qualification_type) {
          // Find or create qualification type
          let qualType = await tx.qualification_types.findFirst({
            where: {
              name: {
                equals: sanitizedRow.qualification_type,
                mode: 'insensitive',
              },
            },
          });

          if (!qualType) {
            qualType = await tx.qualification_types.create({
              data: {
                name: sanitizedRow.qualification_type,
                is_active: true,
              },
            });
          }

          await tx.qualifications.create({
            data: {
              profile_id: newProfile.id,
              qualification_type_id: qualType.id,
              institution_name: sanitizedRow.institution_name || null,
              field_of_study: sanitizedRow.field_of_study || null,
              year_of_completion: sanitizedRow.year_of_completion
                ? parseInt(sanitizedRow.year_of_completion)
                : null,
              percentage_or_grade: sanitizedRow.percentage_or_grade || null,
            },
          });
        }

        // Create skill if provided
        if (sanitizedRow.skill_category) {
          // Find or create skill category
          let skillCat = await tx.skill_categories.findFirst({
            where: {
              name: {
                equals: sanitizedRow.skill_category,
                mode: 'insensitive',
              },
            },
          });

          if (!skillCat) {
            skillCat = await tx.skill_categories.create({
              data: {
                name: sanitizedRow.skill_category,
                is_active: true,
              },
            });
          }

          await tx.profile_skills.create({
            data: {
              profile_id: newProfile.id,
              skill_category_id: skillCat.id,
              years_of_experience: sanitizedRow.years_of_experience
                ? parseInt(sanitizedRow.years_of_experience)
                : 0,
              is_primary: true,
            },
          });
        }

        return newProfile;
      });

      result.success = true;
      result.profileId = profile.id;
      result.candidateCode = profile.candidate_code;

      // Add warning if document was created without file
      if (sanitizedRow.doc_type && sanitizedRow.doc_number) {
        result.warnings?.push(
          'Document record created. File needs to be uploaded separately.'
        );
      }
    } catch (error: unknown) {
      result.errors?.push(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }

    return result;
  }

  /**
   * Import profiles from CSV file
   */
  async importProfiles(
    fileContent: Buffer | string,
    options: ImportOptions,
    userId?: string
  ): Promise<ImportResult> {
    try {
      // Parse CSV
      const rows = await this.parseCSV(fileContent);

      if (rows.length === 0) {
        throw new AppError('CSV file is empty', 400);
      }

      // Import each row
      const results: ImportRowResult[] = [];
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const rowResult = await this.importProfileRow(rows[i], i + 2, options, userId); // +2 for header row and 1-based indexing
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
      throw new AppError(
        error instanceof Error ? error.message : 'Failed to import CSV file',
        400
      );
    }
  }
}

export default new CsvImportService();
