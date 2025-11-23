import prisma from '@/config/prisma';
import { ProfileStage } from '@/types/enums';
import type { ImportOptions, ImportRowResult, ProfileCsvRow } from '@/types/csvImport.types';
import { sanitizeObject } from '@/utils/sanitize';
import { CsvRowValidator } from '../validators/csv-row.validator';
import { ProfileCodeHelper } from '../../profile/helpers/profile-code.helper';

export class ProfileImportOperation {
  static async importRow(
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
      const validationErrors = CsvRowValidator.validate(row, rowNumber);
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
      const profileCode = await ProfileCodeHelper.generate();

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
}
