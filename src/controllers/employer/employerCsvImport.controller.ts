// import { employerService } from '@/services/employers';
// import employerCsvImportService from '@/services/employers/csvImport/csvImport.service';
// import type { EmployerImportOptions } from '@/types';
// import catchAsync from '@/utils/catchAsync';
// import { Request, Response } from 'express';

// /**
//  * Import employers from CSV file
//  */
// export const importEmployers = catchAsync(async (req: Request, res: Response) => {
//   if (!req.file) {
//     res.status(400).json({
//       success: false,
//       message: 'No file uploaded',
//     });
//     return;
//   }

//   const options: EmployerImportOptions = {
//     skipDuplicates: req.body.skipDuplicates === 'true' || req.body.skipDuplicates === true,
//     updateExisting: req.body.updateExisting === 'true' || req.body.updateExisting === true,
//   };

//   const userId = (req as any).userId; // Assuming userId is attached by auth middleware

//   const result = await employerCsvImportService.importEmployers(req.file.buffer, options, userId);

//   // Transform results into errors array for frontend
//   const errors = result.results
//     .filter((r) => !r.success)
//     .map((r) => ({
//       row: r.rowNumber,
//       error: r.errors?.join(', ') || 'Unknown error',
//       data: r.data,
//     }));

//   res.status(200).json({
//     success: true,
//     message: 'CSV import completed',
//     data: {
//       ...result,
//       errors,
//     },
//   });
// });

// /**
//  * Download CSV template for employers
//  */
// export const downloadEmployerTemplate = catchAsync(async (req: Request, res: Response) => {
//   const template = `company_name,client_name,email,password,phone,alt_phone,registered_address,company_registration_number,gst_number,authorized_person_name,authorized_person_designation,authorized_person_email,authorized_person_phone,authorized_person_address
// BuildTech Solutions Pvt Ltd,Raj Kumar,buildtech@example.com,BuildPass@123,9876543210,9876543211,"123 MG Road, Bangalore, Karnataka 560001",U74999KA2020PTC134567,29ABCDE1234F1Z5,Rajesh Kumar,Managing Director,rajesh@buildtech.com,9876543212,"123 MG Road, Bangalore"
// Infracon Engineering Ltd,Amit Sharma,infracon@example.com,Infra@2024,9876543220,,"45 Sector 18, Noida, Uttar Pradesh 201301",U45200UP2019PLC098765,09PQRST5678G1Z3,Amit Sharma,CEO,amit@infracon.com,9876543221,Noida Sector 18`;

//   res.setHeader('Content-Type', 'text/csv');
//   res.setHeader('Content-Disposition', 'attachment; filename=employer_import_template.csv');
//   res.status(200).send(template);
// });

// /**
//  * Export employers to CSV
//  */
// export const exportEmployers = catchAsync(async (req: Request, res: Response) => {
//   // Get query parameters for filtering
//   const { isActive, isVerified, search } = req.query;

//   const filters = {
//     isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
//     isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
//     search: search as string,
//   };

//   const result = await employerService.getAllEmployers(filters);
//   const employers = result.employers;

//   // Build CSV header
//   const headers = [
//     'employer_code',
//     'company_name',
//     'client_name',
//     'email',
//     'phone',
//     'alt_phone',
//     'registered_address',
//     'company_registration_number',
//     'gst_number',
//     'isActive',
//     'isVerified',
//     'createdAt',
//   ];

//   // Build CSV rows
//   const rows = employers.map((employer: any) => {
//     return [
//       employer.employer_code || '',
//       employer.company_name || '',
//       employer.client_name || '',
//       employer.email || '',
//       employer.phone || '',
//       employer.alt_phone || '',
//       employer.registered_address || '',
//       employer.company_registration_number || '',
//       employer.gst_number || '',
//       employer.isActive ? 'Yes' : 'No',
//       employer.isVerified ? 'Yes' : 'No',
//       employer.createdAt ? new Date(employer.createdAt).toISOString().split('T')[0] : '',
//     ]
//       .map((field) => {
//         // Escape fields containing commas, quotes, or newlines
//         if (
//           typeof field === 'string' &&
//           (field.includes(',') || field.includes('"') || field.includes('\n'))
//         ) {
//           return `"${field.replace(/"/g, '""')}"`;
//         }
//         return field;
//       })
//       .join(',');
//   });

//   // Combine header and rows
//   const csv = [headers.join(','), ...rows].join('\n');

//   // Set response headers
//   const timestamp = new Date().toISOString().split('T')[0];
//   res.setHeader('Content-Type', 'text/csv');
//   res.setHeader('Content-Disposition', `attachment; filename=employers_export_${timestamp}.csv`);
//   res.status(200).send(csv);
// });
