import { BlsScraper } from '../BlsScraper';
export class BlsNewsScraper {
    blsScraper;
    constructor() {
        this.blsScraper = new BlsScraper();
    }
    async init() {
        await this.blsScraper.init();
    }
    async close() {
        await this.blsScraper.close();
    }
    /**
     * Récupère les dernières données BLS et les convertit en NewsItems
     */
    async fetchNews() {
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
        }
        catch (error) {
            console.error('Error fetching BLS data:', error);
            return [];
        }
    }
}
//# sourceMappingURL=BlsNewsScraper.js.map