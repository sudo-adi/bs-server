// @ts-nocheck
import { env } from '@/config/env';
import logger from '@/config/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WebsiteSelectionQuery } from '../queries/website-selection.query';

export class UrlFinderOperation {
  private static genAI: GoogleGenerativeAI | null = null;
  private static model: any = null;

  private static initializeAI() {
    if (!this.genAI && env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
    }
  }

  static async findRecentNewsUrls(websiteCount: number = 15): Promise<string[]> {
    try {
      this.initializeAI();

      if (!this.model) {
        logger.error('Gemini AI model not initialized');
        return [];
      }

      logger.info('Starting to find recent news URLs using Gemini');

      const selectedWebsites = await WebsiteSelectionQuery.getRandomWebsites(websiteCount);
      const websiteList = selectedWebsites.map((w) => w.url).join('\n');

      const prompt = `You are an infrastructure news research assistant. Your task is to find 5-7 recent infrastructure project news URLs from the following Indian infrastructure websites:

${websiteList}

IMPORTANT INSTRUCTIONS:
1. Return ONLY actual, real URLs that likely exist on these websites
2. Focus on finding recent news articles about infrastructure projects worth ₹1000+ crore
3. Look for articles about highways, railways, metro, ports, airports, power projects, etc.
4. The URLs should follow typical patterns like:
   - News sites: /news/..., /article/..., /infrastructure/..., /projects/...
   - Government sites: /press-release/..., /news/..., /announcements/...
   - Company sites: /press-releases/..., /news/..., /media/...

5. Return ONLY 5-7 URLs in this exact JSON format:
{
  "urls": [
    "https://exact-url-1.com/path",
    "https://exact-url-2.com/path",
    ...
  ]
}

Focus on diversity - select URLs from different websites if possible.
Return ONLY valid JSON, no additional text or explanation.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('Failed to extract JSON from Gemini response', { response });
        return [];
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      const urls = parsedResponse.urls || [];

      logger.info(`Found ${urls.length} potential URLs using Gemini`, { urls });
      return urls.slice(0, 7);
    } catch (error: any) {
      logger.error('Error finding news URLs with Gemini', {
        error: error.message,
        status: error.status,
        statusText: error.statusText,
        details: error.toString(),
      });
      return [];
    }
  }
}
