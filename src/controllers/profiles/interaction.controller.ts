import interactionService from '@/services/profiles/interaction.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

export const getProfileInteractions = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const interactions = await interactionService.getProfileInteractions(profileId);

  res.status(200).json({
    success: true,
    data: interactions,
  });
});

export const addInteraction = catchAsync(async (req: Request, res: Response) => {
  const interaction = await interactionService.createInteraction(req.body);

  res.status(201).json({
    success: true,
    message: 'Interaction added successfully',
    data: interaction,
  });
});

export const updateInteraction = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.interactionId;
  const interaction = await interactionService.updateInteraction(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Interaction updated successfully',
    data: interaction,
  });
});

export const deleteInteraction = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.interactionId;
  await interactionService.deleteInteraction(id);

  res.status(200).json({
    success: true,
    message: 'Interaction deleted successfully',
  });
});
