import { Router } from 'express';
import * as skillCategoryController from '@/controllers/admin/skillCategory.controller';

const router = Router();

router.get('/', skillCategoryController.getAllSkillCategories);
router.post('/', skillCategoryController.createSkillCategory);
router.patch('/:id', skillCategoryController.updateSkillCategory);
router.delete('/:id', skillCategoryController.deleteSkillCategory);

export default router;
