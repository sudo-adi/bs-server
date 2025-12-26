import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  ExportEmployerDto,
  ImportEmployerDto,
  ImportEmployerOptions,
  ImportEmployerResult,
  ImportEmployersResponse,
} from '@/dtos/employer/employer.dto';
import { Prisma } from '@/generated/prisma';
import bcrypt from 'bcrypt';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { mapEmployerToExport } from '../helpers/response-mapper.helper';

/**
 * Generate CSV template for importing employers
 */
export function generateTemplate(): string {
  const headers = [
    'companyName',
    'clientName',
    'email',
    'password',
    'phone',
    'altPhone',
    'registeredAddress',
    'companyRegistrationNumber',
    'gstNumber',
    'city',
    'district',
    'state',
    'landmark',
    'postalCode',
    'logoUrl',
    'projectTitle',
    'projectDescription',
    'location',
    'estimatedStartDate',
    'estimatedDurationDays',
    'estimatedBudget',
    'additionalNotes',
  ];

  const exampleRow = {
    companyName: 'ABC Construction Pvt Ltd',
    clientName: 'John Doe',
    email: 'contact@abcconstruction.com',
    password: 'Password@123',
    phone: '9876543210',
    altPhone: '9876543211',
    registeredAddress: '123 Main Street, Business District',
    companyRegistrationNumber: 'CIN123456789',
    gstNumber: '29ABCDE1234F1Z5',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    landmark: 'Near City Mall',
    postalCode: '400001',
    logoUrl: 'https://example.com/logo.png',
    projectTitle: 'Residential Complex Construction',
    projectDescription: '50 unit residential complex with modern amenities',
    location: 'Andheri West, Mumbai',
    estimatedStartDate: '2025-01-15',
    estimatedDurationDays: '365',
    estimatedBudget: '50000000',
    additionalNotes: 'Requires skilled masons and electricians',
  };

  return stringify([headers, Object.values(exampleRow)]);
}

/**
 * Import employers from CSV file
 */
export async function importEmployers(
  csvData: string,
  options: ImportEmployerOptions = {}
): Promise<ImportEmployersResponse> {
  const { skipDuplicates = false, updateExisting = false } = options;
  const results: ImportEmployerResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  try {
    // Parse CSV
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ImportEmployerDto[];

    logger.info(`Starting import of ${records.length} employers`);

    // Process each row
    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2;
      const record = records[i];
      const result: ImportEmployerResult = {
        rowNumber,
        success: false,
        errors: [],
        warnings: [],
      };

      try {
        // Validate required fields
        if (!record.companyName || record.companyName.trim() === '') {
          result.errors?.push('Company name is required');
        }
        if (!record.email || record.email.trim() === '') {
          result.errors?.push('Email is required');
        }
        if (!record.password || record.password.trim() === '') {
          result.errors?.push('Password is required');
        }
        if (!record.phone || record.phone.trim() === '') {
          result.errors?.push('Phone is required');
        }

        if (result.errors && result.errors.length > 0) {
          result.success = false;
          failureCount++;
          results.push(result);
          continue;
        }

        // Check for duplicate email
        const existingEmployer = await prisma.employer.findFirst({
          where: { email: record.email, deletedAt: null },
        });

        if (existingEmployer) {
          if (skipDuplicates) {
            result.warnings?.push('Skipped - email already exists');
            result.success = true;
            result.employerId = existingEmployer.id;
            result.employerCode = existingEmployer.employerCode || undefined;
            successCount++;
            results.push(result);
            continue;
          } else if (updateExisting) {
            // Update existing employer (but not password)
            await prisma.employer.update({
              where: { id: existingEmployer.id },
              data: {
                companyName: record.companyName,
                clientName: record.clientName,
                phone: record.phone,
                altPhone: record.altPhone,
                registeredAddress: record.registeredAddress,
                companyRegistrationNumber: record.companyRegistrationNumber,
                gstNumber: record.gstNumber,
                city: record.city,
                district: record.district,
                state: record.state,
                landmark: record.landmark,
                postalCode: record.postalCode,
              },
            });

            result.success = true;
            result.employerId = existingEmployer.id;
            result.employerCode = existingEmployer.employerCode || undefined;
            result.warnings?.push('Updated existing employer');
            successCount++;
            results.push(result);
            continue;
          } else {
            result.errors?.push('Email already exists');
            result.success = false;
            failureCount++;
            results.push(result);
            continue;
          }
        }

        // Hash password
        const passwordHash = record.password ? await bcrypt.hash(record.password, 10) : null;

        // Create employer - ALWAYS unverified, no code
        const newEmployer = await prisma.employer.create({
          data: {
            employerCode: null,
            companyName: record.companyName,
            clientName: record.clientName,
            email: record.email,
            passwordHash: passwordHash || undefined,
            phone: record.phone,
            altPhone: record.altPhone,
            registeredAddress: record.registeredAddress,
            companyRegistrationNumber: record.companyRegistrationNumber,
            gstNumber: record.gstNumber,
            city: record.city,
            district: record.district,
            state: record.state,
            landmark: record.landmark,
            postalCode: record.postalCode,
            logoUrl: record.logoUrl,
            isActive: true,
            isVerified: false,
            status: 'pending',
          },
        });

        result.success = true;
        result.employerId = newEmployer.id;
        result.employerCode = undefined;

        // Create project request if data provided
        if (record.projectTitle && record.projectTitle.trim() !== '') {
          try {
            await prisma.projectRequest.create({
              data: {
                employerId: newEmployer.id,
                projectTitle: record.projectTitle,
                projectDescription: record.projectDescription,
                location: record.location,
                estimatedStartDate: record.estimatedStartDate
                  ? new Date(record.estimatedStartDate)
                  : null,
                estimatedDurationDays: record.estimatedDurationDays
                  ? parseInt(record.estimatedDurationDays)
                  : null,
                estimatedBudget: record.estimatedBudget
                  ? new Prisma.Decimal(record.estimatedBudget)
                  : null,
                additionalNotes: record.additionalNotes,
                status: 'pending',
              },
            });
            result.warnings?.push('Project request created');
          } catch (error: any) {
            result.warnings?.push(`Project request failed: ${error.message}`);
          }
        }

        successCount++;
        logger.info(`Imported employer (pending verification)`, {
          rowNumber,
          employerId: newEmployer.id,
        });
      } catch (error: any) {
        result.success = false;
        result.errors?.push(error.message || 'Unknown error');
        failureCount++;
        logger.error(`Failed to import row ${rowNumber}`, { error });
      }

      results.push(result);
    }

    logger.info('Import completed', {
      total: records.length,
      success: successCount,
      failure: failureCount,
    });

    return {
      totalRows: records.length,
      successCount,
      failureCount,
      results,
    };
  } catch (error: any) {
    logger.error('Error importing employers', { error });
    throw new Error(error.message || 'Failed to import employers');
  }
}

/**
 * Export employers with project requests to CSV
 */
export async function exportEmployers(): Promise<string> {
  try {
    const employers = await prisma.employer.findMany({
      where: { deletedAt: null },
      include: {
        projectRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const exportData: ExportEmployerDto[] = [];

    for (const employer of employers) {
      const baseExport = mapEmployerToExport(employer);

      if (employer.projectRequests && employer.projectRequests.length > 0) {
        // Create one row per project request
        for (const request of employer.projectRequests) {
          exportData.push({
            ...baseExport,
            projectTitle: request.projectTitle || '',
            projectDescription: request.projectDescription || '',
            location: request.location || '',
            estimatedStartDate: request.estimatedStartDate?.toISOString().split('T')[0] || '',
            estimatedDurationDays: request.estimatedDurationDays?.toString() || '',
            estimatedBudget: request.estimatedBudget?.toString() || '',
            additionalNotes: request.additionalNotes || '',
            projectRequestStatus: request.status || '',
            projectRequestCreatedAt: request.createdAt?.toISOString().split('T')[0] || '',
          });
        }
      } else {
        // Employer without project requests
        exportData.push({
          ...baseExport,
          projectTitle: '',
          projectDescription: '',
          location: '',
          estimatedStartDate: '',
          estimatedDurationDays: '',
          estimatedBudget: '',
          additionalNotes: '',
          projectRequestStatus: '',
          projectRequestCreatedAt: '',
        });
      }
    }

    const csv = stringify(exportData, {
      header: true,
      columns: [
        'employerCode',
        'companyName',
        'clientName',
        'email',
        'phone',
        'altPhone',
        'registeredAddress',
        'companyRegistrationNumber',
        'gstNumber',
        'city',
        'district',
        'state',
        'landmark',
        'postalCode',
        'logoUrl',
        'isActive',
        'isVerified',
        'verifiedAt',
        'createdAt',
        'projectTitle',
        'projectDescription',
        'location',
        'estimatedStartDate',
        'estimatedDurationDays',
        'estimatedBudget',
        'additionalNotes',
        'projectRequestStatus',
        'projectRequestCreatedAt',
      ],
    });

    logger.info('Exported employers', { count: employers.length });
    return csv;
  } catch (error: any) {
    logger.error('Error exporting employers', { error });
    throw new Error(error.message || 'Failed to export employers');
  }
}
