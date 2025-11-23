import prisma from '@/config/prisma';
import {
  CreateProjectSkillRequirementDto,
  ProjectSkillRequirement,
} from '@/models/projects/projectResourceRequirement.model';

export class ResourceRequirementCreateOperation {
  static async create(data: CreateProjectSkillRequirementDto): Promise<ProjectSkillRequirement> {
    const requirement = await prisma.project_resource_requirements.create({
      data: {
        project_id: data.project_id.toString(),
        skill_category_id: data.skill_category_id.toString(),
        required_count: data.required_count,
        notes: data.notes,
      },
    });

    return requirement as any;
  }
}
