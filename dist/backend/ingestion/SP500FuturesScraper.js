"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SP500FuturesScraper = void 0;
const playwright_1 = require("playwright");
class SP500FuturesScraper {
    browser = null;
    async init() {
        if (!this.browser) {
            this.browser = await playwright_1.chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                ],
            });
        }
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    async createStealthPage() {
        if (!this.browser)
            throw new Error('Browser not initialized');
        const context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            extraHTTPHeaders: {
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Upgrade-Insecure-Requests': '1',
                Referer: 'https://www.google.com/',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            },
        });
        const page = await context.newPage();
        // Simuler comportement humain
        await page.addInitScript(() => {
            // @ts-ignore
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            // @ts-ignore
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            // @ts-ignore
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            // @ts-ignore
            window.chrome = { runtime: {} };
            // @ts-ignore
            Object.defineProperty(navigator, 'permissions', {
                get: () => ({
                    query: () => Promise.resolve({ state: 'granted' }),
                }),
            });
        });
        return page;
    }
    /**
     * Scrape les contrats futures E-mini S&P 500 depuis Investing.com
     * Source fiable pour les vrais prix des futures
     */
    async scrapeInvestingFutures() {
        const page = await this.createStealthPage();
        try {
            console.log('[SP500Futures] Navigation vers Investing.com E-mini S&P 500 Futures...');
            await page.goto('https://www.investing.com/indices/us-spx-500-futures', {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
            });
            // Délai pour charger les données
            await page.waitForTimeout(2000);
            // Accepter les cookies si nécessaire
            try {
                const cookieButton = page.locator('#onetrust-accept-btn-handler').first();
                if (await cookieButton.isVisible({ timeout: 2000 })) {
                    await cookieButton.click();
                    await page.waitForTimeout(1000);
                }
            }
            catch {
                // Pas de popup cookies
            }
            console.log('[SP500Futures] Extraction des données des futures...');
            // Extraire le prix actuel
            const price = await this.extractText(page, '[data-test="instrument-price-last"]');
            const changeAbs = await this.extractText(page, '[data-test="instrument-price-change"]');
            const changePct = await this.extractText(page, '[data-test="instrument-price-change-percent"]');
            const prevClose = await this.extractText(page, '[data-test="prev-close-value"]');
            const open = await this.extractText(page, '[data-test="open-value"]');
            const dayRange = await this.extractText(page, '[data-test="days-range-value"]');
            if (!price) {
                console.log('[SP500Futures] Prix non trouvé, tentative avec meta tags...');
                // Alternative: chercher dans les meta tags
                const metaContent = await page.getAttribute('meta[name="global-translation-variables"]', 'content', { timeout: 5000 });
                if (metaContent) {
                    console.log('[SP500Futures] Meta tag trouvé, parsing en cours...');
                    try {
                        const cleanContent = metaContent.replace(/&quot;/g, '"');
                        let data = JSON.parse(cleanContent);
                        // Double parsing si encodé doublement
                        if (typeof data === 'string') {
                            data = JSON.parse(data);
                        }
                        if (data && data.LAST_PRICE) {
                            const lastPrice = this.parseNumber(data.LAST_PRICE);
                            console.log(`[SP500Futures] ✅ Prix trouvé via meta: ${lastPrice?.toFixed(2)} (Investing.com - Futures Direct)`);
                            const [low, high] = this.parseRange(data.DAY_RANGE || '');
                            return {
                                current: this.parseNumber(data.LAST_PRICE) || 0,
                                change: this.parseNumber(data.daily_change),
                                percent_change: this.parseNumber(data.daily_change_percent?.replace('%', '')),
                                high: high || this.parseNumber(data.DAY_RANGE_HIGH),
                                low: low || this.parseNumber(data.DAY_RANGE_LOW),
                                open: this.parseNumber(data.OPEN_PRICE),
                                previous_close: this.parseNumber(data.PREV_CLOSE?.replace(/,/g, '')),
                                symbol: 'ES',
                                source: 'Investing.com',
                            };
                        }
                    }
                    catch (e) {
                        console.log('[SP500Futures] Erreur parsing meta:', e instanceof Error ? e.message : e);
                    }
                }
            }
            const [low, high] = this.parseRange(dayRange);
            if (price) {
                const parsedPrice = this.parseNumber(price);
                console.log(`[SP500Futures] ✅ Données futures extraites: ${parsedPrice?.toFixed(2)} (Investing.com - Scraping Direct)`);
                return {
                    current: this.parseNumber(price) || 0,
                    change: this.parseNumber(changeAbs),
                    percent_change: this.parseNumber(changePct?.replace(/[()%]/g, '')),
                    high: high,
                    low: low,
                    open: this.parseNumber(open),
                    previous_close: this.parseNumber(prevClose),
                    symbol: 'ES',
                    source: 'Investing.com',
                };
            }
            console.log('[SP500Futures] ❌ Données futures non trouvées');
            return null;
        }
        catch (error) {
            console.error('[SP500Futures] Erreur scraping:', error instanceof Error ? error.message : error);
            return null;
        }
        finally {
            await page.close();
        }
    }
    /**
     * Scrape les futures depuis Yahoo Finance (alternative)
     */
    async scrapeYahooFutures() {
        const page = await this.createStealthPage();
        try {
            console.log('[SP500Futures] Navigation vers Yahoo Finance ES=F...');
            await page.goto('https://finance.yahoo.com/quote/ES=F', {
                waitUntil: 'domcontentloaded',
                timeout: 25000,
            });
            await page.waitForTimeout(1500);
            // Gérer la page de consentement
            if (page.url().includes('consent.yahoo.com')) {
                try {
                    const agreeButton = page.locator('button[name="agree"]').first();
                    if (await agreeButton.isVisible({ timeout: 2000 })) {
                        await agreeButton.click();
                        await page.waitForTimeout(2000);
                        // Recharger si nécessaire
                        if (page.url().includes('consent.yahoo.com')) {
                            await page.goto('https://finance.yahoo.com/quote/ES=F', {
                                waitUntil: 'domcontentloaded',
                                timeout: 15000,
                            });
                        }
                    }
                }
                catch {
                    // Continuer même si le consentement échoue
                }
            }
            console.log('[SP500Futures] Extraction Yahoo Finance...');
            const price = await this.extractText(page, '[data-field="regularMarketPrice"] fin-streamer', 5000);
            const changeAbs = await this.extractText(page, '[data-field="regularMarketChangePercent"] fin-streamer span', 3000);
            if (price) {
                console.log(`[SP500Futures] ✅ Yahoo Finance: ${price}`);
                return {
                    current: this.parseNumber(price) || 0,
                    change: this.parseNumber(changeAbs),
                    percent_change: this.parseNumber(changeAbs?.replace(/[()%]/g, '')),
                    high: null,
                    low: null,
                    open: null,
                    previous_close: null,
                    symbol: 'ES',
                    source: 'Yahoo Finance',
                };
            }
            return null;
        }
        catch (error) {
            console.error('[SP500Futures] Erreur Yahoo Finance:', error instanceof Error ? error.message : error);
            return null;
        }
        finally {
            await page.close();
        }
    }
    /**
     * Scrape ZeroHedge pour les niveaux techniques ES Futures
     * ZeroHedge publie souvent des analyses techniques avec des niveaux précis
     */
    async scrapeZeroHedgeLevels() {
        const page = await this.createStealthPage();
        try {
            console.log('[SP500Futures] 🔍 Recherche des niveaux techniques sur ZeroHedge...');
            // Visiter ZeroHedge
            await page.goto('https://www.zerohedge.com/', {
                waitUntil: 'domcontentloaded',
                timeout: 25000,
            });
            await page.waitForTimeout(2000);
            const result = {
                support_levels: [],
                resistance_levels: [],
                key_messages: [],
                sentiment: 'neutral',
                technical_levels: [],
            };
            // Chercher les articles récents avec des niveaux S&P 500/ES
            console.log('[SP500Futures] Recherche des articles techniques...');
            const articles = await page.locator('article, .post-item, .entry-item').all();
            for (const article of articles.slice(0, 15)) {
                // Limiter aux 15 premiers articles
                try {
                    const titleElement = await article.locator('h1, h2, .title, a').first();
                    const title = await titleElement.textContent();
                    const linkElement = await article.locator('a').first();
                    const link = await linkElement.getAttribute('href');
                    if (title && link && this.containsTechnicalLevels(title)) {
                        console.log(`[SP500Futures] 📊 Article technique trouvé: ${title.substring(0, 60)}...`);
                        // Extraire les niveaux du titre
                        const levels = this.extractLevelsFromText(title);
                        result.support_levels.push(...levels.supports);
                        result.resistance_levels.push(...levels.resistances);
                        result.technical_levels.push(title);
                        result.key_messages.push(title);
                        // Essayer de visiter l'article pour plus de détails
                        try {
                            const articlePage = await this.createStealthPage();
                            await articlePage.goto(link.startsWith('http') ? link : `https://www.zerohedge.com${link}`, {
                                waitUntil: 'domcontentloaded',
                                timeout: 10000,
                            });
                            await articlePage.waitForTimeout(1500);
                            // Extraire le contenu de l'article
                            const content = await articlePage
                                .locator('.entry-content, .post-content, article p')
                                .allTextContents();
                            const fullContent = content.join(' ');
                            // Extraire les niveaux du contenu
                            const contentLevels = this.extractLevelsFromText(fullContent);
                            result.support_levels.push(...contentLevels.supports);
                            result.resistance_levels.push(...contentLevels.resistances);
                            // Analyser le sentiment
                            result.sentiment = this.analyzeSentiment(title + ' ' + fullContent);
                            await articlePage.close();
                        }
                        catch (e) {
                            // Continuer même si l'article ne se charge pas
                            console.log("[SP500Futures] Impossible de charger l'article détaillé");
                        }
                        break; // Limiter à 1-2 articles pour éviter le sur-scraping
                    }
                }
                catch {
                    continue;
                }
            }
            // Dédupliquer et trier les niveaux
            const uniqueSupports = Array.from(new Set(result.support_levels));
            const uniqueResistances = Array.from(new Set(result.resistance_levels));
            result.support_levels = uniqueSupports.sort((a, b) => b - a);
            result.resistance_levels = uniqueResistances.sort((a, b) => a - b);
            // Garder seulement les niveaux pertinents (autour du prix actuel)
            result.support_levels = result.support_levels.filter(level => level >= 5000 && level <= 8000);
            result.resistance_levels = result.resistance_levels.filter(level => level >= 5000 && level <= 8000);
            if (result.support_levels.length > 0 || result.resistance_levels.length > 0) {
                console.log(`[SP500Futures] ✅ Niveaux ZeroHedge extraits:`);
                console.log(`   Supports: [${result.support_levels.slice(0, 5).join(', ')}${result.support_levels.length > 5 ? '...' : ''}]`);
                console.log(`   Résistances: [${result.resistance_levels.slice(0, 5).join(', ')}${result.resistance_levels.length > 5 ? '...' : ''}]`);
                console.log(`   Sentiment: ${result.sentiment}`);
                return result;
            }
            console.log('[SP500Futures] ℹ️ Aucun niveau technique trouvé sur ZeroHedge');
            return null;
        }
        catch (error) {
            console.error('[SP500Futures] Erreur scraping ZeroHedge:', error instanceof Error ? error.message : error);
            return null;
        }
        finally {
            await page.close();
        }
    }
    /**
     * Vérifie si un texte contient des niveaux techniques S&P 500/ES
     */
    containsTechnicalLevels(text) {
        const keywords = [
            'S&P 500',
            'SPX',
            'E-mini',
            'ES',
            'ES1',
            'futures',
            'support',
            'resistance',
            'level',
            'target',
            'pivot',
            'breakout',
            '5000',
            '5100',
            '5200',
            '5300',
            '5400',
            '5500',
            '5600',
            '5700',
            '5800',
            '5900',
            '6000',
            '6100',
            '6200',
            '6300',
            '6400',
            '6500',
            '6600',
            '6700',
            '6800',
            '6900',
            '7000',
        ];
        const upperText = text.toUpperCase();
        return keywords.some(keyword => upperText.includes(keyword.toUpperCase()));
    }
    /**
     * Extrait les niveaux numériques d'un texte
     */
    extractLevelsFromText(text) {
        const levels = text.match(/\b[5-7]\d{3}\b/g); // Niveaux entre 5000-7999
        if (!levels) {
            return { supports: [], resistances: [] };
        }
        const numbers = levels.map(l => parseInt(l));
        const supports = [];
        const resistances = [];
        // Répartition simple basée sur le contexte (peut être amélioré)
        const supportKeywords = ['support', 'buy', 'long', 'bottom', 'floor'];
        const resistanceKeywords = ['resistance', 'sell', 'short', 'top', 'ceiling'];
        numbers.forEach(level => {
            const upperText = text.toUpperCase();
            const beforeText = text.substring(0, text.indexOf(level.toString())).toUpperCase();
            const afterText = text.substring(text.indexOf(level.toString()) + 4).toUpperCase();
            // Déterminer si c'est un support ou résistance
            if (resistanceKeywords.some(keyword => beforeText.includes(keyword) || afterText.includes(keyword))) {
                resistances.push(level);
            }
            else if (supportKeywords.some(keyword => beforeText.includes(keyword) || afterText.includes(keyword))) {
                supports.push(level);
            }
            else {
                // Par défaut, ajouter aux deux ou selon la position relative
                supports.push(level);
                resistances.push(level);
            }
        });
        return { supports, resistances };
    }
    /**
     * Analyse le sentiment d'un texte
     */
    analyzeSentiment(text) {
        const bullishWords = [
            'buy',
            'rally',
            'bull',
            'up',
            'rise',
            'gain',
            'bullish',
            'momentum',
            'breakout',
            'higher',
        ];
        const bearishWords = [
            'sell',
            'crash',
            'bear',
            'down',
            'fall',
            'loss',
            'bearish',
            'correction',
            'drop',
            'lower',
        ];
        const upperText = text.toUpperCase();
        const bullishCount = bullishWords.filter(word => upperText.includes(word.toUpperCase())).length;
        const bearishCount = bearishWords.filter(word => upperText.includes(word.toUpperCase())).length;
        if (bullishCount > bearishCount * 1.5)
            return 'bullish';
        if (bearishCount > bullishCount * 1.5)
            return 'bearish';
        return 'neutral';
    }
    /**
     * Point d'entrée principal pour récupérer les futures S&P500 avec niveaux ZeroHedge
     */
    async fetchSP500FuturesWithZeroHedge() {
        await this.init();
        console.log('[SP500Futures] 🎯 Démarrage récupération complète S&P500 (prix + niveaux)...');
        try {
            // Priorité 1: Investing.com (plus fiable pour les futures)
            console.log('[SP500Futures] 1️⃣ Récupération prix Investing.com...');
            const futuresData = await this.scrapeInvestingFutures();
            if (futuresData && futuresData.current > 1000) {
                console.log(`[SP500Futures] ✅ Prix Investing.com: ${futuresData.current.toFixed(2)}`);
                // Ajouter les niveaux ZeroHedge
                console.log('[SP500Futures] 2️⃣ Ajout des niveaux techniques ZeroHedge...');
                const zeroHedgeLevels = await this.scrapeZeroHedgeLevels();
                if (zeroHedgeLevels) {
                    futuresData.support_levels = zeroHedgeLevels.support_levels;
                    futuresData.resistance_levels = zeroHedgeLevels.resistance_levels;
                    futuresData.key_levels = [
                        ...zeroHedgeLevels.technical_levels,
                        ...zeroHedgeLevels.key_messages,
                    ];
                    futuresData.zero_hedge_analysis = {
                        technical_levels: zeroHedgeLevels.technical_levels,
                        sentiment: zeroHedgeLevels.sentiment,
                        key_messages: zeroHedgeLevels.key_messages,
                    };
                    console.log('[SP500Futures] ✅ Données complètes avec niveaux ZeroHedge');
                    return futuresData;
                }
                console.log('[SP500Futures] ⚠️ Données de prix uniquement (pas de niveaux ZeroHedge)');
                return futuresData;
            }
            // Priorité 2: Yahoo Finance (alternative)
            console.log('[SP500Futures] 2️⃣ Tentative Yahoo Finance...');
            const yahooData = await this.scrapeYahooFutures();
            if (yahooData && yahooData.current > 1000) {
                console.log(`[SP500Futures] ✅ Prix Yahoo Finance: ${yahooData.current.toFixed(2)}`);
                return yahooData;
            }
            console.log('[SP500Futures] ❌ Toutes les sources de futures ont échoué');
            return null;
        }
        finally {
            await this.close();
        }
    }
    /**
     * Point d'entrée principal pour récupérer les futures S&P500 (version originale)
     */
    async fetchSP500Futures() {
        await this.init();
        console.log('[SP500Futures] 🎯 Démarrage récupération futures S&P500...');
        try {
            // Priorité 1: Investing.com (plus fiable pour les futures)
            console.log('[SP500Futures] 1️⃣ Tentative Investing.com...');
            const investingData = await this.scrapeInvestingFutures();
            if (investingData && investingData.current > 1000) {
                console.log(`[SP500Futures] ✅ Investing.com réussi: ${investingData.current.toFixed(2)}`);
                return investingData;
            }
            // Priorité 2: Yahoo Finance (alternative)
            console.log('[SP500Futures] 2️⃣ Tentative Yahoo Finance...');
            const yahooData = await this.scrapeYahooFutures();
            if (yahooData && yahooData.current > 1000) {
                console.log(`[SP500Futures] ✅ Yahoo Finance réussi: ${yahooData.current.toFixed(2)}`);
                return yahooData;
            }
            console.log('[SP500Futures] ❌ Toutes les sources de futures ont échoué');
            return null;
        }
        finally {
            await this.close();
        }
    }
    async extractText(page, selector, timeout = 5000) {
        try {
            await page.waitForSelector(selector, { timeout });
            return (await page.locator(selector).first().textContent()) || '';
        }
        catch {
            return '';
        }
    }
    parseNumber(str) {
        if (!str)
            return null;
        let cleaned = str.trim();
        // Gérer le format européen (23,43) vs américain (1,234.56)
        if (cleaned.includes(',') && !cleaned.includes('.')) {
            cleaned = cleaned.replace(',', '.');
        }
        else if (cleaned.includes(',') && cleaned.includes('.')) {
            cleaned = cleaned.replace(/,/g, '');
        }
        // Nettoyer les caractères non numériques
        cleaned = cleaned.replace(/[^\d.-]/g, '');
        const val = parseFloat(cleaned);
        return isNaN(val) ? null : val;
    }
    parseRange(str) {
        if (!str)
            return [null, null];
        const parts = str.split('-').map(s => this.parseNumber(s.trim()));
        if (parts.length === 2)
            return [parts[0], parts[1]];
        return [null, null];
    }
}
exports.SP500FuturesScraper = SP500FuturesScraper;
