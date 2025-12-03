import { CreateBlogDto, UpdateBlogDto } from '@/types';
import { Request, Response } from 'express';
import blogService from '../../services/blog/blog.service';
import { catchAsync } from '../../utils/catchAsync';

export const createBlog = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const blogData: CreateBlogDto = req.body;

  const blog = await blogService.createBlog(userId, blogData);

  // Convert BigInt to string for JSON serialization
  const serializedBlog = {
    ...blog,
    id: blog.id.toString(),
  };

  res.status(201).json({
    success: true,
    message: 'Blog created successfully',
    data: serializedBlog,
  });
});

export const getAllBlogs = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    category: req.query.category as string,
    search: req.query.search as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
  };

  const result = await blogService.getAllBlogs(filters);

  // Convert BigInt to string for JSON serialization
  const serializedBlogs = result.blogs.map((blog) => ({
    ...blog,
    id: blog.id.toString(),
  }));

  res.status(200).json({
    success: true,
    data: serializedBlogs,
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  });
});

export const getBlogById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const blog = await blogService.getBlogById(id);

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: 'Blog not found',
    });
  }

  // Convert BigInt to string for JSON serialization
  const serializedBlog = {
    ...blog,
    id: blog.id.toString(),
  };

  res.status(200).json({
    success: true,
    data: serializedBlog,
  });
});

export const updateBlog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateBlogDto = req.body;

  const blog = await blogService.updateBlog(id, updateData);

  // Convert BigInt to string for JSON serialization
  const serializedBlog = {
    ...blog,
    id: blog.id.toString(),
  };

  res.status(200).json({
    success: true,
    message: 'Blog updated successfully',
    data: serializedBlog,
  });
});

export const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await blogService.deleteBlog(id);

  res.status(200).json({
    success: true,
    message: 'Blog deleted successfully',
  });
});

export const getPublishedBlogs = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    category: req.query.category as string,
    search: req.query.search as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
  };

  const result = await blogService.getPublishedBlogs(filters);

  // Convert BigInt to string for JSON serialization
  const serializedBlogs = result.blogs.map((blog) => ({
    ...blog,
    id: blog.id.toString(),
  }));

  res.status(200).json({
    success: true,
    data: serializedBlogs,
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  });
});

export const getBlogCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await blogService.getBlogCategories();

  res.status(200).json({
    success: true,
    data: categories,
  });
});
