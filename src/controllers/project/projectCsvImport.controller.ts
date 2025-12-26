// @ts-nocheck
import { projectCsvImportService, projectService } from '@/services/project';
import type { ProjectImportOptions } from '@/types';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

/**
 * Import projects from CSV file
 */
export const importProjects = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
    return;
  }

  const options: ProjectImportOptions = {
    skipDuplicates: req.body.skipDuplicates === 'true' || req.body.skipDuplicates === true,
    updateExisting: req.body.updateExisting === 'true' || req.body.updateExisting === true,
  };

  const userId = (req as any).userId; // Assuming userId is attached by auth middleware

  const result = await projectCsvImportService.importProjects(req.file.buffer, options, userId);

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
 * Download CSV template for projects
 */
export const downloadProjectTemplate = catchAsync(async (req: Request, res: Response) => {
  const template = `name,employer_code,location,contact_phone,project_manager,description,poCoNumber,is_accommodation_provided,deployment_date,award_date,start_date,end_date,revised_completion_date,actual_start_date,actual_end_date,status,current_attributable_to,on_hold_reason,termination_date,termination_reason,contract_value,revised_contract_value,budget,variation_order_value,actual_cost_incurred,misc_cost
Metro Rail Phase 3,BSE-0009,Bangalore,9876543210,Rajesh Mehta,Metro rail construction project,PO/2024/MR/001,yes,2024-01-15,2023-12-01,2024-02-01,2025-12-31,,2024-02-05,,active,,,,,5000000000,5200000000,5100000000,150000000,1200000000,25000000
Highway Expansion,BSE-0009,Delhi,9876543220,Sunita Sharma,Highway expansion project,CO/2024/HW/045,no,2023-11-20,2023-10-15,2023-12-01,2025-05-31,,,,planning,,,,,2500000000,2650000000,2600000000,100000000,800000000,15000000`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=project_import_template.csv');
  res.status(200).send(template);
});

/**
 * Export projects to CSV
 */
export const exportProjects = catchAsync(async (req: Request, res: Response) => {
  // Get query parameters for filtering
  const { employerId, status, search } = req.query;

  const filters: any = {};
  if (employerId) filters.employerId = employerId as string;
  if (status) filters.status = status as string;
  if (search) filters.search = search as string;

  const result = await projectService.getAllProjects(filters);
  const projects = result.data || [];

  // Build CSV header
  const headers = [
    'code',
    'name',
    'employer_code',
    'location',
    'contact_phone',
    'project_manager',
    'poCoNumber',
    'is_accommodation_provided',
    'status',
    'deployment_date',
    'award_date',
    'start_date',
    'end_date',
    'contract_value',
    'budget',
    'createdAt',
  ];

  // Build CSV rows
  const rows = projects.map((project: any) => {
    return [
      project.code || '',
      project.name || '',
      project.employers?.employer_code || '',
      project.location || '',
      project.contact_phone || '',
      project.project_manager || '',
      project.poCoNumber || '',
      project.is_accommodation_provided ? 'Yes' : 'No',
      project.status || '',
      project.deployment_date ? new Date(project.deployment_date).toISOString().split('T')[0] : '',
      project.award_date ? new Date(project.award_date).toISOString().split('T')[0] : '',
      project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
      project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
      project.project_financials?.contract_value || '',
      project.project_financials?.budget || '',
      project.createdAt ? new Date(project.createdAt).toISOString().split('T')[0] : '',
    ]
      .map((field) => {
        // Escape fields containing commas, quotes, or newlines
        if (
          typeof field === 'string' &&
          (field.includes(',') || field.includes('"') || field.includes('\n'))
        ) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [headers.join(','), ...rows].join('\n');

  // Set response headers
  const timestamp = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=projects_export_${timestamp}.csv`);
  res.status(200).send(csv);
});
