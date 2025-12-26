// @ts-nocheck
import { env } from '@/config/env';
import logger from '@/config/logger';
import { ExtractedProjectData, ScrapedArticle } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class DataExtractorOperation {
  private static genAI: GoogleGenerativeAI | null = null;
  private static model: any = null;

  private static initializeAI() {
    if (!this.genAI && env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
    }
  }

  static async extractProjectData(article: ScrapedArticle): Promise<ExtractedProjectData | null> {
    try {
      this.initializeAI();

      if (!this.model) {
        logger.error('Gemini AI model not initialized');
        return null;
      }

      logger.info('Extracting project data with Gemini', { url: article.url });

      const prompt = `You are an expert at extracting infrastructure project information from news articles.

Article URL: ${article.url}

Article Content:
${article.content.substring(0, 8000)}

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

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('Failed to extract JSON from Gemini response');
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      if (!parsedData.valid || !parsedData.project_name) {
        logger.warn('Invalid or incomplete project data', { url: article.url });
        return null;
      }

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
}
