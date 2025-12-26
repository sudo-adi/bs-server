/**
 * Webhook Service
 * Sends notifications to external webhooks (Make.com, Zapier, etc.)
 */

import { env } from '@/config/env';
import logger from '@/config/logger';
import type { ScraperResult } from '@/services/scraper/scraper.service';

// =========================
// TYPES
// =========================

export interface WebhookPayload {
  event: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface ScraperWebhookPayload extends WebhookPayload {
  event: 'SCRAPER_COMPLETED' | 'SCRAPER_FAILED';
  success: boolean;
  summary: {
    websitesScraped: number;
    projectsFound: number;
    projectsInserted: number;
    duplicatesSkipped: number;
    errorsCount: number;
  };
  duration: string;
  metrics?: {
    jinaRequests: number;
    jinaSuccessful: number;
    jinaFailed: number;
    tokensUsed: number;
  };
  insertedProjects?: Array<{
    id: string;
    projectName: string;
    sector: string | null;
    valueCr: number | null;
  }>;
  errors?: string[];
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  message?: string;
  error?: string;
}

// =========================
// WEBHOOK SERVICE
// =========================

class WebhookService {
  private maxRetries = 3;
  private retryDelayMs = 1000;

  /**
   * Send a webhook request with retry mechanism
   */
  async sendWebhook(
    url: string,
    payload: WebhookPayload,
    options?: { retries?: number }
  ): Promise<WebhookResult> {
    const retries = options?.retries ?? this.maxRetries;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.info(`Sending webhook (attempt ${attempt}/${retries})`, {
          url,
          event: payload.event,
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BuildSewa-Scraper/1.0',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.ok) {
          logger.info('Webhook sent successfully', {
            url,
            statusCode: response.status,
            event: payload.event,
          });

          return {
            success: true,
            statusCode: response.status,
            message: 'Webhook sent successfully',
          };
        }

        // Non-retryable status codes
        if (response.status >= 400 && response.status < 500) {
          const errorText = await response.text();
          logger.error('Webhook failed with client error (not retrying)', {
            url,
            statusCode: response.status,
            error: errorText,
          });

          return {
            success: false,
            statusCode: response.status,
            error: `Client error: ${response.status} - ${errorText}`,
          };
        }

        // Retryable error
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (attempt < retries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          logger.warn(`Webhook attempt ${attempt} failed, retrying in ${delay}ms...`, {
            url,
            error: errorMessage,
          });
          await this.sleep(delay);
        } else {
          logger.error('Webhook failed after all retries', {
            url,
            attempts: retries,
            error: errorMessage,
          });

          return {
            success: false,
            error: `Failed after ${retries} attempts: ${errorMessage}`,
          };
        }
      }
    }

    return {
      success: false,
      error: 'Unexpected error in webhook send',
    };
  }

  /**
   * Notify when scraper completes (success or failure)
   */
  async notifyScraperComplete(result: ScraperResult): Promise<WebhookResult> {
    const webhookUrl = env.MAKE_WEBHOOK_URL;

    if (!webhookUrl) {
      logger.warn('MAKE_WEBHOOK_URL not configured, skipping webhook notification');
      return {
        success: false,
        error: 'Webhook URL not configured',
      };
    }

    const payload: ScraperWebhookPayload = {
      event: result.success ? 'SCRAPER_COMPLETED' : 'SCRAPER_FAILED',
      timestamp: new Date().toISOString(),
      success: result.success,
      summary: {
        websitesScraped: result.totalArticlesScraped,
        projectsFound: result.totalValidProjects,
        projectsInserted: result.totalInserted,
        duplicatesSkipped: result.totalDuplicates,
        errorsCount: result.errors.length,
      },
      duration: `${(result.durationMs / 1000).toFixed(1)}s`,
      metrics: result.metrics
        ? {
            jinaRequests: result.metrics.jinaRequests,
            jinaSuccessful: result.metrics.jinaSuccessful,
            jinaFailed: result.metrics.jinaFailed,
            tokensUsed: result.metrics.jinaTokensInput + result.metrics.jinaTokensOutput,
          }
        : undefined,
      insertedProjects: result.insertedProjects,
      errors: result.errors.length > 0 ? result.errors : undefined,
    };

    logger.info('Sending scraper completion webhook', {
      success: result.success,
      projectsInserted: result.totalInserted,
    });

    return this.sendWebhook(webhookUrl, payload);
  }

  /**
   * Send a generic notification webhook
   */
  async notify(event: string, data: Record<string, unknown>): Promise<WebhookResult> {
    const webhookUrl = env.MAKE_WEBHOOK_URL;

    if (!webhookUrl) {
      logger.warn('MAKE_WEBHOOK_URL not configured, skipping webhook notification');
      return {
        success: false,
        error: 'Webhook URL not configured',
      };
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      ...data,
    };

    return this.sendWebhook(webhookUrl, payload);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
export default webhookService;
