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
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'financial_analyst',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '9022',
});
async function updateOexSchema() {
    const client = await pool.connect();
    try {
        console.log('🚀 Updating schema for OEX Sentiment Analysis...');
        // 1. Table for raw OEX Ratios
        await client.query(`
      CREATE TABLE IF NOT EXISTS oex_ratios (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ratio DECIMAL(10, 4) NOT NULL,
        source VARCHAR(50) DEFAULT 'Barchart',
        scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_oex_ratios_scraped_at ON oex_ratios(scraped_at DESC);
    `);
        console.log('✅ Table oex_ratios created/verified.');
        // 2. Table for Agent Analyses
        await client.query(`
      CREATE TABLE IF NOT EXISTS oex_sentiment_analyses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ratio_analyzed DECIMAL(10, 4) NOT NULL,
        sentiment_score INTEGER, -- 0 to 100 (0=Bearish, 100=Bullish)
        sentiment_label VARCHAR(20), -- BULLISH, BEARISH, NEUTRAL
        market_implication TEXT,
        trading_signal VARCHAR(50), -- BUY_CALLS, BUY_PUTS, WAIT
        raw_analysis JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_oex_analyses_created_at ON oex_sentiment_analyses(created_at DESC);
    `);
        console.log('✅ Table oex_sentiment_analyses created/verified.');
    }
    catch (error) {
        console.error('❌ Error updating schema:', error);
    }
    finally {
        client.release();
        await pool.end();
    }
}
updateOexSchema();
//# sourceMappingURL=update_oex_schema.js.map