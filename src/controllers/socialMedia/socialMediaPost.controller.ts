import { socialMediaPostService } from '@/services/utilities';
import { PaginationParams, SocialMediaPostFilters } from '@/types';
import type { PostStatus, SocialPlatform } from '@/types/domain/social-media/social-media.types';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Get all posts with filters and pagination
export const getAllPosts = catchAsync(async (req: Request, res: Response) => {
  const { status, platform, start_date, end_date, project_name, page, limit, sort_by, sort_order } =
    req.query;

  const filters: SocialMediaPostFilters = {
    status: status as PostStatus,
    platform: platform as SocialPlatform,
    start_date: start_date ? new Date(start_date as string) : undefined,
    end_date: end_date ? new Date(end_date as string) : undefined,
    project_name: project_name as string,
    sort_by: (sort_by as string) || 'createdAt',
    sort_order: (sort_order as 'asc' | 'desc') || 'desc',
    limit: limit ? parseInt(limit as string) : 20,
    offset: page ? (parseInt(page as string) - 1) * (limit ? parseInt(limit as string) : 20) : 0,
  };

  const pagination: PaginationParams = {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
  };

  const result = await socialMediaPostService.getAll(filters, {
    page: pagination.page!,
    limit: pagination.limit!,
  });

  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

// Get single post by ID
export const getPostById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const post = await socialMediaPostService.getById(id);

  if (!post) {
    res.status(404).json({
      success: false,
      message: 'Post not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: post,
  });
});

// Create new post
export const createPost = catchAsync(async (req: Request, res: Response) => {
  const post = await socialMediaPostService.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: post,
  });
});

// Update post
export const updatePost = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const post = await socialMediaPostService.update(id, req.body);

  if (!post) {
    res.status(404).json({
      success: false,
      message: 'Post not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Post updated successfully',
    data: post,
  });
});

// Delete post
export const deletePost = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const deleted = await socialMediaPostService.delete(id);

  if (!deleted) {
    res.status(404).json({
      success: false,
      message: 'Post not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully',
  });
});

// Get statistics
export const getStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await socialMediaPostService.getStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// Search posts
export const searchPosts = catchAsync(async (req: Request, res: Response) => {
  const { keyword, limit } = req.query;

  if (!keyword) {
    res.status(400).json({
      success: false,
      message: 'Search keyword is required',
    });
    return;
  }

  const searchLimit = limit ? parseInt(limit as string) : 20;
  const results = await socialMediaPostService.search(keyword as string, searchLimit);

  res.status(200).json({
    success: true,
    data: results,
  });
});
