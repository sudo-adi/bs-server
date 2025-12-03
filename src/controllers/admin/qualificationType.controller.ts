import qualificationTypeService from '@/services/profiles/qualificationType/qualificationType.service';
import { Request, Response } from 'express';

export const getAllQualificationTypes = async (req: Request, res: Response) => {
  const activeOnly = req.query.activeOnly === 'true';
  const qualificationTypes = await qualificationTypeService.getAllQualificationTypes(activeOnly);

  res.status(200).json({
    success: true,
    data: qualificationTypes,
    total: qualificationTypes.length,
  });
};

export const getQualificationTypeById = async (req: Request, res: Response) => {
  const id = req.params.id;
  const qualificationType = await qualificationTypeService.getQualificationTypeById(id);

  if (!qualificationType) {
    return res.status(404).json({
      success: false,
      message: 'Qualification type not found',
    });
  }

  res.status(200).json({
    success: true,
    data: qualificationType,
  });
};
