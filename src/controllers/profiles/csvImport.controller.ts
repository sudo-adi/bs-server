import csvImportService from '@/services/profiles/csvImport.service';
import type { ImportOptions } from '@/types/csvImport.types';
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

  res.status(200).json({
    success: true,
    message: 'CSV import completed',
    data: result,
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

  res.status(200).json({
    success: true,
    message: 'CSV import completed',
    data: result,
  });
});

/**
 * Download CSV template for candidates
 */
export const downloadCandidateTemplate = catchAsync(async (req: Request, res: Response) => {
  const template = `first_name,last_name,middle_name,fathers_name,phone,alt_phone,email,gender,date_of_birth,address_type,house_number,village_or_city,district,state,postal_code,landmark,police_station,post_office,doc_type,doc_number,account_holder_name,account_number,ifsc_code,bank_name,branch_name,account_type,qualification_type,institution_name,field_of_study,year_of_completion,percentage_or_grade,skill_category,years_of_experience
Rajesh,Kumar,Singh,Ram Kumar,9876543210,9876543211,rajesh.kumar@email.com,male,1995-05-15,permanent,123,Mumbai,Mumbai,Maharashtra,400001,Near Station,Mumbai Central,Mumbai GPO,Aadhar,123456789012,Rajesh Kumar,1234567890,SBIN0001234,State Bank of India,Mumbai Branch,savings,Graduate,Mumbai University,Computer Science,2017,75%,Electrician,2
Priya,Sharma,,Vijay Sharma,9876543212,,priya.sharma@email.com,female,1998-08-20,current,456,Delhi,Delhi,Delhi,110001,,,,,PAN,ABCDE1234F,Priya Sharma,0987654321,HDFC0001234,HDFC Bank,Delhi Branch,savings,12th,Delhi School,Science,2016,80%,Plumber,1`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=candidate_import_template.csv');
  res.status(200).send(template);
});

/**
 * Download CSV template for workers
 */
export const downloadWorkerTemplate = catchAsync(async (req: Request, res: Response) => {
  const template = `first_name,last_name,middle_name,fathers_name,phone,alt_phone,email,gender,date_of_birth,address_type,house_number,village_or_city,district,state,postal_code,landmark,police_station,post_office,doc_type,doc_number,account_holder_name,account_number,ifsc_code,bank_name,branch_name,account_type,qualification_type,institution_name,field_of_study,year_of_completion,percentage_or_grade,skill_category,years_of_experience
Amit,Patel,Kumar,Ramesh Patel,9876543220,9876543221,amit.patel@email.com,male,1990-03-10,permanent,789,Bangalore,Bangalore,Karnataka,560001,Near Market,Bangalore East,Bangalore GPO,Aadhar,987654321098,Amit Kumar Patel,9876543210,ICIC0001234,ICICI Bank,Bangalore Branch,savings,Diploma,Bangalore Polytechnic,Electrical Engineering,2010,70%,Electrician,5
Sunita,Devi,,Mohan Lal,9876543222,,sunita.devi@email.com,female,1992-12-25,permanent,321,Pune,Pune,Maharashtra,411001,,,,,Voter ID,ABC1234567,Sunita Devi,8765432109,AXIS0001234,Axis Bank,Pune Branch,savings,10th,Pune School,,2008,65%,Mason,3`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=worker_import_template.csv');
  res.status(200).send(template);
});
