import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { CreateEmployerDto, Employer } from '@/types';
import bcrypt from 'bcrypt';
import { EmployerCodeHelper } from '../helpers/employer-code.helper';

export class EmployerCreateOperation {
  static async create(data: CreateEmployerDto): Promise<Employer> {
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

    // Generate unique employer code
    const employer_code = await EmployerCodeHelper.generateEmployerCode();

    const employer = await prisma.employers.create({
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
        is_active: true,
        is_verified: false,
      },
    });

    return employer;
  }
}
