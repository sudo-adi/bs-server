/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/config/prisma';

export class BlogDeleteOperation {
  /**
   * Delete a blog post
   */
  static async delete(id: string) {
    await prisma.blogs.delete({
      where: { id: BigInt(id) } as any,
    });
  }
}
