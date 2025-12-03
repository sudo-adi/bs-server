/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { BlogFilters } from '@/types';

export class BlogQuery {
  /**
   * Get all blogs with filters
   */
  static async getAllBlogs(filters: BlogFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const where: Prisma.blogsWhereInput = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [blogs, total] = await Promise.all([
      prisma.blogs.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              full_name: true,
              username: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.blogs.count({ where }),
    ]);

    return {
      blogs,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get blog by ID
   */
  static async getBlogById(id: string) {
    const blog = await prisma.blogs.findUnique({
      where: { id: BigInt(id) } as any,
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            username: true,
          },
        },
      },
    });

    return blog;
  }

  /**
   * Get published blogs
   */
  static async getPublishedBlogs(filters: BlogFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const where: Prisma.blogsWhereInput = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [blogs, total] = await Promise.all([
      prisma.blogs.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              full_name: true,
              username: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.blogs.count({ where }),
    ]);

    return {
      blogs,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get blog categories
   */
  static async getBlogCategories() {
    const categories = await prisma.blogs.findMany({
      where: {
        category: { not: null } as any,
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return categories.map((c) => c.category).filter(Boolean);
  }
}
