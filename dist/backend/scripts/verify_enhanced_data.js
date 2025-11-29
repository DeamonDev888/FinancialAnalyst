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
exports.verifyEnhancedData = verifyEnhancedData;
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function verifyEnhancedData() {
    console.log('🔍 Verifying enhanced sentiment analysis data...');
    const pool = new pg_1.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'financial_analyst',
    });
    try {
        const client = await pool.connect();
        try {
            // Get the most recent sentiment analysis
            const result = await client.query(`
                SELECT
                    id,
                    analysis_date,
                    analysis_time,
                    overall_sentiment,
                    score,
                    risk_level,
                    news_count,
                    market_session,
                    inference_duration_ms,
                    volatility_estimate,
                    market_regime,
                    sentiment_strength,
                    key_insights,
                    trading_signals,
                    technical_bias,
                    news_impact_level,
                    algorithm_confidence,
                    metadata,
                    validation_flags,
                    performance_metrics,
                    created_at
                FROM sentiment_analyses
                ORDER BY created_at DESC
                LIMIT 1
            `);
            if (result.rows.length > 0) {
                const analysis = result.rows[0];
                console.log('\n✅ Enhanced Analysis Data Found:');
                console.log('📅 Date:', analysis.analysis_date);
                console.log('⏰ Time:', analysis.analysis_time);
                console.log('📈 Sentiment:', analysis.overall_sentiment);
                console.log('📊 Score:', analysis.score);
                console.log('⚠️ Risk Level:', analysis.risk_level);
                console.log('📰 News Count:', analysis.news_count);
                console.log('🏪 Market Session:', analysis.market_session);
                console.log('⚡ Inference Duration:', analysis.inference_duration_ms, 'ms');
                console.log('📉 Volatility Estimate:', analysis.volatility_estimate);
                console.log('📊 Market Regime:', analysis.market_regime);
                console.log('💪 Sentiment Strength:', analysis.sentiment_strength);
                console.log('🔑 Key Insights:', analysis.key_insights);
                console.log('📊 Trading Signals:', analysis.trading_signals);
                console.log('📈 Technical Bias:', analysis.technical_bias);
                console.log('💥 News Impact Level:', analysis.news_impact_level);
                console.log('🤖 Algorithm Confidence:', analysis.algorithm_confidence);
                console.log('📝 Metadata:', analysis.metadata);
                console.log('✅ Validation Flags:', analysis.validation_flags);
                console.log('📈 Performance Metrics:', analysis.performance_metrics);
                console.log('🕐 Created At:', analysis.created_at);
                // Check if all enhanced columns are populated
                const enhancedColumns = [
                    'analysis_time',
                    'market_session',
                    'inference_duration_ms',
                    'volatility_estimate',
                    'market_regime',
                    'sentiment_strength',
                    'key_insights',
                    'trading_signals',
                    'technical_bias',
                    'news_impact_level',
                    'algorithm_confidence',
                    'metadata',
                    'validation_flags',
                    'performance_metrics',
                ];
                console.log('\n🔍 Enhanced Columns Status:');
                let allPopulated = true;
                enhancedColumns.forEach(col => {
                    const value = analysis[col];
                    const isPopulated = value !== null &&
                        value !== undefined &&
                        (typeof value !== 'object' || Object.keys(value).length > 0);
                    console.log(`   ${col}: ${isPopulated ? '✅ POPULATED' : '❌ EMPTY'}`);
                    if (!isPopulated)
                        allPopulated = false;
                });
                console.log(`\n🎯 Overall Enhanced Data Status: ${allPopulated ? '✅ COMPLETE' : '⚠️ PARTIAL'}`);
            }
            else {
                console.log('❌ No sentiment analysis data found');
            }
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Error verifying enhanced data:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
if (require.main === module) {
    verifyEnhancedData().catch(console.error);
}
//# sourceMappingURL=verify_enhanced_data.js.map