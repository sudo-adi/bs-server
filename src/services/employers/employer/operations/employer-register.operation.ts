import { env } from '@/config/env';
import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { Employer, RegisterEmployerDto } from '@/types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { EmployerCodeHelper } from '../helpers/employer-code.helper';

export class EmployerRegisterOperation {
  static async register(
    data: RegisterEmployerDto
  ): Promise<{ employer: Employer; token: string; projectRequest: any }> {
    // Validate required fields
    if (!data.project_name || !data.project_name.trim()) {
      throw new AppError('Project name is required', 400);
    }

    if (!data.project_description || !data.project_description.trim()) {
      throw new AppError('Project description is required', 400);
    }

    if (!data.authorized_person_name || !data.authorized_person_name.trim()) {
      throw new AppError('Authorized person name is required', 400);
    }

    if (!data.authorized_person_designation || !data.authorized_person_designation.trim()) {
      throw new AppError('Authorized person designation is required', 400);
    }

    if (!data.authorized_person_email || !data.authorized_person_email.trim()) {
      throw new AppError('Authorized person email is required', 400);
    }

    if (!data.authorized_person_contact || !data.authorized_person_contact.trim()) {
      throw new AppError('Authorized person contact is required', 400);
    }

    if (!data.authorized_person_address || !data.authorized_person_address.trim()) {
      throw new AppError('Authorized person address is required', 400);
    }

    if (!data.site_address || !data.site_address.trim()) {
      throw new AppError('Project site address is required', 400);
    }

    if (!data.city || !data.city.trim()) {
      throw new AppError('City is required', 400);
    }

    if (!data.district || !data.district.trim()) {
      throw new AppError('District is required', 400);
    }

    if (!data.state || !data.state.trim()) {
      throw new AppError('State is required', 400);
    }

    if (!data.postal_code || !data.postal_code.trim()) {
      throw new AppError('Postal code is required', 400);
    }

    if (!data.worker_requirements || data.worker_requirements.length === 0) {
      throw new AppError('At least one worker skill requirement is required', 400);
    }

    // Validate each worker requirement
    for (const req of data.worker_requirements) {
      if (!req.category || !req.category.trim()) {
        throw new AppError('Worker skill category is required', 400);
      }
      if (!req.count || req.count <= 0) {
        throw new AppError('Worker count must be greater than 0', 400);
      }
    }

    // Check if email already exists
    const existing = await prisma.employers.findFirst({
      where: {
        email: data.email,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new AppError('Email already exists', 400);
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, 10);

    // Use Prisma transaction to create employer and project with extended timeout
    const result = await prisma.$transaction(
      async (tx) => {
        // Generate unique employer code
        const employer_code = await EmployerCodeHelper.generateEmployerCode();

        // Create employer
        const employer = await tx.employers.create({
          data: {
            employer_code,
            company_name: data.company_name,
            client_name: data.client_name,
            email: data.email,
            password_hash,
            phone: data.phone,
            alt_phone: data.alt_phone,
            registered_address: data.registered_address,
            company_registration_number: data.company_registration_number,
            gst_number: data.gst_number,
            is_active: true,
            is_verified: false,
            employer_authorized_persons: {
              create: {
                name: data.authorized_person_name,
                designation: data.authorized_person_designation,
                email: data.authorized_person_email,
                phone: data.authorized_person_contact,
                address: data.authorized_person_address,
                is_primary: true,
              },
            },
          },
        });

        // Build project location from provided details
        const locationParts = [
          data.site_address,
          data.landmark,
          data.city,
          data.district,
          data.state,
          data.postal_code,
        ].filter(Boolean);
        const projectLocation =
          locationParts.length > 0 ? locationParts.join(', ') : data.registered_address || '';

        // Create project_request instead of project
        // Status is 'pending' until BS team reviews and approves
        const projectRequest = await tx.project_requests.create({
          data: {
            project_title: data.project_name,
            project_description: data.project_description,
            location: projectLocation,
            employer_id: employer.id,
            estimated_start_date: data.estimated_start_date,
            estimated_duration_days: data.estimated_duration_days,
            estimated_budget: data.estimated_budget,
            additional_notes: data.additional_notes,
            status: 'pending', // Status is pending until BS team reviews
          },
        });

        // Insert worker requirements into project_request_requirements
        const workerRequirements = [];
        if (data.worker_requirements && data.worker_requirements.length > 0) {
          // Batch fetch all skill categories first
          const categoryNames = data.worker_requirements.map((req) => req.category);
          const existingCategories = await tx.skill_categories.findMany({
            where: { name: { in: categoryNames } },
          });

          // Create a map for quick lookup
          const categoryMap = new Map(existingCategories.map((cat) => [cat.name, cat]));

          // Create missing categories
          for (const req of data.worker_requirements) {
            if (!categoryMap.has(req.category)) {
              const newCategory = await tx.skill_categories.create({
                data: {
                  name: req.category,
                  is_active: true,
                },
              });
              categoryMap.set(req.category, newCategory);
            }
          }

          // Now create all project_request_requirements
          for (const req of data.worker_requirements) {
            const skillCategory = categoryMap.get(req.category);
            if (skillCategory) {
              const requirement = await tx.project_request_requirements.create({
                data: {
                  project_request_id: projectRequest.id,
                  skill_category_id: skillCategory.id,
                  required_count: req.count,
                  notes: req.notes,
                },
                include: {
                  skill_categories: true,
                },
              });
              workerRequirements.push(requirement);
            }
          }
        }

        return {
          employer,
          projectRequest: { ...projectRequest, worker_requirements: workerRequirements },
        };
      },
      {
        maxWait: 10000, // Maximum wait time in ms
        timeout: 20000, // Timeout in ms
      }
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        employerId: result.employer.id,
        email: result.employer.email,
        type: 'employer',
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { employer: result.employer, token, projectRequest: result.projectRequest };
  }
}
