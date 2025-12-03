import trainerCsvImportService from '@/services/trainers/csvImport/csvImport.service';
import { trainerService } from '@/services/training';
import type { TrainerImportOptions } from '@/types';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

/**
 * Import trainers from CSV file
 */
export const importTrainers = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
    return;
  }

  const options: TrainerImportOptions = {
    skipDuplicates: req.body.skipDuplicates === 'true' || req.body.skipDuplicates === true,
    updateExisting: req.body.updateExisting === 'true' || req.body.updateExisting === true,
  };

  const userId = req.user?.id; // Assuming user is attached by auth middleware

  const result = await trainerCsvImportService.importTrainers(req.file.buffer, options, userId);

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
 * Download CSV template for trainers
 */
export const downloadTrainerTemplate = catchAsync(async (req: Request, res: Response) => {
  const template = `name,email,phone,password
Rajesh Kumar,rajesh.kumar@example.com,9876543210,Trainer@123
Sunita Sharma,sunita.sharma@example.com,9876543220,Trainer@456
Amit Patel,amit.patel@example.com,9876543230,Trainer@789`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=trainer_import_template.csv');
  res.status(200).send(template);
});

/**
 * Export trainers to CSV
 */
export const exportTrainers = catchAsync(async (req: Request, res: Response) => {
  // Get query parameters for filtering
  const { is_active, search } = req.query;

  const filters: any = {};
  if (is_active !== undefined) filters.is_active = is_active === 'true';
  if (search) filters.search = search as string;

  const result = await trainerService.getAllTrainers(filters);
  const trainers = result.trainers;

  // Build CSV header
  const headers = [
    'employee_code',
    'name',
    'email',
    'phone',
    'is_active',
    'created_at',
  ];

  // Build CSV rows
  const rows = trainers.map((trainer: any) => {
    return [
      trainer.employee_code || '',
      trainer.name || '',
      trainer.email || '',
      trainer.phone || '',
      trainer.is_active ? 'Yes' : 'No',
      trainer.created_at ? new Date(trainer.created_at).toISOString().split('T')[0] : '',
    ].map(field => {
      // Escape fields containing commas, quotes, or newlines
      if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    }).join(',');
  });

  // Combine header and rows
  const csv = [headers.join(','), ...rows].join('\n');

  // Set response headers
  const timestamp = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=trainers_export_${timestamp}.csv`);
  res.status(200).send(csv);
});
