import { env } from '@/config/env';
import logger from '@/config/logger';
import {
  CreateNewsUpdateDto,
  ExtractedProjectData,
  ScrapedArticle,
  ScraperResult,
} from '@/models/utilities/newsUpdate.model';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import newsUpdateService from './newsupdate.service';
import scraperWebsiteService from './scraperWebsite.service';

interface WebsiteConfig {
  url: string;
  type?: string | null;
}

class ScraperService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private jinaReaderBaseUrl = 'https://r.jina.ai';

  constructor() {
    // Initialize Google Gemini AI
    if (env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      // Use gemini-2.5-flash-preview-05-20 (available for this API key)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
    }
  }

  // Step 1: Use Gemini to find 5-7 recent infrastructure news URLs
  async findRecentNewsUrls(websiteCount: number = 15): Promise<string[]> {
    try {
      logger.info('Starting to find recent news URLs using Gemini');

      // Get active websites from database
      const selectedWebsites = await this.getRandomWebsites(websiteCount);
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

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('Failed to extract JSON from Gemini response', { response });
        return [];
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      const urls = parsedResponse.urls || [];

      logger.info(`Found ${urls.length} potential URLs using Gemini`, { urls });
      return urls.slice(0, 7); // Limit to 7 URLs
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

  // Step 2: Use Jina Reader API to get clean article content
  async scrapeArticleWithJina(url: string): Promise<ScrapedArticle | null> {
    try {
      logger.info('Scraping article with Jina Reader', { url });

      const jinaUrl = `${this.jinaReaderBaseUrl}/${url}`;

      // Don't send Authorization header if API key is invalid/empty
      const headers: any = {
        Accept: 'text/plain', // Request plain text instead of JSON
      };

      const response = await axios.get(jinaUrl, {
        headers,
        timeout: 60000, // Increase timeout to 60 seconds
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });

      // Handle authentication errors
      if (response.status === 401) {
        logger.warn('Jina API authentication failed, using free tier with rate limits', { url });
        // Continue anyway - response might still have data
      }

      // Jina returns markdown/text content
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

  // Step 3: Use Gemini to extract structured project data
  async extractProjectData(article: ScrapedArticle): Promise<ExtractedProjectData | null> {
    try {
      logger.info('Extracting project data with Gemini', { url: article.url });

      const prompt = `You are an expert at extracting infrastructure project information from news articles.

Article URL: ${article.url}

Article Content:
${article.content.substring(0, 8000)} // Limit content to avoid token limits

Extract the following information about infrastructure projects:

IMPORTANT RULES:
1. Try to find any infrastructure project mentioned (any value is acceptable)
2. Convert any value to crores (e.g., ₹1 lakh crore = 100000 crore, ₹1 billion = 100 crore)
3. If project value is not mentioned or unclear, use 0
4. If multiple projects mentioned, extract the LARGEST one
5. REQUIRED fields: project_name, sector, summary_remarks (never leave these empty)
6. For sector: Choose from Roads/Railways/Metro/Ports/Airports/Power/Renewable Energy/Urban Infrastructure/Industrial/Water/Other
7. If sector is unclear, use "Infrastructure" or best guess
8. For summary_remarks: Write a brief 1-2 line description of what you found

Return data in this EXACT JSON format:
{
  "valid": true,
  "project_name": "Full project name (REQUIRED)",
  "sector": "REQUIRED - one of: Roads/Railways/Metro/Ports/Airports/Power/Renewable Energy/Urban Infrastructure/Industrial/Water/Other",
  "company_authority": "Name of company or government authority (use 'N/A' if not found)",
  "location": "City, State (use 'N/A' if not found)",
  "value_cr": 0,
  "status": "Approved/Under Construction/Completed/Delayed/Tender Stage/Planning (use 'N/A' if not found)",
  "revised_budget": null or number,
  "revised_timeline": "text or null",
  "delay_reason": "text or null",
  "source_type": "Government/News Media/Company (use 'News Media' if unclear)",
  "summary_remarks": "REQUIRED - Brief 1-2 line summary of the project"
}

If no infrastructure project is found at all, return {"valid": false}
Return ONLY valid JSON, no additional text.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('Failed to extract JSON from Gemini response');
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // Validate extracted data - only check for required fields
      if (!parsedData.valid || !parsedData.project_name) {
        logger.warn('Invalid or incomplete project data', { url: article.url });
        return null;
      }

      // Provide defaults for required fields if missing
      const sector =
        parsedData.sector && parsedData.sector.trim() !== '' ? parsedData.sector : 'Infrastructure';

      const summary_remarks =
        parsedData.summary_remarks && parsedData.summary_remarks.trim() !== ''
          ? parsedData.summary_remarks
          : `Infrastructure project: ${parsedData.project_name}`;

      const value_cr =
        parsedData.value_cr && typeof parsedData.value_cr === 'number' ? parsedData.value_cr : 0;

      logger.info('Successfully extracted project data', {
        url: article.url,
        project: parsedData.project_name,
        value: value_cr,
      });

      return {
        project_name: parsedData.project_name,
        sector: sector,
        company_authority:
          parsedData.company_authority && parsedData.company_authority.trim() !== ''
            ? parsedData.company_authority
            : 'N/A',
        location:
          parsedData.location && parsedData.location.trim() !== '' ? parsedData.location : 'N/A',
        value_cr: value_cr,
        status: parsedData.status && parsedData.status.trim() !== '' ? parsedData.status : 'N/A',
        revised_budget: parsedData.revised_budget || undefined,
        revised_timeline: parsedData.revised_timeline || undefined,
        delay_reason: parsedData.delay_reason || undefined,
        source_type:
          parsedData.source_type && parsedData.source_type.trim() !== ''
            ? parsedData.source_type
            : 'News Media',
        summary_remarks: summary_remarks,
      };
    } catch (error: any) {
      logger.error('Error extracting project data with Gemini', {
        url: article.url,
        error: error.message,
      });
      return null;
    }
  }

  // Main scraper workflow
  async runScraper(): Promise<ScraperResult> {
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
      // Check if API keys are configured
      if (!env.GEMINI_API_KEY) {
        const error = 'GEMINI_API_KEY not configured';
        logger.error(error);
        result.errors.push(error);
        return result;
      }

      // Step 1: Find URLs using Gemini
      const urls = await this.findRecentNewsUrls(15);
      result.total_urls_found = urls.length;

      if (urls.length === 0) {
        const error = 'No URLs found by Gemini';
        logger.warn(error);
        result.errors.push(error);
        return result;
      }

      // Step 2 & 3: Scrape and extract data from each URL
      const validProjects: CreateNewsUpdateDto[] = [];

      for (const url of urls) {
        try {
          // Check if URL already exists in database
          const exists = await newsUpdateService.existsBySourceUrl(url);
          if (exists) {
            logger.info('URL already exists in database, skipping', { url });
            result.total_duplicates++;
            continue;
          }

          // Scrape article with Jina
          const article = await this.scrapeArticleWithJina(url);
          if (!article) {
            result.errors.push(`Failed to scrape: ${url}`);
            continue;
          }
          result.total_articles_scraped++;

          // Extract project data with Gemini
          const projectData = await this.extractProjectData(article);
          if (!projectData) {
            result.errors.push(`Failed to extract data from: ${url}`);
            continue;
          }

          // Add source URL and add to valid projects
          validProjects.push({
            ...projectData,
            source_url: url,
          });
          result.total_valid_projects++;

          // Add delay between requests to avoid rate limiting
          await this.delay(2000); // 2 seconds delay
        } catch (error: any) {
          const errorMsg = `Error processing ${url}: ${error.message}`;
          logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      // Step 4: Bulk insert valid projects into database
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

  // Helper function to add delay
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Helper function to get random websites from database
  private async getRandomWebsites(count: number): Promise<WebsiteConfig[]> {
    // Get all active websites from database
    const websites = await scraperWebsiteService.getActiveWebsites();

    if (websites.length === 0) {
      logger.warn('No active websites found in database');
      return [];
    }

    // Shuffle and select random websites
    const shuffled = [...websites].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

export default new ScraperService();
