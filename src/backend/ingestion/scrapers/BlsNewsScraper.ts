import { BlsScraper, BlsEvent } from '../BlsScraper';
import { NewsItem } from '../NewsAggregator';

export class BlsNewsScraper {
  private blsScraper: BlsScraper;

  constructor() {
    this.blsScraper = new BlsScraper();
  }

  async init(): Promise<void> {
    await this.blsScraper.init();
  }

  async close(): Promise<void> {
    await this.blsScraper.close();
  }

  /**
   * Récupère les dernières données BLS et les convertit en NewsItems
   */
  async fetchNews(): Promise<NewsItem[]> {
    try {
      const events = await this.blsScraper.scrapeLatestNumbers();

      return events.map(event => ({
        title: `[ECONOMIC DATA] ${event.event_name}`,
        source: 'BLS',
        url: 'https://www.bls.gov/',
        timestamp: new Date(event.release_date),
        sentiment: 'neutral', // Les données économiques sont généralement neutres
        content: `Value: ${event.value}. Reference Period: ${event.reference_period}. ${event.change ? `Change: ${event.change}` : ''}`,
      }));
    } catch (error) {
      console.error('Error fetching BLS data:', error);
      return [];
    }
  }
}