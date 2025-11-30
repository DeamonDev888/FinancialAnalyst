import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsScraper } from '../NewsScraper';
export class CNBCNewsScraper {
    newsScraper;
    constructor() {
        this.newsScraper = new NewsScraper();
    }
    async init() {
        await this.newsScraper.init();
    }
    async close() {
        await this.newsScraper.close();
    }
    /**
     * Scrapes the full content of an article from its URL.
     */
    async scrapeArticleContent(url) {
        return this.newsScraper.scrapeArticle(url);
    }
    /**
     * Récupère les news de CNBC (US Markets) via RSS
     * Plus pertinent pour le S&P 500 (ES Futures) que ZoneBourse.
     */
    async fetchNews() {
        try {
            // Flux RSS CNBC Finance
            const { data } = await axios.get('https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaQuoteAgent/1.0)' },
                timeout: 5000,
            });
            const $ = cheerio.load(data, { xmlMode: true });
            // Get top 5 items
            const items = $('item').toArray().slice(0, 5);
            const newsPromises = items.map(async (el) => {
                const title = $(el).find('title').text().trim();
                const link = $(el).find('link').text().trim();
                const pubDate = $(el).find('pubDate').text();
                const description = $(el).find('description').text().trim();
                if (title && link) {
                    let content = await this.scrapeArticleContent(link);
                    if (!content || content.length < 50) {
                        content = description;
                    }
                    return {
                        title,
                        source: 'CNBC',
                        url: link,
                        timestamp: new Date(pubDate),
                        content: content || title,
                    };
                }
                return null;
            });
            const results = await Promise.all(newsPromises);
            return results.filter((n) => n !== null);
        }
        catch (error) {
            console.error('Error fetching CNBC RSS:', error instanceof Error ? error.message : error);
            return [];
        }
    }
}
//# sourceMappingURL=CNBCNewsScraper.js.map