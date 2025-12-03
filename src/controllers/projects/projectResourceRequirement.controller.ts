import { projectResourceRequirementService } from '@/services/projects';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Create project skill requirement
export const createRequirement = catchAsync(async (req: Request, res: Response) => {
  const requirement = await projectResourceRequirementService.createRequirement(req.body);

  res.status(201).json({
    success: true,
    message: 'Project skill requirement created successfully',
    data: requirement,
  });
});

// Bulk create project skill requirements
export const bulkCreateRequirements = catchAsync(async (req: Request, res: Response) => {
  const { project_id, requirements } = req.body;

  if (!Array.isArray(requirements) || requirements.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'requirements array is required',
    });
  }

  const created = [];
  for (const req of requirements) {
    const requirement = await projectResourceRequirementService.createRequirement({
      project_id,
      skill_category_id: req.skill_category_id,
      required_count: req.required_count,
      notes: req.notes,
    });
    created.push(requirement);
  }

  res.status(201).json({
    success: true,
    message: `Created ${created.length} skill requirements`,
    data: created,
  });
});

// Get all requirements with filters
export const getAllRequirements = catchAsync(async (req: Request, res: Response) => {
  const { project_id, skill_category_id, limit, offset } = req.query;

  const filters = {
    project_id: project_id as string | undefined,
    skill_category_id: skill_category_id as string | undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  };

  const result = await projectResourceRequirementService.getAllRequirements(filters);

  res.status(200).json({
    success: true,
    data: result.requirements,
    pagination: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
});

// Get skill allocation status for a project
export const getSkillAllocationStatus = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.projectId; // UUID string, not integer

  const status = await projectResourceRequirementService.getSkillAllocationStatus(projectId);

  res.status(200).json({
    success: true,
    data: status,
  });
});

// Get requirement by ID
export const getRequirementById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const includeDetails = req.query.include_details === 'true';

  const requirement = await projectResourceRequirementService.getRequirementById(
    id,
    includeDetails
  );

  res.status(200).json({
    success: true,
    data: requirement,
  });
});

// Update requirement
export const updateRequirement = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const requirement = await projectResourceRequirementService.updateRequirement(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Project skill requirement updated successfully',
    data: requirement,
  });
});

// Delete requirement
export const deleteRequirement = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  await projectResourceRequirementService.deleteRequirement(id);

  res.status(200).json({
    success: true,
    message: 'Project skill requirement deleted successfully',
  });
});
