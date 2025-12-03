import csvImportService from '@/services/profiles/csvImport/csvImport.service';
import type { ImportOptions } from '@/types';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

/**
 * Import candidates from CSV file
 */
export const importCandidates = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
    return;
  }

  const options: ImportOptions = {
    importType: 'candidate',
    skipDuplicates: req.body.skipDuplicates === 'true' || req.body.skipDuplicates === true,
    updateExisting: req.body.updateExisting === 'true' || req.body.updateExisting === true,
  };

  const userId = req.user?.id; // Assuming user is attached by auth middleware

  const result = await csvImportService.importProfiles(req.file.buffer, options, userId);

  // Transform results into errors array for frontend
  const errors = result.results
    .filter((r) => !r.success)
    .map((r) => ({
      row: r.rowNumber,
      error: r.errors?.join(', ') || 'Unknown error',
      data: r.data,
    }));

  res.status(200).json({
    success: true,
    message: 'CSV import completed',
    data: {
      ...result,
      errors,
    },
  });
});

/**
 * Import workers from CSV file
 */
export const importWorkers = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
    return;
  }

  const options: ImportOptions = {
    importType: 'worker',
    skipDuplicates: req.body.skipDuplicates === 'true' || req.body.skipDuplicates === true,
    updateExisting: req.body.updateExisting === 'true' || req.body.updateExisting === true,
  };

  const userId = req.user?.id; // Assuming user is attached by auth middleware

  const result = await csvImportService.importProfiles(req.file.buffer, options, userId);

  // Transform results into errors array for frontend
  const errors = result.results
    .filter((r) => !r.success)
    .map((r) => ({
      row: r.rowNumber,
      error: r.errors?.join(', ') || 'Unknown error',
      data: r.data,
    }));

  res.status(200).json({
    success: true,
    message: 'CSV import completed',
    data: {
      ...result,
      errors,
    },
  });
});

/**
 * Download CSV template for candidates
 */
export const downloadCandidateTemplate = catchAsync(async (req: Request, res: Response) => {
  const template = `first_name,middle_name,last_name,fathers_name,phone,alt_phone,email,gender,date_of_birth,address_type,house_number,village_or_city,district,state,postal_code,landmark,police_station,post_office,doc_type,doc_number,account_holder_name,account_number,ifsc_code,bank_name,branch_name,account_type,qualification_type,institution_name,field_of_study,year_of_completion,percentage_or_grade,skill_category,years_of_experience,esic_number,uan_number,pf_account_number,pan_number,health_insurance_policy_number
Rajesh,Kumar,Sharma,Ram Kumar Sharma,9876543210,9876543211,rajesh.sharma@example.com,male,1995-06-15,permanent,H-123,Delhi,Central Delhi,Delhi,110001,Near Metro Station,Connaught Place PS,Connaught Place PO,Aadhar,123456789012,Rajesh Kumar Sharma,1234567890123456,SBIN0001234,State Bank of India,Connaught Place Branch,savings,12th,Delhi Public School,Science,2013,85.5,Mason,5,12345678901234567,123456789012,PF1234567890,ABCDE1234F,HLTH123456789
Priya,Devi,Verma,Suresh Verma,9876543220,9876543221,priya.verma@example.com,female,1998-03-20,permanent,B-456,Noida,Gautam Buddha Nagar,Uttar Pradesh,201301,Sector 62,Sector 62 PS,Sector 62 PO,Aadhar,987654321098,Priya Devi Verma,9876543210987654,HDFC0001234,HDFC Bank,Noida Sector 18,savings,Graduate,Amity University,Civil Engineering,2020,78.2,Civil Engineer,2,98765432109876543,987654321098,PF9876543210,PQRST5678U,HLTH987654321`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=candidate_import_template.csv');
  res.status(200).send(template);
});

/**
 * Download CSV template for workers
 */
export const downloadWorkerTemplate = catchAsync(async (req: Request, res: Response) => {
  const template = `first_name,middle_name,last_name,fathers_name,phone,alt_phone,email,gender,date_of_birth,address_type,house_number,village_or_city,district,state,postal_code,landmark,police_station,post_office,doc_type,doc_number,account_holder_name,account_number,ifsc_code,bank_name,branch_name,account_type,qualification_type,institution_name,field_of_study,year_of_completion,percentage_or_grade,skill_category,years_of_experience,esic_number,uan_number,pf_account_number,pan_number,health_insurance_policy_number
Amit,,Singh,Rakesh Singh,9876543230,,amit.singh@example.com,male,1992-11-10,current,F-789,Gurugram,Gurugram,Haryana,122001,DLF Phase 1,DLF PS,DLF PO,PAN,ABCPQ9876K,Amit Singh,1122334455667788,ICIC0001234,ICICI Bank,DLF Phase 1,current,Post Graduate,IIT Delhi,Construction Management,2015,88.9,Project Manager,8,11223344556677889,112233445566,PF1122334455,ABCPQ9876K,HLTH112233445
Sunita,Kumari,,Mohan Lal,9876543240,9876543241,,female,2000-08-25,permanent,L-234,Faridabad,Faridabad,Haryana,121001,Near Railway Station,NIT PS,NIT PO,Voter ID,ABC1234567,Sunita Kumari,5566778899001122,PUNB0001234,Punjab National Bank,NIT Faridabad,savings,10th,Government School,N/A,2016,65.0,Plumber,3,55667788990011223,556677889900,PF5566778899,,HLTH556677889`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=worker_import_template.csv');
  res.status(200).send(template);
});
