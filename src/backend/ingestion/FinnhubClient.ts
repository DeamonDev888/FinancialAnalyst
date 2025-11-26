import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

export interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface StockData {
  current: number;
  change: number;
  percent_change: number;
  high: number;
  low: number;
  open: number;
  previous_close: number;
  timestamp: number;
  symbol: string;
}

export class FinnhubClient {
  private apiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';

  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ FINNHUB_API_KEY is missing. Finnhub data will not be fetched.');
    }
  }

  /**
   * Récupère les news générales du marché
   */
  async fetchMarketNews(): Promise<FinnhubNews[]> {
    if (!this.apiKey) return [];

    try {
      const response = await axios.get(`${this.baseUrl}/news`, {
        params: {
          category: 'general',
          token: this.apiKey,
        },
        timeout: 5000,
      });

      return response.data.slice(0, 10); // Top 10 news
    } catch (error) {
      console.error(
        '❌ Error fetching Finnhub news:',
        error instanceof Error ? error.message : error
      );
      return [];
    }
  }

  /**
   * Récupère le sentiment des news (si disponible dans le plan gratuit)
   * Sinon, on se contente des news brutes
   */
  async fetchNewsSentiment(): Promise<any> {
    // Note: L'endpoint sentiment est souvent Premium.
    // On se concentre sur les news brutes pour l'instant.
    return null;
  }

  /**
   * Récupère les données de marché d'un indice ou action en temps réel
   * Utilise l'endpoint /quote pour les données actuelles
   */
  async fetchQuote(symbol: string): Promise<StockData | null> {
    if (!this.apiKey) return null;

    try {
      console.log(`[Finnhub] Récupération des données pour ${symbol}...`);
      const response = await axios.get(`${this.baseUrl}/quote`, {
        params: {
          symbol: symbol,
          token: this.apiKey,
        },
        timeout: 5000,
      });

      const data = response.data;
      if (data.c === null || data.c === undefined) {
        console.warn(`[Finnhub] Pas de données valides pour ${symbol}`);
        return null;
      }

      // Récupérer aussi les métadonnées de base
      await axios
        .get(`${this.baseUrl}/stock/profile2`, {
          params: {
            symbol: symbol,
            token: this.apiKey,
          },
          timeout: 3000,
        })
        .catch(() => ({ data: { name: symbol } }));

      const stockData: StockData = {
        current: data.c, // Current price
        change: data.d, // Change
        percent_change: data.dp, // Percent change
        high: data.h, // High price of the day
        low: data.l, // Low price of the day
        open: data.o, // Open price of the day
        previous_close: data.pc, // Previous close price
        timestamp: data.t || Math.floor(Date.now() / 1000), // Timestamp
        symbol: symbol,
      };

      console.log(
        `[Finnhub] ✅ Données récupérées pour ${symbol}: ${stockData.current} (${stockData.change > 0 ? '+' : ''}${stockData.percent_change}%)`
      );
      return stockData;
    } catch (error) {
      console.error(
        `❌ [Finnhub] Erreur lors de la récupération des données pour ${symbol}:`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  /**
   * Récupère spécifiquement les données du S&P 500
   * Utilise l'ETF SPY qui suit l'indice S&P 500 (plus fiable que .SPX)
   */
  async fetchSP500Data(): Promise<StockData | null> {
    // Tenter plusieurs symboles pour ES Futures
    const esSymbols = ['ES1!', 'ES=F', 'ES', '/ES', 'MES1!']; // Différents symboles ES

    for (const symbol of esSymbols) {
      try {
        const esData = await this.fetchQuote(symbol);
        if (esData && esData.current > 5000) {
          console.log(
            `[Finnhub] ✅ Données ES Futures récupérées (${symbol}): ${esData.current.toFixed(2)}`
          );
          return esData;
        }
      } catch {
        console.log(`[Finnhub] Symbole ${symbol} non disponible, essai suivant...`);
      }
    }

    // Si aucun symbole ES ne fonctionne, utiliser SPY et convertir en ES
    console.warn(`[Finnhub] Aucun symbole ES disponible, utilisation de SPY avec conversion`);
    const spyData = await this.fetchQuote('SPY');
    if (spyData) {
      // Conversion SPY -> ES Futures (approximation: ES ≈ SPY × 9-10)
      const multiplier = 9.5; // Ratio moyen ES/SPY
      return {
        ...spyData,
        current: Math.round(spyData.current * multiplier * 100) / 100,
        high: Math.round(spyData.high * multiplier * 100) / 100,
        low: Math.round(spyData.low * multiplier * 100) / 100,
        open: Math.round(spyData.open * multiplier * 100) / 100,
        previous_close: Math.round(spyData.previous_close * multiplier * 100) / 100,
        change: Math.round(spyData.change * multiplier * 100) / 100,
        symbol: 'ES_CONVERTED',
      };
    }

    return null;
  }

  /**
   * Récupère les données de plusieurs indices populaires en parallèle
   * Utilise les ETFs des indices car plus fiables que les indices bruts
   */
  async fetchMultipleIndices(symbols: string[] = ['SPY', 'QQQ', 'DIA']): Promise<StockData[]> {
    if (!this.apiKey) return [];

    console.log(`[Finnhub] Récupération parallèle des indices: ${symbols.join(', ')}`);

    const promises = symbols.map(symbol => this.fetchQuote(symbol));
    const results = await Promise.all(promises);

    const validResults = results.filter((item): item is StockData => item !== null);
    console.log(`[Finnhub] ${validResults.length}/${symbols.length} indices récupérés avec succès`);

    return validResults;
  }

  /**
   * Récupère les données des principaux indices boursiers avec des noms explicites
   */
  async fetchMajorIndices(): Promise<{ name: string; data: StockData }[]> {
    const indicesMapping = [
      { name: 'S&P 500', symbol: 'SPY' },
      { name: 'NASDAQ', symbol: 'QQQ' },
      { name: 'Dow Jones', symbol: 'DIA' },
    ];

    const results = await this.fetchMultipleIndices(indicesMapping.map(i => i.symbol));

    return results.map((data, index) => ({
      name: indicesMapping[index].name,
      data: data,
    }));
  }
}
