import type {
  CreateProfileSkillDto,
  CreateSkillCategoryDto,
  ProfileSkill,
  SkillCategory,
  UpdateProfileSkillDto,
  UpdateSkillCategoryDto,
  VerifySkillDto,
} from '@/types';
import { ProfileSkillCreateOperation } from './operations/profile-skill-create.operation';
import { ProfileSkillDeleteOperation } from './operations/profile-skill-delete.operation';
import { ProfileSkillUpdateOperation } from './operations/profile-skill-update.operation';
import { ProfileSkillVerifyOperation } from './operations/profile-skill-verify.operation';
import { SkillCategoryCreateOperation } from './operations/skill-category-create.operation';
import { SkillCategoryDeleteOperation } from './operations/skill-category-delete.operation';
import { SkillCategoryUpdateOperation } from './operations/skill-category-update.operation';
import { ProfileSkillQuery } from './queries/profile-skill.query';
import { SkillCategoryQuery } from './queries/skill-category.query';

export class SkillService {
  async getAllSkillCategories(activeOnly = false): Promise<SkillCategory[]> {
    return SkillCategoryQuery.getAllSkillCategories(activeOnly);
  }

  async createSkillCategory(data: CreateSkillCategoryDto): Promise<SkillCategory> {
    return SkillCategoryCreateOperation.create(data);
  }

  async updateSkillCategory(id: string, data: UpdateSkillCategoryDto): Promise<SkillCategory> {
    return SkillCategoryUpdateOperation.update(id, data);
  }

  async deleteSkillCategory(id: string): Promise<void> {
    return SkillCategoryDeleteOperation.delete(id);
  }

  async getProfileSkills(profileId: string): Promise<ProfileSkill[]> {
    return ProfileSkillQuery.getProfileSkills(profileId);
  }

  async addProfileSkill(data: CreateProfileSkillDto): Promise<ProfileSkill> {
    return ProfileSkillCreateOperation.create(data);
  }

  async updateProfileSkill(id: string, data: UpdateProfileSkillDto): Promise<ProfileSkill> {
    return ProfileSkillUpdateOperation.update(id, data);
  }

  async verifyProfileSkill(id: string, data: VerifySkillDto): Promise<ProfileSkill> {
    return ProfileSkillVerifyOperation.verify(id, data);
  }

  async deleteProfileSkill(id: string): Promise<void> {
    return ProfileSkillDeleteOperation.delete(id);
  }
}

export default new SkillService();
