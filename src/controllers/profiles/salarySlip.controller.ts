import salarySlipService from '@/services/profiles/salarySlip/salarySlip.service';
import catchAsync from '@/utils/catchAsync';
import type { Request, Response } from 'express';

export const createSalarySlip = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.profileId;
  const userId = (req as any).userId || (req as any).user?.id;

  const slip = await salarySlipService.create({
    profile_id: profileId,
    ...req.body,
    uploaded_by_user_id: userId,
  });

  res.status(201).json({
    success: true,
    message: 'Salary slip created successfully',
    data: slip,
  });
});

export const getAllSalarySlips = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.profileId;
  const { salary_year, payment_status } = req.query;

  const slips = await salarySlipService.findAll(profileId, {
    salary_year: salary_year ? parseInt(salary_year as string) : undefined,
    payment_status: payment_status as string,
  });

  res.status(200).json({
    success: true,
    data: slips,
  });
});

export const getSalarySlipById = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const slip = await salarySlipService.findById(id);

  if (!slip) {
    return res.status(404).json({ success: false, message: 'Salary slip not found' });
  }

  res.status(200).json({
    success: true,
    data: slip,
  });
});

export const getSalarySlipByPeriod = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.profileId;
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month);

  const slip = await salarySlipService.findByPeriod(profileId, year, month);

  res.status(200).json({
    success: true,
    data: slip,
  });
});

export const updateSalarySlip = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const slip = await salarySlipService.update(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Salary slip updated successfully',
    data: slip,
  });
});

export const deleteSalarySlip = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await salarySlipService.delete(id);

  res.status(200).json({
    success: true,
    message: 'Salary slip deleted successfully',
  });
});

export const markSalaryPaid = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const slip = await salarySlipService.markPaid(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Salary marked as paid',
    data: slip,
  });
});
