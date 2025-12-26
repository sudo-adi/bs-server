// @ts-nocheck
import { env } from '@/config/env';
import logger from '@/config/logger';
import { CreateNewsUpdateDto, ScraperResult } from '@/types';
import newsUpdateService from '../../newsUpdate/newsUpdate.service';
import { ScraperHelper } from '../helpers/scraper.helper';
import { ArticleScraperOperation } from './article-scraper.operation';
import { DataExtractorOperation } from './data-extractor.operation';
import { UrlFinderOperation } from './url-finder.operation';

export class ScraperRunnerOperation {
  static async runScraper(): Promise<ScraperResult> {
    const startTime = Date.now();
    logger.info('=== Starting News Scraper ===');

    const result: ScraperResult = {
      success: false,
      total_urls_found: 0,
      total_articles_scraped: 0,
      total_valid_projects: 0,
      total_inserted: 0,
      total_duplicates: 0,
      errors: [],
      inserted_projects: [],
    };

    try {
      if (!env.GEMINI_API_KEY) {
        const error = 'GEMINI_API_KEY not configured';
        logger.error(error);
        result.errors.push(error);
        return result;
      }

      const urls = await UrlFinderOperation.findRecentNewsUrls(15);
      result.total_urls_found = urls.length;

      if (urls.length === 0) {
        const error = 'No URLs found by Gemini';
        logger.warn(error);
        result.errors.push(error);
        return result;
      }

      const validProjects: CreateNewsUpdateDto[] = [];

      for (const url of urls) {
        try {
          const exists = await newsUpdateService.existsBySourceUrl(url);
          if (exists) {
            logger.info('URL already exists in database, skipping', { url });
            result.total_duplicates++;
            continue;
          }

          const article = await ArticleScraperOperation.scrapeArticleWithJina(url);
          if (!article) {
            result.errors.push(`Failed to scrape: ${url}`);
            continue;
          }
          result.total_articles_scraped++;

          const projectData = await DataExtractorOperation.extractProjectData(article);
          if (!projectData) {
            result.errors.push(`Failed to extract data from: ${url}`);
            continue;
          }

          // validProjects.push({
          //   ...projectData,
          //   source_url: url,
          // });
          result.total_valid_projects++;

          await ScraperHelper.delay(2000);
        } catch (error: any) {
          const errorMsg = `Error processing ${url}: ${error.message}`;
          logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      if (validProjects.length > 0) {
        const bulkResult = await newsUpdateService.bulkCreate(validProjects);
        result.total_inserted = bulkResult.inserted.length;
        result.total_duplicates += bulkResult.duplicates;
        result.inserted_projects = bulkResult.inserted;
      }

      result.success = result.total_inserted > 0;

      const duration = (Date.now() - startTime) / 1000;
      logger.info('=== News Scraper Completed ===', {
        duration: `${duration}s`,
        ...result,
      });

      return result;
    } catch (error: any) {
      logger.error('Critical error in scraper', { error: error.message });
      result.errors.push(`Critical error: ${error.message}`);
      return result;
    }
  }
}
