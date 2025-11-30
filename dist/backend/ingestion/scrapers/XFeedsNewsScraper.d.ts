import { NewsItem } from '../NewsAggregator';
export declare class XFeedsNewsScraper {
    private newsScraper;
    constructor();
    init(): Promise<void>;
    close(): Promise<void>;
    fetchNews(): Promise<NewsItem[]>;
}
//# sourceMappingURL=XFeedsNewsScraper.d.ts.map