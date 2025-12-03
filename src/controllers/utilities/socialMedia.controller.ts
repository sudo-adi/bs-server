import { env } from '@/config/env';
import logger from '@/config/logger';
import { socialMediaPostService } from '@/services/utilities';
import { uploadFile } from '@/utils/fileStorage';
import axios from 'axios';
import { Request, Response } from 'express';

interface SocialMediaContent {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
}

/**
 * Create and publish social media post via Make.com
 */
export const createSocialMediaPost = async (req: Request, res: Response) => {
  try {
    // Parse form data - JSON strings need to be parsed
    let content: SocialMediaContent;
    let tags: string[] = [];

    try {
      content =
        typeof req.body.content === 'string' ? JSON.parse(req.body.content) : req.body.content;
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content format - must be valid JSON',
      });
    }

    if (req.body.tags) {
      try {
        tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
      } catch (error) {
        tags = [];
      }
    }

    const { project_name, source_url, post_immediately, title, video_url } = req.body;

    // Validate required fields
    if (!content || typeof content !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Content object is required',
      });
    }

    if (!project_name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      });
    }

    // Check if Make.com webhook is configured
    if (!env.MAKE_WEBHOOK_URL) {
      return res.status(500).json({
        success: false,
        message: 'Make.com webhook URL is not configured',
      });
    }

    let imageUrl = '';

    // Handle image upload if file is present
    if (req.file) {
      try {
        logger.info('Uploading image to local storage...');
        imageUrl = await uploadFile(req.file.buffer, req.file.originalname);
        logger.info(`Image uploaded successfully: ${imageUrl}`);
      } catch (uploadError: any) {
        logger.error('Image upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image',
          error: uploadError.message,
        });
      }
    }

    // Prepare payload for Make.com
    const makePayload = {
      content,
      image_url: imageUrl || undefined,
      video_url: video_url || undefined,
      project_name,
      source_url: source_url || undefined,
      post_immediately: post_immediately === 'true' || post_immediately === true,
      title: title || undefined,
      tags: tags,
    };

    // Remove Instagram and YouTube content if they exist (as per user request)
    if (makePayload.content.instagram) {
      delete makePayload.content.instagram;
    }
    if (makePayload.content.youtube) {
      delete makePayload.content.youtube;
    }

    logger.info('Sending payload to Make.com webhook...');

    // Send to Make.com webhook
    const makeResponse = await axios.post(env.MAKE_WEBHOOK_URL, makePayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    logger.info('Make.com webhook response:', makeResponse.data);

    // Save to database
    try {
      const savedPost = await socialMediaPostService.create({
        title: title || project_name,
        content: JSON.stringify(content),
        platforms: Object.keys(content) as any[],
        tags: tags || [],
        image_url: imageUrl || undefined,
        video_url: video_url || undefined,
        project_name,
        source_url: source_url || undefined,
        status: post_immediately ? 'published' : 'scheduled',
        published_at: post_immediately ? new Date() : undefined,
        make_response: makeResponse.data,
        platform_content: content as Record<string, unknown>,
        created_by: 'admin',
      });

      logger.info('Post saved to database with ID:', savedPost.id);
    } catch (dbError: any) {
      logger.error('Failed to save post to database:', dbError);
      // Don't fail the request if database save fails
    }

    return res.status(200).json({
      success: true,
      message: 'Post created and sent to Make.com successfully',
      data: {
        image_url: imageUrl,
        make_response: makeResponse.data,
      },
    });
  } catch (error: any) {
    logger.error('Error creating social media post:', error);

    // Handle axios errors
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        success: false,
        message: 'Failed to send post to Make.com',
        error: error.response?.data || error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
