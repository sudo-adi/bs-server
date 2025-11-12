import scraperCron from '@/jobs/scraperCron';
import { NewsUpdateFilters, PaginationParams } from '@/models/utilities/newsUpdate.model';
import newsUpdateService from '@/services/utilities/newsupdate.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Get all news updates with filters and pagination
export const getAllNewsUpdates = catchAsync(async (req: Request, res: Response) => {
  const {
    sector,
    status,
    min_value,
    max_value,
    start_date,
    end_date,
    search,
    page,
    limit,
    sort_by,
    sort_order,
  } = req.query;

  const filters: NewsUpdateFilters = {
    sector: sector as string,
    status: status as string,
    min_value: min_value ? parseFloat(min_value as string) : undefined,
    max_value: max_value ? parseFloat(max_value as string) : undefined,
    start_date: start_date ? new Date(start_date as string) : undefined,
    end_date: end_date ? new Date(end_date as string) : undefined,
    search: search as string,
  };

  const pagination: PaginationParams = {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
    sort_by: (sort_by as string) || 'created_at',
    sort_order: (sort_order as 'asc' | 'desc') || 'desc',
  };

  const result = await newsUpdateService.getAll(filters, pagination);

  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

// Get single news update by ID
export const getNewsUpdateById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const newsUpdate = await newsUpdateService.getById(id);

  if (!newsUpdate) {
    res.status(404).json({
      success: false,
      message: 'News update not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: newsUpdate,
  });
});

// Get dashboard statistics
export const getStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await newsUpdateService.getStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// Search news updates
export const searchNewsUpdates = catchAsync(async (req: Request, res: Response) => {
  const { keyword, limit } = req.query;

  if (!keyword) {
    res.status(400).json({
      success: false,
      message: 'Search keyword is required',
    });
    return;
  }

  const searchLimit = limit ? parseInt(limit as string) : 20;
  const results = await newsUpdateService.search(keyword as string, searchLimit);

  res.status(200).json({
    success: true,
    data: results,
    count: results.length,
  });
});

// Create news update manually (admin only)
export const createNewsUpdate = catchAsync(async (req: Request, res: Response) => {
  const newsUpdate = await newsUpdateService.create(req.body);

  res.status(201).json({
    success: true,
    message: 'News update created successfully',
    data: newsUpdate,
  });
});

// Update news update
export const updateNewsUpdate = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const newsUpdate = await newsUpdateService.update(id, req.body);

  if (!newsUpdate) {
    res.status(404).json({
      success: false,
      message: 'News update not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'News update updated successfully',
    data: newsUpdate,
  });
});

// Delete news update
export const deleteNewsUpdate = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const deleted = await newsUpdateService.delete(id);

  if (!deleted) {
    res.status(404).json({
      success: false,
      message: 'News update not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'News update deleted successfully',
  });
});

// Manual trigger for scraper (for testing)
export const triggerScraper = catchAsync(async (req: Request, res: Response) => {
  // Run scraper and wait for completion
  const result = await scraperCron.triggerManual();

  res.status(200).json({
    success: true,
    message: 'News scraper completed successfully',
    data: result,
  });
});

// Get scraper status
export const getScraperStatus = catchAsync(async (req: Request, res: Response) => {
  const status = scraperCron.getStatus();

  res.status(200).json({
    success: true,
    data: status,
  });
});
