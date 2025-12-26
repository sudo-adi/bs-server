// @ts-nocheck
import scraperWebsiteService from '../../scraperWebsite/scraperWebsite.service';

interface WebsiteConfig {
  url: string;
  type?: string | null;
}

export class WebsiteSelectionQuery {
  static async getRandomWebsites(count: number): Promise<WebsiteConfig[]> {
    const websites = await scraperWebsiteService.getActiveWebsites();

    if (websites.length === 0) {
      return [];
    }

    const shuffled = [...websites].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}
