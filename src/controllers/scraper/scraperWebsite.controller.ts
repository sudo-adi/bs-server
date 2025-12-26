// @ts-nocheck
import { scraperWebsiteService } from '@/services/utilities';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Get all scraper websites
export const getAllWebsites = catchAsync(async (req: Request, res: Response) => {
  const activeOnly = req.query.active_only === 'true';
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

  const result = await scraperWebsiteService.getAll(activeOnly, { page, limit });

  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

// Get websites by type
export const getWebsitesByType = catchAsync(async (req: Request, res: Response) => {
  const { type } = req.params;
  const activeOnly = req.query.active_only === 'true';

  const websites = await scraperWebsiteService.getByType(type, activeOnly);

  res.status(200).json({
    success: true,
    data: websites,
    count: websites.length,
  });
});

// Get single website by ID
export const getWebsiteById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const website = await scraperWebsiteService.getById(id);

  if (!website) {
    res.status(404).json({
      success: false,
      message: 'Website not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: website,
  });
});

// Create new website
export const createWebsite = catchAsync(async (req: Request, res: Response) => {
  // Check if URL already exists
  const exists = await scraperWebsiteService.urlExists(req.body.url);
  if (exists) {
    res.status(409).json({
      success: false,
      message: 'Website URL already exists',
    });
    return;
  }

  const website = await scraperWebsiteService.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Website added successfully',
    data: website,
  });
});

// Update website
export const updateWebsite = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  // If URL is being updated, check if it already exists
  if (req.body.url) {
    const exists = await scraperWebsiteService.urlExists(req.body.url, id);
    if (exists) {
      res.status(409).json({
        success: false,
        message: 'Website URL already exists',
      });
      return;
    }
  }

  const website = await scraperWebsiteService.update(id, req.body);

  if (!website) {
    res.status(404).json({
      success: false,
      message: 'Website not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Website updated successfully',
    data: website,
  });
});

// Delete website
export const deleteWebsite = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const deleted = await scraperWebsiteService.delete(id);

  if (!deleted) {
    res.status(404).json({
      success: false,
      message: 'Website not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Website deleted successfully',
  });
});

// Get statistics
export const getWebsiteStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await scraperWebsiteService.getStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// Bulk seed websites (for initial setup)
export const seedWebsites = catchAsync(async (req: Request, res: Response) => {
  const { websites } = req.body;

  if (!Array.isArray(websites) || websites.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Websites array is required',
    });
    return;
  }

  const count = await scraperWebsiteService.bulkCreate(websites);

  res.status(201).json({
    success: true,
    message: `${count} websites seeded successfully`,
    count,
  });
});
