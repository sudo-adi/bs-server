import qualificationService from '@/services/profiles/qualification/qualification.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

export const getProfileQualifications = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const qualifications = await qualificationService.getProfileQualifications(profileId);

  res.status(200).json({
    success: true,
    data: qualifications,
  });
});

export const addQualification = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const qualificationData = {
    ...req.body,
    profile_id: profileId,
  };
  const qualification = await qualificationService.createQualification(qualificationData);

  res.status(201).json({
    success: true,
    message: 'Qualification added successfully',
    data: qualification,
  });
});

export const updateQualification = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.qualificationId;
  const qualification = await qualificationService.updateQualification(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Qualification updated successfully',
    data: qualification,
  });
});

export const verifyQualification = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.qualificationId;
  const qualification = await qualificationService.verifyQualification(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Qualification verified successfully',
    data: qualification,
  });
});

export const deleteQualification = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.qualificationId;
  await qualificationService.deleteQualification(id);

  res.status(200).json({
    success: true,
    message: 'Qualification deleted successfully',
  });
});
