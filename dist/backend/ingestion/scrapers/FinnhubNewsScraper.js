import { FinnhubClient } from '../FinnhubClient';
export class FinnhubNewsScraper {
    finnhubClient;
    constructor() {
        this.finnhubClient = new FinnhubClient();
    }
    async init() {
        // FinnhubClient doesn't need initialization
    }
    async close() {
        // FinnhubClient doesn't need cleanup
    }
    /**
     * Récupère les news via Finnhub et les convertit en NewsItems
     */
    async fetchNews() {
        try {
            const news = await this.finnhubClient.fetchMarketNews();
            return news.map((n) => ({
                title: n.headline,
                source: 'Finnhub',
                url: n.url,
                timestamp: new Date(n.datetime * 1000), // Finnhub utilise des timestamps Unix
                sentiment: 'neutral',
            }));
        }
        catch (error) {
            console.error('Error fetching Finnhub news:', error);
            return [];
        }
    }
}
//# sourceMappingURL=FinnhubNewsScraper.js.map