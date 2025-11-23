/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/config/prisma';
import { UpdateBlogDTO } from '@/types/blog.types';

export class BlogUpdateOperation {
  /**
   * Update a blog post
   */
  static async update(id: string, data: UpdateBlogDTO) {
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
}
