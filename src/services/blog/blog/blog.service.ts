import { BlogFilters, CreateBlogDTO, UpdateBlogDTO } from '@/types/blog.types';
import { BlogCreateOperation } from './operations/blog-create.operation';
import { BlogDeleteOperation } from './operations/blog-delete.operation';
import { BlogUpdateOperation } from './operations/blog-update.operation';
import { BlogQuery } from './queries/blog.query';

export class BlogService {
  async createBlog(userId: string, data: CreateBlogDTO) {
    return await BlogCreateOperation.create(userId, data);
  }

  async getAllBlogs(filters: BlogFilters) {
    return await BlogQuery.getAllBlogs(filters);
  }

  async getBlogById(id: string) {
    return await BlogQuery.getBlogById(id);
  }

  async updateBlog(id: string, data: UpdateBlogDTO) {
    return await BlogUpdateOperation.update(id, data);
  }

  async deleteBlog(id: string) {
    return await BlogDeleteOperation.delete(id);
  }

  async getPublishedBlogs(filters: BlogFilters) {
    return await BlogQuery.getPublishedBlogs(filters);
  }

  async getBlogCategories() {
    return await BlogQuery.getBlogCategories();
  }
}

export default new BlogService();
