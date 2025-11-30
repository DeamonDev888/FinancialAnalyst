import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsScraper } from '../NewsScraper';
import { NewsItem } from '../NewsAggregator';

export class FinancialJuiceNewsScraper {
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
   * Récupère les news de FinancialJuice via RSS
   * URL: https://www.financialjuice.com/feed.ashx?xy=rss
   */
  async fetchNews(): Promise<NewsItem[]> {
    try {
      const { data } = await axios.get('https://www.financialjuice.com/feed.ashx?xy=rss', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaQuoteAgent/1.0)' },
        timeout: 5000,
      });

      const $ = cheerio.load(data, { xmlMode: true });

      // Get top 10 items for FinancialJuice (often shorter updates)
      const items = $('item').toArray().slice(0, 10);

      const newsPromises = items.map(async (el): Promise<NewsItem | null> => {
        const title = $(el).find('title').text().trim();
        const link = $(el).find('link').text().trim();
        const pubDate = $(el).find('pubDate').text();
        // FinancialJuice often puts the content in the title or description directly
        const description = $(el).find('description').text().trim();

        if (title && link) {
          // FinancialJuice links often redirect or are just headlines.
          // We'll try to scrape but rely heavily on description.
          let content = await this.scrapeArticleContent(link);

          if (!content || content.length < 20) {
            content = description;
          }

          return {
            title,
            source: 'FinancialJuice',
            url: link,
            timestamp: new Date(pubDate),
            content: content || title,
          };
        }
        return null;
      });

      const results = await Promise.all(newsPromises);
      return results.filter((n): n is NewsItem => n !== null);
    } catch (error) {
      console.error(
        'Error fetching FinancialJuice RSS:',
        error instanceof Error ? error.message : error
      );
      return [];
    }
  }
}