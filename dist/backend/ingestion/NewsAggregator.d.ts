export interface NewsItem {
    title: string;
    source: string;
    url: string;
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    timestamp: Date;
    content?: string;
}
export declare class NewsAggregator {
    private teScraper;
    private zeroHedgeScraper;
    private cnbcScraper;
    private financialJuiceScraper;
    private xFeedsScraper;
    private fredScraper;
    private finnhubScraper;
    private cboeScraper;
    private blsScraper;
    private pool;
    constructor();
    /**
     * Récupère les news via RSS pour ZeroHedge
     */
    fetchZeroHedgeHeadlines(): Promise<NewsItem[]>;
    /**
     * Récupère les news de CNBC (US Markets) via RSS
     */
    fetchCNBCMarketNews(): Promise<NewsItem[]>;
    /**
     * Récupère les news de FinancialJuice via RSS
     */
    fetchFinancialJuice(): Promise<NewsItem[]>;
    /**
     * Récupère les news des feeds X via OPML
     */
    fetchXFeedsFromOpml(): Promise<NewsItem[]>;
    /**
     * Récupère les news via Finnhub
     */
    fetchFinnhubNews(): Promise<NewsItem[]>;
    /**
     * Récupère les indicateurs économiques via FRED
     */
    fetchFredEconomicData(): Promise<NewsItem[]>;
    /**
     * Récupère le calendrier économique via TradingEconomics
     */
    fetchTradingEconomicsCalendar(): Promise<NewsItem[]>;
    /**
     * Récupère et sauvegarde les données de marché (ES Futures prioritaire)
     * TODO: Refactoriser pour utiliser FinnhubClient directement
     */
    fetchAndSaveMarketData(): Promise<void>;
    /**
     * Sauvegarde les news dans la base de données
     */
    saveNewsToDatabase(news: NewsItem[]): Promise<void>;
    fetchAndSaveAllNews(): Promise<number>;
    /**
     * Vérifie la connectivité de la base de données
     */
    private verifyDatabaseConnection;
    /**
     * Vérifie que toutes les sources sont accessibles
     */
    private verifySources;
    /**
     * Sauvegarde les news avec validation supplémentaire
     */
    private saveNewsToDatabaseWithValidation;
    close(): Promise<void>;
}
//# sourceMappingURL=NewsAggregator.d.ts.map