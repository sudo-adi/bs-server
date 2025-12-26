import { blogService } from '@/services/blog';
import { Request, Response } from 'express';

export class BlogController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        category: req.query.category as string,
      };
      const result = await blogService.getAllBlogs(query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch blogs' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const blog = await blogService.getBlogById(req.params.id);
      if (!blog) {
        res.status(404).json({ success: false, message: 'Blog not found' });
        return;
      }
      res.status(200).json({ success: true, data: blog });
    } catch (error: any) {
      const status = error.message === 'Blog not found' ? 404 : 500;
      res.status(status).json({ success: false, message: error.message || 'Failed to fetch blog' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body.title) {
        res.status(400).json({ success: false, message: 'Title is required' });
        return;
      }
      const blog = await blogService.createBlog(req.user?.id || '', req.body);
      res.status(201).json({ success: true, message: 'Blog created successfully', data: blog });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to create blog' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const blog = await blogService.updateBlog(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Blog updated successfully', data: blog });
    } catch (error: any) {
      const status = error.message === 'Blog not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to update blog' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await blogService.deleteBlog(req.params.id);
      res.status(200).json({ success: true, message: 'Blog deleted successfully' });
    } catch (error: any) {
      const status = error.message === 'Blog not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to delete blog' });
    }
  }

  async getPublished(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        category: req.query.category as string,
      };
      const result = await blogService.getPublishedBlogs(query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch blogs' });
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await blogService.getBlogCategories();
      res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to fetch categories' });
    }
  }
}

export const blogController = new BlogController();
export default blogController;
