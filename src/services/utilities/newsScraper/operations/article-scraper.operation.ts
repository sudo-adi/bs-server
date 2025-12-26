// @ts-nocheck
import logger from '@/config/logger';
import { ScrapedArticle } from '@/types';
import axios from 'axios';

export class ArticleScraperOperation {
  private static jinaReaderBaseUrl = 'https://r.jina.ai';

  static async scrapeArticleWithJina(url: string): Promise<ScrapedArticle | null> {
    try {
      logger.info('Scraping article with Jina Reader', { url });

      const jinaUrl = `${this.jinaReaderBaseUrl}/${url}`;

      const headers: any = {
        Accept: 'text/plain',
      };

      const response = await axios.get(jinaUrl, {
        headers,
        timeout: 60000,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 401) {
        logger.warn('Jina API authentication failed, using free tier with rate limits', { url });
      }

      let content = '';

      if (typeof response.data === 'string') {
        content = response.data;
      } else if (response.data && response.data.content) {
        content = response.data.content;
      } else if (response.data && response.data.data) {
        content = response.data.data;
      }

      if (!content || content.length < 200) {
        logger.warn('Article content too short or empty', {
          url,
          contentLength: content.length,
          status: response.status,
        });
        return null;
      }

      return {
        url,
        content,
        scraped_at: new Date(),
      };
    } catch (error: any) {
      logger.error('Error scraping article with Jina', { url, error: error.message });
      return null;
    }
  }
}
