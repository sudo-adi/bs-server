import { ExtractedProjectData, ScrapedArticle, ScraperResult } from '@/types';
import { ArticleScraperOperation } from './operations/article-scraper.operation';
import { DataExtractorOperation } from './operations/data-extractor.operation';
import { ScraperRunnerOperation } from './operations/scraper-runner.operation';
import { UrlFinderOperation } from './operations/url-finder.operation';

export class NewsScraperService {
  async findRecentNewsUrls(websiteCount?: number): Promise<string[]> {
    return UrlFinderOperation.findRecentNewsUrls(websiteCount);
  }

  async scrapeArticleWithJina(url: string): Promise<ScrapedArticle | null> {
    return ArticleScraperOperation.scrapeArticleWithJina(url);
  }

  async extractProjectData(article: ScrapedArticle): Promise<ExtractedProjectData | null> {
    return DataExtractorOperation.extractProjectData(article);
  }

  async runScraper(): Promise<ScraperResult> {
    return ScraperRunnerOperation.runScraper();
  }
}

export default new NewsScraperService();
