import skillService from '@/services/profiles/skill.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

export const getProfileSkills = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const skills = await skillService.getProfileSkills(profileId);

  res.status(200).json({
    success: true,
    data: skills,
  });
});

export const addProfileSkill = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const skillData = {
    ...req.body,
    profile_id: profileId,
  };
  const skill = await skillService.addProfileSkill(skillData);

  res.status(201).json({
    success: true,
    message: 'Skill added successfully',
    data: skill,
  });
});

export const updateProfileSkill = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.skillId;
  const skill = await skillService.updateProfileSkill(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Skill updated successfully',
    data: skill,
  });
});

export const verifyProfileSkill = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.skillId;
  const skill = await skillService.verifyProfileSkill(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Skill verified successfully',
    data: skill,
  });
});

export const deleteProfileSkill = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.skillId;
  await skillService.deleteProfileSkill(id);

  res.status(200).json({
    success: true,
    message: 'Skill deleted successfully',
  });
});
