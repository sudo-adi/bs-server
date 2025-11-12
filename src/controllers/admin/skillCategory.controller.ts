import skillService from '@/services/profiles/skill.service';
import { Request, Response } from 'express';

export const getAllSkillCategories = async (req: Request, res: Response) => {
  const activeOnly = req.query.activeOnly === 'true';
  const categories = await skillService.getAllSkillCategories(activeOnly);

  res.status(200).json({
    success: true,
    data: categories,
  });
};

export const createSkillCategory = async (req: Request, res: Response) => {
  const category = await skillService.createSkillCategory(req.body);

  res.status(201).json({
    success: true,
    message: 'Skill category created successfully',
    data: category,
  });
};

export const updateSkillCategory = async (req: Request, res: Response) => {
  const id = req.params.id;
  const category = await skillService.updateSkillCategory(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Skill category updated successfully',
    data: category,
  });
};

export const deleteSkillCategory = async (req: Request, res: Response) => {
  const id = req.params.id;
  await skillService.deleteSkillCategory(id);

  res.status(200).json({
    success: true,
    message: 'Skill category deleted successfully',
  });
};
