import prisma from '@/config/prisma';
import type { CreateProjectSkillRequirementDto } from '@/types';
import type { ProjectResourceRequirement } from '@/types/prisma.types';

export class ResourceRequirementCreateOperation {
  static async create(data: CreateProjectSkillRequirementDto): Promise<ProjectResourceRequirement> {
    const requirement = await prisma.project_resource_requirements.create({
      data: {
        project_id: data.project_id,
        skill_category_id: data.skill_category_id,
        required_count: data.required_count,
        notes: data.notes,
      },
    });

    return requirement;
  }
}
