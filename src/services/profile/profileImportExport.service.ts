import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import path from 'path';
import { ProfileService } from './profile.service';

// Valid worker types
const VALID_WORKER_TYPES = ['blue', 'white', 'trainer'];

// CSV column headers for candidate export
const CANDIDATE_EXPORT_HEADERS = [
  'candidate_code',
  'first_name',
  'middle_name',
  'last_name',
  'fathers_name',
  'phone',
  'alt_phone',
  'email',
  'gender',
  'date_of_birth',
  'worker_type',
  'profile_type',
  'current_stage',
  'isActive',
  'isVerified',
  // Address fields
  'address_type',
  'house_number',
  'village_or_city',
  'district',
  'state',
  'postal_code',
  'landmark',
  'police_station',
  'post_office',
  // Identity fields
  'aadhaar_number',
  'pan_number',
  'esic_number',
  'uan_number',
  'pf_account_number',
  'health_insurance_policy',
  'health_insurance_provider',
  'health_insurance_expiry',
  // Bank account fields
  'account_holder_name',
  'account_number',
  'ifsc_code',
  'bank_name',
  'branch_name',
  'account_type',
  'is_primary_account',
  // Qualification fields
  'qualification_type',
  'institution_name',
  'field_of_study',
  'year_of_completion',
  'percentage_or_grade',
  // Skill fields - primary
  'primary_skill',
  'primary_skill_experience',
  // Skill fields - secondary (JSON array)
  'secondary_skills',
  // Language
  'languages',
  // Timestamps
  'createdAt',
  'candidate_approved_at',
];

// Backwards compatibility alias
const EXPORT_HEADERS = CANDIDATE_EXPORT_HEADERS;

// CSV column headers for worker export
const WORKER_EXPORT_HEADERS = [
  'worker_code',
  'candidate_code',
  'first_name',
  'middle_name',
  'last_name',
  'fathers_name',
  'phone',
  'alt_phone',
  'email',
  'gender',
  'date_of_birth',
  'worker_type',
  'profile_type',
  'current_stage',
  'isActive',
  'isVerified',
  // Address fields
  'address_type',
  'house_number',
  'village_or_city',
  'district',
  'state',
  'postal_code',
  'landmark',
  'police_station',
  'post_office',
  // Identity fields
  'aadhaar_number',
  'pan_number',
  'esic_number',
  'uan_number',
  'pf_account_number',
  'health_insurance_policy',
  'health_insurance_provider',
  'health_insurance_expiry',
  // Bank account fields
  'account_holder_name',
  'account_number',
  'ifsc_code',
  'bank_name',
  'branch_name',
  'account_type',
  'is_primary_account',
  // Qualification fields
  'qualification_type',
  'institution_name',
  'field_of_study',
  'year_of_completion',
  'percentage_or_grade',
  // Skill fields - primary
  'primary_skill',
  'primary_skill_experience',
  // Skill fields - secondary (JSON array)
  'secondary_skills',
  // Language
  'languages',
  // Timestamps
  'createdAt',
  'worker_converted_at',
];

// CSV column headers for staff export (white collar workers)
const STAFF_EXPORT_HEADERS = [
  'worker_code',
  'candidate_code',
  'first_name',
  'middle_name',
  'last_name',
  'fathers_name',
  'phone',
  'alt_phone',
  'email',
  'gender',
  'date_of_birth',
  'worker_type',
  'profile_type',
  'current_stage',
  'isActive',
  'isVerified',
  // Address fields
  'address_type',
  'house_number',
  'village_or_city',
  'district',
  'state',
  'postal_code',
  'landmark',
  'police_station',
  'post_office',
  // Identity fields
  'aadhaar_number',
  'pan_number',
  'esic_number',
  'uan_number',
  'pf_account_number',
  'health_insurance_policy',
  'health_insurance_provider',
  'health_insurance_expiry',
  // Bank account fields
  'account_holder_name',
  'account_number',
  'ifsc_code',
  'bank_name',
  'branch_name',
  'account_type',
  'is_primary_account',
  // Qualification fields
  'qualification_type',
  'institution_name',
  'field_of_study',
  'year_of_completion',
  'percentage_or_grade',
  // Skill fields - primary
  'primary_skill',
  'primary_skill_experience',
  // Skill fields - secondary (JSON array)
  'secondary_skills',
  // Language
  'languages',
  // Timestamps
  'createdAt',
  'worker_converted_at',
];

// CSV column headers for import template
const IMPORT_HEADERS = [
  'first_name',
  'middle_name',
  'last_name',
  'fathers_name',
  'phone',
  'alt_phone',
  'email',
  'gender',
  'date_of_birth',
  'worker_type',
  // Address
  'address_type',
  'house_number',
  'village_or_city',
  'district',
  'state',
  'postal_code',
  'landmark',
  'police_station',
  'post_office',
  // Identity
  'aadhaar_number',
  'pan_number',
  'esic_number',
  'uan_number',
  'pf_account_number',
  'health_insurance_policy',
  'health_insurance_provider',
  'health_insurance_expiry',
  // Bank account
  'account_holder_name',
  'account_number',
  'ifsc_code',
  'bank_name',
  'branch_name',
  'account_type',
  'is_primary_account',
  // Qualification
  'qualification_type',
  'institution_name',
  'field_of_study',
  'year_of_completion',
  'percentage_or_grade',
  // Primary skill
  'primary_skill',
  'primary_skill_experience',
  // Secondary skills (JSON array: [{"skill":"Welding","experience":2}])
  'secondary_skills',
  // Language
  'language',
];

export interface ImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  createdProfiles: string[];
  updatedProfiles: string[];
}

export class ProfileImportExportService {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  /**
   * Export candidates to CSV format
   */
  async exportCandidates(): Promise<string> {
    try {
      // Fetch all candidates with full details
      const profiles = await prisma.profile.findMany({
        where: {
          profileType: 'candidate',
          deletedAt: null,
        },
        include: {
          identity: true,
          addresses: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Get the most recent address
          },
          bankAccounts: {
            where: { isPrimary: true },
            take: 1,
          },
          qualifications: {
            orderBy: { yearOfCompletion: 'desc' },
            take: 1, // Get the most recent qualification
            include: {
              qualificationType: true,
            },
          },
          skills: {
            include: {
              skillCategory: true,
            },
          },
          languages: {
            include: {
              language: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform profiles to export format
      const exportData = profiles.map((profile) => {
        const address = profile.addresses[0];
        const bankAccount = profile.bankAccounts[0];
        const qualification = profile.qualifications[0];
        const identity = profile.identity;
        const languages = profile.languages
          .map((l) => l.language?.name)
          .filter(Boolean)
          .join(', ');

        // Separate primary and secondary skills
        const primarySkill = profile.skills.find((s) => s.isPrimary);
        const secondarySkills = profile.skills
          .filter((s) => !s.isPrimary)
          .map((s) => ({
            skill: s.skillCategory?.name || '',
            experience: s.yearsOfExperience || 0,
          }));

        return {
          candidate_code: profile.candidateCode || '',
          first_name: profile.firstName || '',
          middle_name: profile.middleName || '',
          last_name: profile.lastName || '',
          fathers_name: profile.fathersName || '',
          phone: profile.phone || '',
          alt_phone: profile.altPhone || '',
          email: profile.email || '',
          gender: profile.gender || '',
          date_of_birth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : '',
          worker_type: profile.workerType || '',
          profile_type: profile.profileType || '',
          current_stage: profile.currentStage || '',
          isActive: profile.isActive ? 'true' : 'false',
          isVerified: profile.isVerified ? 'true' : 'false',
          // Address
          address_type: address?.addressType || '',
          house_number: address?.houseNumber || '',
          village_or_city: address?.villageOrCity || '',
          district: address?.district || '',
          state: address?.state || '',
          postal_code: address?.postalCode || '',
          landmark: address?.landmark || '',
          police_station: address?.policeStation || '',
          post_office: address?.postOffice || '',
          // Identity
          aadhaar_number: identity?.aadhaarNumber || '',
          pan_number: identity?.panNumber || '',
          esic_number: identity?.esicNumber || '',
          uan_number: identity?.uanNumber || '',
          pf_account_number: identity?.pfAccountNumber || '',
          health_insurance_policy: identity?.healthInsurancePolicy || '',
          health_insurance_provider: identity?.healthInsuranceProvider || '',
          health_insurance_expiry: identity?.healthInsuranceExpiry
            ? identity.healthInsuranceExpiry.toISOString().split('T')[0]
            : '',
          // Bank Account
          account_holder_name: bankAccount?.accountHolderName || '',
          account_number: bankAccount?.accountNumber || '',
          ifsc_code: bankAccount?.ifscCode || '',
          bank_name: bankAccount?.bankName || '',
          branch_name: bankAccount?.branchName || '',
          account_type: bankAccount?.accountType || '',
          is_primary_account: bankAccount?.isPrimary ? 'true' : 'false',
          // Qualification
          qualification_type: qualification?.qualificationType?.name || '',
          institution_name: qualification?.institutionName || '',
          field_of_study: qualification?.fieldOfStudy || '',
          year_of_completion: qualification?.yearOfCompletion || '',
          percentage_or_grade: qualification?.percentageOrGrade || '',
          // Primary Skill
          primary_skill: primarySkill?.skillCategory?.name || '',
          primary_skill_experience: primarySkill?.yearsOfExperience || '',
          // Secondary Skills (JSON)
          secondary_skills: secondarySkills.length > 0 ? JSON.stringify(secondarySkills) : '',
          // Languages
          languages,
          // Timestamps
          createdAt: profile.createdAt ? profile.createdAt.toISOString() : '',
          candidate_approved_at: profile.candidateApprovedAt
            ? profile.candidateApprovedAt.toISOString()
            : '',
        };
      });

      // Convert to CSV
      const csv = stringify(exportData, {
        header: true,
        columns: EXPORT_HEADERS,
      });

      logger.info('Candidates exported successfully', {
        count: profiles.length,
      });

      return csv;
    } catch (error) {
      logger.error('Error exporting candidates', { error });
      throw new Error('Failed to export candidates');
    }
  }

  /**
   * Export workers to CSV format (blue collar workers)
   */
  async exportWorkers(): Promise<string> {
    try {
      // Fetch all workers (profileType = 'worker', workerType = 'blue')
      const profiles = await prisma.profile.findMany({
        where: {
          profileType: 'worker',
          workerType: 'blue',
          deletedAt: null,
        },
        include: {
          identity: true,
          addresses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          bankAccounts: {
            where: { isPrimary: true },
            take: 1,
          },
          qualifications: {
            orderBy: { yearOfCompletion: 'desc' },
            take: 1,
            include: {
              qualificationType: true,
            },
          },
          skills: {
            include: {
              skillCategory: true,
            },
          },
          languages: {
            include: {
              language: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform profiles to export format
      const exportData = profiles.map((profile) => {
        const address = profile.addresses[0];
        const bankAccount = profile.bankAccounts[0];
        const qualification = profile.qualifications[0];
        const identity = profile.identity;
        const languages = profile.languages
          .map((l) => l.language?.name)
          .filter(Boolean)
          .join(', ');

        // Separate primary and secondary skills
        const primarySkill = profile.skills.find((s) => s.isPrimary);
        const secondarySkills = profile.skills
          .filter((s) => !s.isPrimary)
          .map((s) => ({
            skill: s.skillCategory?.name || '',
            experience: s.yearsOfExperience || 0,
          }));

        return {
          worker_code: profile.workerCode || '',
          candidate_code: profile.candidateCode || '',
          first_name: profile.firstName || '',
          middle_name: profile.middleName || '',
          last_name: profile.lastName || '',
          fathers_name: profile.fathersName || '',
          phone: profile.phone || '',
          alt_phone: profile.altPhone || '',
          email: profile.email || '',
          gender: profile.gender || '',
          date_of_birth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : '',
          worker_type: profile.workerType || '',
          profile_type: profile.profileType || '',
          current_stage: profile.currentStage || '',
          isActive: profile.isActive ? 'true' : 'false',
          isVerified: profile.isVerified ? 'true' : 'false',
          // Address
          address_type: address?.addressType || '',
          house_number: address?.houseNumber || '',
          village_or_city: address?.villageOrCity || '',
          district: address?.district || '',
          state: address?.state || '',
          postal_code: address?.postalCode || '',
          landmark: address?.landmark || '',
          police_station: address?.policeStation || '',
          post_office: address?.postOffice || '',
          // Identity
          aadhaar_number: identity?.aadhaarNumber || '',
          pan_number: identity?.panNumber || '',
          esic_number: identity?.esicNumber || '',
          uan_number: identity?.uanNumber || '',
          pf_account_number: identity?.pfAccountNumber || '',
          health_insurance_policy: identity?.healthInsurancePolicy || '',
          health_insurance_provider: identity?.healthInsuranceProvider || '',
          health_insurance_expiry: identity?.healthInsuranceExpiry
            ? identity.healthInsuranceExpiry.toISOString().split('T')[0]
            : '',
          // Bank Account
          account_holder_name: bankAccount?.accountHolderName || '',
          account_number: bankAccount?.accountNumber || '',
          ifsc_code: bankAccount?.ifscCode || '',
          bank_name: bankAccount?.bankName || '',
          branch_name: bankAccount?.branchName || '',
          account_type: bankAccount?.accountType || '',
          is_primary_account: bankAccount?.isPrimary ? 'true' : 'false',
          // Qualification
          qualification_type: qualification?.qualificationType?.name || '',
          institution_name: qualification?.institutionName || '',
          field_of_study: qualification?.fieldOfStudy || '',
          year_of_completion: qualification?.yearOfCompletion || '',
          percentage_or_grade: qualification?.percentageOrGrade || '',
          // Primary Skill
          primary_skill: primarySkill?.skillCategory?.name || '',
          primary_skill_experience: primarySkill?.yearsOfExperience || '',
          // Secondary Skills (JSON)
          secondary_skills: secondarySkills.length > 0 ? JSON.stringify(secondarySkills) : '',
          // Languages
          languages,
          // Timestamps
          createdAt: profile.createdAt ? profile.createdAt.toISOString() : '',
          worker_converted_at: profile.workerConvertedAt
            ? profile.workerConvertedAt.toISOString()
            : '',
        };
      });

      // Convert to CSV
      const csv = stringify(exportData, {
        header: true,
        columns: WORKER_EXPORT_HEADERS,
      });

      logger.info('Workers exported successfully', {
        count: profiles.length,
      });

      return csv;
    } catch (error) {
      logger.error('Error exporting workers', { error });
      throw new Error('Failed to export workers');
    }
  }

  /**
   * Export staff to CSV format (white collar and trainer workers)
   */
  async exportStaff(): Promise<string> {
    try {
      // Fetch all staff (workerType = 'white' OR 'trainer')
      const profiles = await prisma.profile.findMany({
        where: {
          OR: [{ workerType: 'white' }, { workerType: 'trainer' }],
          deletedAt: null,
        },
        include: {
          identity: true,
          addresses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          bankAccounts: {
            where: { isPrimary: true },
            take: 1,
          },
          qualifications: {
            orderBy: { yearOfCompletion: 'desc' },
            take: 1,
            include: {
              qualificationType: true,
            },
          },
          skills: {
            include: {
              skillCategory: true,
            },
          },
          languages: {
            include: {
              language: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform profiles to export format
      const exportData = profiles.map((profile) => {
        const address = profile.addresses[0];
        const bankAccount = profile.bankAccounts[0];
        const qualification = profile.qualifications[0];
        const identity = profile.identity;
        const languages = profile.languages
          .map((l) => l.language?.name)
          .filter(Boolean)
          .join(', ');

        // Separate primary and secondary skills
        const primarySkill = profile.skills.find((s) => s.isPrimary);
        const secondarySkills = profile.skills
          .filter((s) => !s.isPrimary)
          .map((s) => ({
            skill: s.skillCategory?.name || '',
            experience: s.yearsOfExperience || 0,
          }));

        return {
          worker_code: profile.workerCode || '',
          candidate_code: profile.candidateCode || '',
          first_name: profile.firstName || '',
          middle_name: profile.middleName || '',
          last_name: profile.lastName || '',
          fathers_name: profile.fathersName || '',
          phone: profile.phone || '',
          alt_phone: profile.altPhone || '',
          email: profile.email || '',
          gender: profile.gender || '',
          date_of_birth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : '',
          worker_type: profile.workerType || '',
          profile_type: profile.profileType || '',
          current_stage: profile.currentStage || '',
          isActive: profile.isActive ? 'true' : 'false',
          isVerified: profile.isVerified ? 'true' : 'false',
          // Address
          address_type: address?.addressType || '',
          house_number: address?.houseNumber || '',
          village_or_city: address?.villageOrCity || '',
          district: address?.district || '',
          state: address?.state || '',
          postal_code: address?.postalCode || '',
          landmark: address?.landmark || '',
          police_station: address?.policeStation || '',
          post_office: address?.postOffice || '',
          // Identity
          aadhaar_number: identity?.aadhaarNumber || '',
          pan_number: identity?.panNumber || '',
          esic_number: identity?.esicNumber || '',
          uan_number: identity?.uanNumber || '',
          pf_account_number: identity?.pfAccountNumber || '',
          health_insurance_policy: identity?.healthInsurancePolicy || '',
          health_insurance_provider: identity?.healthInsuranceProvider || '',
          health_insurance_expiry: identity?.healthInsuranceExpiry
            ? identity.healthInsuranceExpiry.toISOString().split('T')[0]
            : '',
          // Bank Account
          account_holder_name: bankAccount?.accountHolderName || '',
          account_number: bankAccount?.accountNumber || '',
          ifsc_code: bankAccount?.ifscCode || '',
          bank_name: bankAccount?.bankName || '',
          branch_name: bankAccount?.branchName || '',
          account_type: bankAccount?.accountType || '',
          is_primary_account: bankAccount?.isPrimary ? 'true' : 'false',
          // Qualification
          qualification_type: qualification?.qualificationType?.name || '',
          institution_name: qualification?.institutionName || '',
          field_of_study: qualification?.fieldOfStudy || '',
          year_of_completion: qualification?.yearOfCompletion || '',
          percentage_or_grade: qualification?.percentageOrGrade || '',
          // Primary Skill
          primary_skill: primarySkill?.skillCategory?.name || '',
          primary_skill_experience: primarySkill?.yearsOfExperience || '',
          // Secondary Skills (JSON)
          secondary_skills: secondarySkills.length > 0 ? JSON.stringify(secondarySkills) : '',
          // Languages
          languages,
          // Timestamps
          createdAt: profile.createdAt ? profile.createdAt.toISOString() : '',
          worker_converted_at: profile.workerConvertedAt
            ? profile.workerConvertedAt.toISOString()
            : '',
        };
      });

      // Convert to CSV
      const csv = stringify(exportData, {
        header: true,
        columns: STAFF_EXPORT_HEADERS,
      });

      logger.info('Staff exported successfully', {
        count: profiles.length,
      });

      return csv;
    } catch (error) {
      logger.error('Error exporting staff', { error });
      throw new Error('Failed to export staff');
    }
  }

  /**
   * Import candidates from CSV data
   */
  async importCandidates(
    csvData: string,
    options: ImportOptions = {},
    createdByProfileId?: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalRows: 0,
      successCount: 0,
      failureCount: 0,
      errors: [],
      createdProfiles: [],
      updatedProfiles: [],
    };

    try {
      // Parse CSV data
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];

      result.totalRows = records.length;

      // Process each row
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // +2 because of 0-index and header row

        try {
          // Validate required fields
          if (!row.first_name || !row.last_name || !row.phone) {
            result.errors.push({
              row: rowNumber,
              error: 'Missing required fields: first_name, last_name, and phone are required',
              data: row,
            });
            result.failureCount++;
            continue;
          }

          // Validate worker_type if provided
          if (row.worker_type && !VALID_WORKER_TYPES.includes(row.worker_type.toLowerCase())) {
            result.errors.push({
              row: rowNumber,
              error: `Invalid worker_type: ${row.worker_type}. Must be one of: ${VALID_WORKER_TYPES.join(', ')}`,
              data: row,
            });
            result.failureCount++;
            continue;
          }

          // Check for duplicate phone
          const existingProfile = await prisma.profile.findFirst({
            where: { phone: row.phone, deletedAt: null },
          });

          if (existingProfile) {
            if (options.skipDuplicates) {
              logger.info('Skipping duplicate phone', { phone: row.phone, row: rowNumber });
              continue;
            }

            if (options.updateExisting) {
              // Update existing profile
              await this.updateProfileFromRow(existingProfile.id, row);
              result.updatedProfiles.push(existingProfile.id);
              result.successCount++;
              continue;
            }

            result.errors.push({
              row: rowNumber,
              error: `Phone number ${row.phone} already exists`,
              data: row,
            });
            result.failureCount++;
            continue;
          }

          // Create new profile
          const profileId = await this.createProfileFromRow(row, createdByProfileId);
          result.createdProfiles.push(profileId);
          result.successCount++;
        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            error: error.message || 'Unknown error',
            data: row,
          });
          result.failureCount++;
        }
      }

      logger.info('Candidates import completed', {
        total: result.totalRows,
        success: result.successCount,
        failed: result.failureCount,
      });

      return result;
    } catch (error: any) {
      logger.error('Error importing candidates', { error });
      throw new Error(error.message || 'Failed to import candidates');
    }
  }

  /**
   * Create a profile from CSV row data
   */
  private async createProfileFromRow(row: any, createdByProfileId?: string): Promise<string> {
    return await prisma.$transaction(async (tx) => {
      // Create profile
      const profile = await tx.profile.create({
        data: {
          firstName: row.first_name,
          middleName: row.middle_name || null,
          lastName: row.last_name,
          fathersName: row.fathers_name || null,
          phone: row.phone,
          altPhone: row.alt_phone || null,
          email: row.email || null,
          gender: row.gender || null,
          dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : null,
          workerType: row.worker_type || 'blue',
          profileType: 'candidate',
          currentStage: 'NEW_REGISTRATION',
          isActive: true,
          isVerified: false,
        },
      });

      // Create identity if any identity fields are provided
      if (
        row.aadhaar_number ||
        row.pan_number ||
        row.esic_number ||
        row.uan_number ||
        row.pf_account_number ||
        row.health_insurance_policy
      ) {
        const identityData: any = {
          profileId: profile.id,
          updatedAt: new Date(),
        };

        if (row.aadhaar_number) identityData.aadhaarNumber = row.aadhaar_number;
        if (row.pan_number) identityData.panNumber = row.pan_number;
        if (row.esic_number) identityData.esicNumber = row.esic_number;
        if (row.uan_number) identityData.uanNumber = row.uan_number;
        if (row.pf_account_number) identityData.pfAccountNumber = row.pf_account_number;
        if (row.health_insurance_policy)
          identityData.healthInsurancePolicy = row.health_insurance_policy;
        if (row.health_insurance_provider)
          identityData.healthInsuranceProvider = row.health_insurance_provider;
        if (row.health_insurance_expiry)
          identityData.healthInsuranceExpiry = new Date(row.health_insurance_expiry);

        await tx.profileIdentity.create({ data: identityData });
      }

      // Create address if any address fields are provided
      if (row.village_or_city || row.district || row.state) {
        await tx.profileAddress.create({
          data: {
            profileId: profile.id,
            addressType: row.address_type || 'permanent',
            houseNumber: row.house_number || null,
            villageOrCity: row.village_or_city || null,
            district: row.district || null,
            state: row.state || null,
            postalCode: row.postal_code || null,
            landmark: row.landmark || null,
            policeStation: row.police_station || null,
            postOffice: row.post_office || null,
          },
        });
      }

      // Create bank account if any bank fields are provided
      if (row.account_number || row.ifsc_code || row.bank_name) {
        await tx.profileBankAccount.create({
          data: {
            profileId: profile.id,
            accountHolderName: row.account_holder_name || `${row.first_name} ${row.last_name}`,
            accountNumber: row.account_number || null,
            ifscCode: row.ifsc_code || null,
            bankName: row.bank_name || null,
            branchName: row.branch_name || null,
            accountType: row.account_type || 'savings',
            isPrimary: row.is_primary_account === 'true',
          },
        });
      }

      // Create qualification if any qualification fields are provided
      if (row.qualification_type || row.institution_name) {
        // Find or get qualification type
        let qualificationTypeId: string | null = null;
        if (row.qualification_type) {
          const qualificationType = await tx.profileQualificationType.findFirst({
            where: {
              name: { equals: row.qualification_type, mode: 'insensitive' },
            },
          });
          qualificationTypeId = qualificationType?.id || null;
        }

        if (qualificationTypeId) {
          await tx.profileQualification.create({
            data: {
              profileId: profile.id,
              qualificationTypeId,
              institutionName: row.institution_name || null,
              fieldOfStudy: row.field_of_study || null,
              yearOfCompletion: row.year_of_completion ? parseInt(row.year_of_completion) : null,
              percentageOrGrade: row.percentage_or_grade || null,
            },
          });
        }
      }

      // Create primary skill if provided
      if (row.primary_skill) {
        const skillCategory = await tx.skillCategory.findFirst({
          where: {
            name: { equals: row.primary_skill, mode: 'insensitive' },
          },
        });

        if (skillCategory) {
          await tx.profileSkill.create({
            data: {
              profileId: profile.id,
              skillCategoryId: skillCategory.id,
              yearsOfExperience: row.primary_skill_experience
                ? parseInt(row.primary_skill_experience)
                : null,
              isPrimary: true,
            },
          });
        }
      }

      // Create secondary skills if provided (JSON array)
      if (row.secondary_skills) {
        try {
          const secondarySkills = JSON.parse(row.secondary_skills);
          if (Array.isArray(secondarySkills)) {
            for (const skillData of secondarySkills) {
              const skillName = skillData.skill || skillData.name;
              if (skillName) {
                const skillCategory = await tx.skillCategory.findFirst({
                  where: {
                    name: { equals: skillName, mode: 'insensitive' },
                  },
                });

                if (skillCategory) {
                  await tx.profileSkill.create({
                    data: {
                      profileId: profile.id,
                      skillCategoryId: skillCategory.id,
                      yearsOfExperience: skillData.experience
                        ? parseInt(skillData.experience)
                        : null,
                      isPrimary: false,
                    },
                  });
                }
              }
            }
          }
        } catch (e) {
          logger.warn('Failed to parse secondary_skills JSON', {
            profileId: profile.id,
            value: row.secondary_skills,
          });
        }
      }

      // Create language if provided
      if (row.language) {
        const language = await tx.language.findFirst({
          where: {
            name: { equals: row.language, mode: 'insensitive' },
          },
        });

        if (language) {
          await tx.profileLanguage.create({
            data: {
              profileId: profile.id,
              languageId: language.id,
            },
          });
        }
      }

      return profile.id;
    });
  }

  /**
   * Update an existing profile from CSV row data
   */
  private async updateProfileFromRow(profileId: string, row: any): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Update main profile
      await tx.profile.update({
        where: { id: profileId },
        data: {
          firstName: row.first_name,
          middleName: row.middle_name || null,
          lastName: row.last_name,
          fathersName: row.fathers_name || null,
          altPhone: row.alt_phone || null,
          email: row.email || null,
          gender: row.gender || null,
          dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : null,
          workerType: row.worker_type || 'blue',
        },
      });

      // Update or create identity
      if (
        row.aadhaar_number ||
        row.pan_number ||
        row.esic_number ||
        row.uan_number ||
        row.pf_account_number ||
        row.health_insurance_policy
      ) {
        const existingIdentity = await tx.profileIdentity.findUnique({
          where: { profileId },
        });

        const identityData: any = {
          updatedAt: new Date(),
        };
        if (row.aadhaar_number) identityData.aadhaarNumber = row.aadhaar_number;
        if (row.pan_number) identityData.panNumber = row.pan_number;
        if (row.esic_number) identityData.esicNumber = row.esic_number;
        if (row.uan_number) identityData.uanNumber = row.uan_number;
        if (row.pf_account_number) identityData.pfAccountNumber = row.pf_account_number;
        if (row.health_insurance_policy)
          identityData.healthInsurancePolicy = row.health_insurance_policy;
        if (row.health_insurance_provider)
          identityData.healthInsuranceProvider = row.health_insurance_provider;
        if (row.health_insurance_expiry)
          identityData.healthInsuranceExpiry = new Date(row.health_insurance_expiry);

        if (existingIdentity) {
          await tx.profileIdentity.update({
            where: { profileId },
            data: identityData,
          });
        } else {
          await tx.profileIdentity.create({
            data: { profileId, ...identityData },
          });
        }
      }

      // Update address - delete existing and create new
      if (row.village_or_city || row.district || row.state) {
        await tx.profileAddress.deleteMany({ where: { profileId } });
        await tx.profileAddress.create({
          data: {
            profileId,
            addressType: row.address_type || 'permanent',
            houseNumber: row.house_number || null,
            villageOrCity: row.village_or_city || null,
            district: row.district || null,
            state: row.state || null,
            postalCode: row.postal_code || null,
            landmark: row.landmark || null,
            policeStation: row.police_station || null,
            postOffice: row.post_office || null,
          },
        });
      }

      // Update bank account - update primary or create new
      if (row.account_number || row.ifsc_code || row.bank_name) {
        const existingBank = await tx.profileBankAccount.findFirst({
          where: { profileId, isPrimary: true },
        });

        const bankData = {
          accountHolderName: row.account_holder_name || `${row.first_name} ${row.last_name}`,
          accountNumber: row.account_number || null,
          ifscCode: row.ifsc_code || null,
          bankName: row.bank_name || null,
          branchName: row.branch_name || null,
          accountType: row.account_type || 'savings',
          isPrimary: true,
        };

        if (existingBank) {
          await tx.profileBankAccount.update({
            where: { id: existingBank.id },
            data: bankData,
          });
        } else {
          await tx.profileBankAccount.create({
            data: { profileId, ...bankData },
          });
        }
      }

      // Update skills - delete existing and recreate
      if (row.primary_skill || row.secondary_skills) {
        // Delete existing skills
        await tx.profileSkill.deleteMany({ where: { profileId } });

        // Create primary skill if provided
        if (row.primary_skill) {
          const skillCategory = await tx.skillCategory.findFirst({
            where: {
              name: { equals: row.primary_skill, mode: 'insensitive' },
            },
          });

          if (skillCategory) {
            await tx.profileSkill.create({
              data: {
                profileId,
                skillCategoryId: skillCategory.id,
                yearsOfExperience: row.primary_skill_experience
                  ? parseInt(row.primary_skill_experience)
                  : null,
                isPrimary: true,
              },
            });
          }
        }

        // Create secondary skills if provided
        if (row.secondary_skills) {
          try {
            const secondarySkills = JSON.parse(row.secondary_skills);
            if (Array.isArray(secondarySkills)) {
              for (const skillData of secondarySkills) {
                const skillName = skillData.skill || skillData.name;
                if (skillName) {
                  const skillCategory = await tx.skillCategory.findFirst({
                    where: {
                      name: { equals: skillName, mode: 'insensitive' },
                    },
                  });

                  if (skillCategory) {
                    await tx.profileSkill.create({
                      data: {
                        profileId,
                        skillCategoryId: skillCategory.id,
                        yearsOfExperience: skillData.experience
                          ? parseInt(skillData.experience)
                          : null,
                        isPrimary: false,
                      },
                    });
                  }
                }
              }
            }
          } catch (e) {
            logger.warn('Failed to parse secondary_skills JSON during update', {
              profileId,
              value: row.secondary_skills,
            });
          }
        }
      }
    });
  }

  /**
   * Get the import template CSV
   */
  getCandidateTemplate(): string {
    // Return just the headers as a template
    return stringify([], {
      header: true,
      columns: IMPORT_HEADERS,
    });
  }

  /**
   * Get the template file path
   */
  getTemplateFilePath(): string {
    return path.join(__dirname, '../../../csv_formats/candidate_import_template.csv');
  }

  /**
   * Get the sample file path
   */
  getSampleFilePath(): string {
    return path.join(__dirname, '../../../csv_formats/candidate_import_sample.csv');
  }
}

export default new ProfileImportExportService();
