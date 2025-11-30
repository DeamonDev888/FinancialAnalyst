import { NewsItem } from '../NewsAggregator';
export declare class ZeroHedgeNewsScraper {
    private newsScraper;
    constructor();
    init(): Promise<void>;
    close(): Promise<void>;
    /**
     * Scrapes the full content of an article from its URL.
     */
    private scrapeArticleContent;
    /**
     * Récupère les news via RSS pour ZeroHedge (Beaucoup plus fiable que le scraping HTML)
     */
    fetchNews(): Promise<NewsItem[]>;
}
//# sourceMappingURL=ZeroHedgeNewsScraper.d.ts.map