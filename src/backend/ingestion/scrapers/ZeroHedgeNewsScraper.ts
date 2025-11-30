import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsScraper } from '../NewsScraper';
import { NewsItem } from '../NewsAggregator';

export class ZeroHedgeNewsScraper {
  private newsScraper: NewsScraper;

  constructor() {
    this.newsScraper = new NewsScraper();
  }

  async init(): Promise<void> {
    await this.newsScraper.init();
  }

  async close(): Promise<void> {
    await this.newsScraper.close();
  }

  /**
   * Scrapes the full content of an article from its URL.
   */
  private async scrapeArticleContent(url: string): Promise<string> {
    return this.newsScraper.scrapeArticle(url);
  }

  /**
   * Récupère les news via RSS pour ZeroHedge (Beaucoup plus fiable que le scraping HTML)
   */
  async fetchNews(): Promise<NewsItem[]> {
    try {
      // Flux RSS officiel de ZeroHedge
      const { data } = await axios.get('http://feeds.feedburner.com/zerohedge/feed', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaQuoteAgent/1.0)' },
        timeout: 5000,
      });

      const $ = cheerio.load(data, { xmlMode: true });

      // Get top 5 items to scrape content for (to avoid timeouts)
      const items = $('item').toArray().slice(0, 5);

      const newsPromises = items.map(async (el): Promise<NewsItem | null> => {
        const title = $(el).find('title').text().trim();
        const link = $(el).find('link').text().trim();
        const pubDate = $(el).find('pubDate').text();
        const description = $(el).find('description').text().trim();

        if (title && link) {
          // Fetch full content - NO FALLBACK
          const content = await this.scrapeArticleContent(link);

          // Only return if we successfully scraped the content
          if (content && content.length >= 50) {
            return {
              title,
              source: 'ZeroHedge',
              url: link,
              timestamp: new Date(pubDate),
              content,
            };
          }
          // Skip article if scraping failed - NO FALLBACK to description
          console.log(`[ZeroHedgeNewsScraper] ⚠️ Skipping article due to insufficient content: ${title}`);
        }
        return null;
      });

      const results = await Promise.all(newsPromises);
      return results.filter((n): n is NewsItem => n !== null);
    } catch (error) {
      console.error(
        'Error fetching ZeroHedge RSS:',
        error instanceof Error ? error.message : error
      );
      return [];
    }
  }
}