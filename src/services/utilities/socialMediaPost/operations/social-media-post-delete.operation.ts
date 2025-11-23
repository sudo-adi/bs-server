import prisma from '@/config/prisma';

export class SocialMediaPostDeleteOperation {
  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.social_media_posts.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }
}
