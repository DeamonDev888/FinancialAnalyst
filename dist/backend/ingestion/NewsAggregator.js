import { TradingEconomicsScraper } from './TradingEconomicsScraper';
import { ZeroHedgeNewsScraper } from './scrapers/ZeroHedgeNewsScraper';
import { CNBCNewsScraper } from './scrapers/CNBCNewsScraper';
import { FinancialJuiceNewsScraper } from './scrapers/FinancialJuiceNewsScraper';
import { XFeedsNewsScraper } from './scrapers/XFeedsNewsScraper';
import { FredNewsScraper } from './scrapers/FredNewsScraper';
import { FinnhubNewsScraper } from './scrapers/FinnhubNewsScraper';
import { CboeNewsScraper } from './scrapers/CboeNewsScraper';
import { BlsNewsScraper } from './scrapers/BlsNewsScraper';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
export class NewsAggregator {
    teScraper;
    zeroHedgeScraper;
    cnbcScraper;
    financialJuiceScraper;
    xFeedsScraper;
    fredScraper;
    finnhubScraper;
    cboeScraper;
    blsScraper;
    pool;
    constructor() {
        this.teScraper = new TradingEconomicsScraper();
        this.zeroHedgeScraper = new ZeroHedgeNewsScraper();
        this.cnbcScraper = new CNBCNewsScraper();
        this.financialJuiceScraper = new FinancialJuiceNewsScraper();
        this.xFeedsScraper = new XFeedsNewsScraper();
        this.fredScraper = new FredNewsScraper();
        this.finnhubScraper = new FinnhubNewsScraper();
        this.cboeScraper = new CboeNewsScraper();
        this.blsScraper = new BlsNewsScraper();
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
    }
    /**
     * Récupère les news via RSS pour ZeroHedge
     */
    async fetchZeroHedgeHeadlines() {
        await this.zeroHedgeScraper.init();
        try {
            return await this.zeroHedgeScraper.fetchNews();
        }
        finally {
            await this.zeroHedgeScraper.close();
        }
    }
    /**
     * Récupère les news de CNBC (US Markets) via RSS
     */
    async fetchCNBCMarketNews() {
        await this.cnbcScraper.init();
        try {
            return await this.cnbcScraper.fetchNews();
        }
        finally {
            await this.cnbcScraper.close();
        }
    }
    /**
     * Récupère les news de FinancialJuice via RSS
     */
    async fetchFinancialJuice() {
        await this.financialJuiceScraper.init();
        try {
            return await this.financialJuiceScraper.fetchNews();
        }
        finally {
            await this.financialJuiceScraper.close();
        }
    }
    /**
     * Récupère les news des feeds X via OPML
     */
    async fetchXFeedsFromOpml() {
        await this.xFeedsScraper.init();
        try {
            return await this.xFeedsScraper.fetchNews();
        }
        finally {
            await this.xFeedsScraper.close();
        }
    }
    /**
     * Récupère les news via Finnhub
     */
    async fetchFinnhubNews() {
        return await this.finnhubScraper.fetchNews();
    }
    /**
     * Récupère les indicateurs économiques via FRED
     */
    async fetchFredEconomicData() {
        return await this.fredScraper.fetchNews();
    }
    /**
     * Récupère le calendrier économique via TradingEconomics
     */
    async fetchTradingEconomicsCalendar() {
        try {
            const events = await this.teScraper.scrapeUSCalendar();
            // Sauvegarder les événements bruts dans leur propre table
            await this.teScraper.saveEvents(events);
            // Convertir en NewsItems pour le flux général
            return events.map(event => ({
                title: `[ECO CALENDAR] ${event.event} (${event.country}): Actual ${event.actual} vs Forecast ${event.forecast}`,
                source: 'TradingEconomics',
                url: 'https://tradingeconomics.com/united-states/calendar',
                timestamp: event.date,
                sentiment: 'neutral', // À analyser
                content: `Importance: ${event.importance}/3. Previous: ${event.previous}`,
            }));
        }
        catch (error) {
            console.error('Error fetching TradingEconomics calendar:', error);
            return [];
        }
    }
    /**
     * Récupère et sauvegarde les données de marché (ES Futures prioritaire)
     * TODO: Refactoriser pour utiliser FinnhubClient directement
     */
    async fetchAndSaveMarketData() {
        // Temporarily disabled during scraper unification
        console.log('⚠️ Market data fetching temporarily disabled during scraper unification');
        return;
    }
    /**
     * Sauvegarde les news dans la base de données
     */
    async saveNewsToDatabase(news) {
        if (news.length === 0)
            return;
        const client = await this.pool.connect();
        try {
            // Créer la table si elle n'existe pas
            await client.query(`
        CREATE TABLE IF NOT EXISTS news_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(1000) NOT NULL,
            source VARCHAR(100) NOT NULL,
            url TEXT,
            content TEXT,
            sentiment VARCHAR(20),
            published_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(title, source, published_at)
        );
      `);
            let savedCount = 0;
            for (const item of news) {
                try {
                    await client.query(`
                INSERT INTO news_items (title, source, url, content, sentiment, published_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (title, source, published_at) 
                DO UPDATE SET 
                  content = EXCLUDED.content,
                  url = EXCLUDED.url
                WHERE 
                  news_items.content IS NULL 
                  OR length(news_items.content) < 50
                  OR length(EXCLUDED.content) > length(COALESCE(news_items.content, ''));
            `, [
                        item.title,
                        item.source,
                        item.url,
                        item.content || null, // Ensure explicit null if undefined
                        item.sentiment,
                        item.timestamp,
                    ]);
                    savedCount++;
                }
                catch (e) {
                    console.error(`Failed to save news from ${item.source}:`, e);
                    console.error('Item causing error:', JSON.stringify({
                        title: item.title,
                        source: item.source,
                        timestamp: item.timestamp,
                        contentLength: item.content?.length,
                    }, null, 2));
                }
            }
            console.log(`💾 Saved ${savedCount} news items to database from ${news.length} fetched`);
        }
        catch (error) {
            console.error('❌ Database error saving news:', error);
        }
        finally {
            client.release();
        }
    }
    async fetchAndSaveAllNews() {
        try {
            console.log('Starting news aggregation...');
            // Initialize the scrapers (launches browsers where needed)
            await this.zeroHedgeScraper.init();
            await this.cnbcScraper.init();
            await this.financialJuiceScraper.init();
            await this.xFeedsScraper.init();
            await this.cboeScraper.init();
            await this.blsScraper.init();
            let totalNews = 0;
            console.log('Fetching ZeroHedge...');
            const zhNews = await this.zeroHedgeScraper.fetchNews();
            await this.saveNewsToDatabase(zhNews);
            totalNews += zhNews.length;
            console.log('Fetching CNBC...');
            const cnbcNews = await this.cnbcScraper.fetchNews();
            await this.saveNewsToDatabase(cnbcNews);
            totalNews += cnbcNews.length;
            console.log('Fetching FinancialJuice...');
            const fjNews = await this.financialJuiceScraper.fetchNews();
            await this.saveNewsToDatabase(fjNews);
            totalNews += fjNews.length;
            console.log('Fetching X Feeds from OPML...');
            const xNews = await this.xFeedsScraper.fetchNews();
            await this.saveNewsToDatabase(xNews);
            totalNews += xNews.length;
            console.log('Fetching Finnhub...');
            const finnhubNews = await this.finnhubScraper.fetchNews();
            await this.saveNewsToDatabase(finnhubNews);
            totalNews += finnhubNews.length;
            console.log('Fetching FRED Data...');
            const fredData = await this.fredScraper.fetchNews();
            await this.saveNewsToDatabase(fredData);
            totalNews += fredData.length;
            console.log('Fetching CBOE Data...');
            const cboeData = await this.cboeScraper.fetchNews();
            await this.saveNewsToDatabase(cboeData);
            totalNews += cboeData.length;
            console.log('Fetching BLS Data...');
            const blsData = await this.blsScraper.fetchNews();
            await this.saveNewsToDatabase(blsData);
            totalNews += blsData.length;
            console.log('Fetching Trading Economics...');
            const teData = await this.fetchTradingEconomicsCalendar();
            await this.saveNewsToDatabase(teData);
            totalNews += teData.length;
            console.log('Fetching Market Data...');
            await this.fetchAndSaveMarketData();
            console.log('News aggregation complete.');
            return totalNews;
        }
        catch (error) {
            console.error('Error in fetchAndSaveAllNews:', error);
            return 0;
        }
        finally {
            // Close the scrapers (closes browsers where applicable)
            await this.zeroHedgeScraper.close();
            await this.cnbcScraper.close();
            await this.financialJuiceScraper.close();
            await this.xFeedsScraper.close();
            await this.cboeScraper.close();
            await this.blsScraper.close();
        }
    }
    async close() {
        await this.zeroHedgeScraper.close();
        await this.cnbcScraper.close();
        await this.financialJuiceScraper.close();
        await this.xFeedsScraper.close();
        await this.cboeScraper.close();
        await this.blsScraper.close();
        await this.pool.end();
    }
}
//# sourceMappingURL=NewsAggregator.js.map