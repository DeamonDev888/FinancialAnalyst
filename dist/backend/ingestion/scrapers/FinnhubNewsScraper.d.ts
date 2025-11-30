import { NewsItem } from '../NewsAggregator';
export declare class FinnhubNewsScraper {
    private finnhubClient;
    constructor();
    init(): Promise<void>;
    close(): Promise<void>;
    /**
     * Récupère les news via Finnhub et les convertit en NewsItems
     */
    fetchNews(): Promise<NewsItem[]>;
}
//# sourceMappingURL=FinnhubNewsScraper.d.ts.map