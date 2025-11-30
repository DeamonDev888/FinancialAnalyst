import { FinnhubClient, FinnhubNews } from '../FinnhubClient';
import { NewsItem } from '../NewsAggregator';

export class FinnhubNewsScraper {
  private finnhubClient: FinnhubClient;

  constructor() {
    this.finnhubClient = new FinnhubClient();
  }

  async init(): Promise<void> {
    // FinnhubClient doesn't need initialization
  }

  async close(): Promise<void> {
    // FinnhubClient doesn't need cleanup
  }

  /**
   * Récupère les news via Finnhub et les convertit en NewsItems
   */
  async fetchNews(): Promise<NewsItem[]> {
    try {
      const news = await this.finnhubClient.fetchMarketNews();
      return news.map((n: FinnhubNews) => ({
        title: n.headline,
        source: 'Finnhub',
        url: n.url,
        timestamp: new Date(n.datetime * 1000), // Finnhub utilise des timestamps Unix
        sentiment: 'neutral',
      }));
    } catch (error) {
      console.error('Error fetching Finnhub news:', error);
      return [];
    }
  }
}