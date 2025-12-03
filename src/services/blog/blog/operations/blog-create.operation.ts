/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/config/prisma';
import { CreateBlogDto } from '@/types';

export class BlogCreateOperation {
  /**
   * Create a new blog post
   */
  static async create(userId: string, data: CreateBlogDto) {
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
}
