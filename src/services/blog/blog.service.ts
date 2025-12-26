import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

export interface BlogFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export interface CreateBlogDto {
  title: string;
  content?: string;
  imageUrl?: string;
  category?: string;
}

export interface UpdateBlogDto {
  title?: string;
  content?: string;
  imageUrl?: string;
  category?: string;
}

export class BlogService {
  async createBlog(profileId: string, data: CreateBlogDto) {
    const blog = await prisma.blog.create({
      data: {
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl,
        category: data.category,
        createdByProfileId: profileId || null,
        createdAt: new Date(),
      },
    });

    return blog;
  }

  async getAllBlogs(filters: BlogFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const where: Prisma.BlogWhereInput = {};

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
      prisma.blog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.blog.count({ where }),
    ]);

    return {
      blogs,
      total,
      limit,
      offset,
    };
  }

  async getBlogById(id: string) {
    const blog = await prisma.blog.findUnique({
      where: { id: BigInt(id) },
    });

    return blog;
  }

  async updateBlog(id: string, data: UpdateBlogDto) {
    const updateData: Prisma.BlogUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.category !== undefined) updateData.category = data.category;

    const blog = await prisma.blog.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return blog;
  }

  async deleteBlog(id: string) {
    await prisma.blog.delete({
      where: { id: BigInt(id) },
    });
  }

  async getPublishedBlogs(filters: BlogFilters) {
    // Same as getAllBlogs for now - add published filter when schema supports it
    return this.getAllBlogs(filters);
  }

  async getBlogCategories() {
    const categories = await prisma.blog.findMany({
      where: {
        category: { not: null },
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
