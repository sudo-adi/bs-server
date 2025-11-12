import employerAuthorizedPersonService from '@/services/employers/employerAuthorizedPerson.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Get all authorized persons for an employer
export const getAllByEmployerId = catchAsync(async (req: Request, res: Response) => {
  const { employerId } = req.params;
  const authorizedPersons = await employerAuthorizedPersonService.getAllByEmployerId(employerId);

  res.status(200).json({
    success: true,
    data: authorizedPersons,
  });
});

// Get authorized person by ID
export const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const authorizedPerson = await employerAuthorizedPersonService.getById(id);

  res.status(200).json({
    success: true,
    data: authorizedPerson,
  });
});

// Create new authorized person
export const create = catchAsync(async (req: Request, res: Response) => {
  const authorizedPerson = await employerAuthorizedPersonService.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Authorized person created successfully',
    data: authorizedPerson,
  });
});

// Update authorized person
export const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const authorizedPerson = await employerAuthorizedPersonService.update(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Authorized person updated successfully',
    data: authorizedPerson,
  });
});

// Delete authorized person
export const deleteAuthorizedPerson = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await employerAuthorizedPersonService.delete(id);

  res.status(200).json({
    success: true,
    message: 'Authorized person deleted successfully',
  });
});
