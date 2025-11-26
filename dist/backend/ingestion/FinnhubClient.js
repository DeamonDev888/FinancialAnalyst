"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinnhubClient = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class FinnhubClient {
    apiKey;
    baseUrl = 'https://finnhub.io/api/v1';
    constructor() {
        this.apiKey = process.env.FINNHUB_API_KEY || '';
        if (!this.apiKey) {
            console.warn('⚠️ FINNHUB_API_KEY is missing. Finnhub data will not be fetched.');
        }
    }
    /**
     * Récupère les news générales du marché
     */
    async fetchMarketNews() {
        if (!this.apiKey)
            return [];
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/news`, {
                params: {
                    category: 'general',
                    token: this.apiKey,
                },
                timeout: 5000,
            });
            return response.data.slice(0, 10); // Top 10 news
        }
        catch (error) {
            console.error('❌ Error fetching Finnhub news:', error instanceof Error ? error.message : error);
            return [];
        }
    }
    /**
     * Récupère le sentiment des news (si disponible dans le plan gratuit)
     * Sinon, on se contente des news brutes
     */
    async fetchNewsSentiment() {
        // Note: L'endpoint sentiment est souvent Premium.
        // On se concentre sur les news brutes pour l'instant.
        return null;
    }
}
exports.FinnhubClient = FinnhubClient;
