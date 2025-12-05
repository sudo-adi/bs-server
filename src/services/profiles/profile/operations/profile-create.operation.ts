import prisma from '@/config/prisma';
import type { profiles } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { ProfileStage } from '@/types/enums';
import type { CreateProfileDto } from '@/types';
import { sanitizeObject } from '@/utils/sanitize';
import { ProfileCodeHelper } from '../helpers/profile-code.helper';
import bcrypt from 'bcrypt';

export class ProfileCreateOperation {
  /**
   * Create a new profile
   */
  static async create(data: CreateProfileDto): Promise<profiles> {
    const sanitizedData = sanitizeObject(data);
    // Check if mobile number already exists
    const existingProfile = await prisma.profiles.findFirst({
      where: {
        phone: sanitizedData.phone,
        deleted_at: null,
      },
    });

    if (existingProfile) {
      throw new AppError('Mobile number already registered', 400);
    }

    // Generate profile code
    const profileCode = await ProfileCodeHelper.generate();

    // Hash password if provided
    let password_hash: string | undefined;
    if ((sanitizedData as any).password) {
      const saltRounds = 10;
      password_hash = await bcrypt.hash((sanitizedData as any).password, saltRounds);
    }

    // Determine initial stage - default to 'new_registration'
    const initialStage = ProfileStage.NEW_REGISTRATION;

    // Use Prisma transaction to create profile and stage transition
    const profile = await prisma.$transaction(async (tx) => {
      // Create profile with initial stage
      const newProfile = await tx.profiles.create({
        data: {
          candidate_code: profileCode,
          phone: sanitizedData.phone,
          alt_phone: sanitizedData.alt_phone,
          email: sanitizedData.email,
          first_name: sanitizedData.first_name,
          middle_name: sanitizedData.middle_name,
          last_name: sanitizedData.last_name,
          fathers_name: sanitizedData.fathers_name,
          gender: sanitizedData.gender,
          date_of_birth: sanitizedData.date_of_birth,
          profile_photo_url: sanitizedData.profile_photo_url,
          password_hash, // Optional password hash
          // Payroll & Compliance fields
          esic_number: sanitizedData.esic_number,
          uan_number: sanitizedData.uan_number,
          pf_account_number: sanitizedData.pf_account_number,
          pan_number: sanitizedData.pan_number,
          health_insurance_policy_number: sanitizedData.health_insurance_policy_number,
          // Additional info fields
          aadhaar_number: sanitizedData.aadhaar_number,
          emergency_contact_name: sanitizedData.emergency_contact_name,
          emergency_contact_number: sanitizedData.emergency_contact_number,
          languages_known: sanitizedData.languages_known,
          nominee_name: sanitizedData.nominee_name,
          blood_group: sanitizedData.blood_group,
          is_active: true, // Default to active
        },
      });

      // Create initial stage transition for audit trail
      await tx.stage_transitions.create({
        data: {
          profile_id: newProfile.id,
          to_stage: initialStage,
          notes: 'Initial profile creation',
        },
      });

      return newProfile;
    });

    return profile;
  }
}
