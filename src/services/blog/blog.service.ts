/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../../config/prisma';
import { Prisma } from '../../generated/prisma';
import { BlogFilters, CreateBlogDTO, UpdateBlogDTO } from '../../types/blog.types';

export class BlogService {
  async createBlog(userId: string, data: CreateBlogDTO) {
    const blog = await prisma.blogs.create({
      data: {
        title: data.title,
        content: data.content,
        image_url: data.image_url,
        category: data.category,
        created_by_user_id: userId,
      } as any,
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

  async getAllBlogs(filters: BlogFilters) {
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

  async getBlogById(id: string) {
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

  async updateBlog(id: string, data: UpdateBlogDTO) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.category !== undefined) updateData.category = data.category;

    const blog = await prisma.blogs.update({
      where: { id: BigInt(id) } as any,
      data: updateData,
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

  async deleteBlog(id: string) {
    await prisma.blogs.delete({
      where: { id: BigInt(id) } as any,
    });
  }

  async getPublishedBlogs(filters: BlogFilters) {
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

  async getBlogCategories() {
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

export default new BlogService();
