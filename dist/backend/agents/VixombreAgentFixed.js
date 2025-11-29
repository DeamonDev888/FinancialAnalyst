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
exports.VixombreAgentFixed = void 0;
const BaseAgentSimple_1 = require("./BaseAgentSimple");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const pg_1 = require("pg");
dotenv.config();
class VixombreAgentFixed extends BaseAgentSimple_1.BaseAgentSimple {
    pool;
    constructor() {
        super('vixombre-agent-fixed');
        this.pool = new pg_1.Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
    }
    /**
     * Méthode principale : analyse VIX depuis la base et sauvegarde en markdown
     */
    async analyzeVixStructure() {
        console.log(`[${this.agentName}] 🚀 Starting VIX Database Analysis with markdown output...`);
        try {
            // 1. Tester la connexion à la base de données
            const dbConnected = await this.testDatabaseConnection();
            if (!dbConnected) {
                console.log(`[${this.agentName}] Database not connected - cannot proceed`);
                return { error: 'Database not connected.' };
            }
            console.log(`[${this.agentName}] Using DATABASE-FIRST mode for VIX/VVIX analysis...`);
            // 2. Récupérer les données VIX récentes
            const vixData = await this.getVixDataFromDatabase();
            if (!vixData || vixData.length === 0) {
                console.log(`[${this.agentName}] No VIX data in database - cannot proceed`);
                return { error: 'No VIX data found in database. Please run ingestion pipeline.' };
            }
            console.log(`[${this.agentName}] Found ${vixData.length} VIX records in DATABASE`);
            // 3. Récupérer les données VVIX récentes
            const vvixData = await this.getVvixDataFromDatabase();
            if (vvixData && vvixData.length > 0) {
                console.log(`[${this.agentName}] Found ${vvixData.length} VVIX records in DATABASE`);
            }
            // 4. Créer l'analyse VIX/VVIX intelligente
            const analysis = this.createVixVvixAnalysis(vixData, vvixData);
            // 5. Sauvegarder l'analyse en base de données
            await this.saveAnalysisToDatabase(analysis);
            // 6. Sauvegarder l'analyse en fichier markdown
            await this.saveAnalysisToMarkdown(analysis);
            return analysis;
        }
        catch (error) {
            console.error(`[${this.agentName}] VIX/VVIX analysis failed:`, error);
            return {
                error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Test la connexion à la base de données
     */
    async testDatabaseConnection() {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            return true;
        }
        catch (error) {
            console.error(`[${this.agentName}] Database connection failed:`, error);
            return false;
        }
    }
    /**
     * Récupère les données VIX depuis la base de données
     */
    async getVixDataFromDatabase() {
        try {
            // Essayer d'abord vix_data (table dédiée)
            const vixDataQuery = `
        SELECT
          source,
          value,
          change_abs,
          change_pct,
          previous_close,
          open,
          high,
          low,
          last_update,
          created_at
        FROM vix_data
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 10
      `;
            const vixResult = await this.pool.query(vixDataQuery);
            if (vixResult.rows.length > 0) {
                console.log(`[${this.agentName}] Found ${vixResult.rows.length} records in vix_data table`);
                return vixResult.rows;
            }
            // Fallback vers market_data (table principale)
            const marketDataQuery = `
        SELECT
          source,
          price as value,
          change_abs,
          change_pct,
          NULL as previous_close,
          NULL as open,
          NULL as high,
          NULL as low,
          timestamp as last_update,
          created_at
        FROM market_data
        WHERE symbol = 'VIX'
        AND created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 10
      `;
            const marketResult = await this.pool.query(marketDataQuery);
            console.log(`[${this.agentName}] Found ${marketResult.rows.length} records in market_data table`);
            return marketResult.rows;
        }
        catch (error) {
            console.error(`[${this.agentName}] Error getting VIX data from database:`, error);
            return [];
        }
    }
    /**
     * Récupère les données VVIX depuis la base de données
     */
    async getVvixDataFromDatabase() {
        try {
            const vvixDataQuery = `
        SELECT
          source,
          value,
          change_abs,
          change_pct,
          last_update,
          created_at
        FROM vvix_data
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 5
      `;
            const vvixResult = await this.pool.query(vvixDataQuery);
            if (vvixResult.rows.length > 0) {
                console.log(`[${this.agentName}] Found ${vvixResult.rows.length} VVIX records in vvix_data table`);
                return vvixResult.rows;
            }
            console.log(`[${this.agentName}] No VVIX data found in database`);
            return [];
        }
        catch (error) {
            console.error(`[${this.agentName}] Error getting VVIX data from database:`, error);
            return [];
        }
    }
    /**
     * Crée l'analyse VIX/VVIX combinée
     */
    createVixVvixAnalysis(vixData, vvixData) {
        // Calculer les valeurs VIX consensus
        const validVixValues = vixData.filter(r => r.value !== null).map(r => parseFloat(r.value));
        const consensusVix = validVixValues.length > 0
            ? validVixValues.reduce((a, b) => a + b, 0) / validVixValues.length
            : 0;
        // Calculer les valeurs VVIX consensus
        const validVvixValues = vvixData.filter(r => r.value !== null).map(r => parseFloat(r.value));
        const consensusVvix = validVvixValues.length > 0
            ? validVvixValues.reduce((a, b) => a + b, 0) / validVvixValues.length
            : null;
        console.log(`[${this.agentName}] 📈 VIX Consensus: ${consensusVix.toFixed(2)} (from ${validVixValues.length} sources)`);
        if (consensusVvix) {
            console.log(`[${this.agentName}] 📊 VVIX Consensus: ${consensusVvix.toFixed(2)} (from ${validVvixValues.length} sources)`);
        }
        // Analyse intelligente VIX/VVIX
        const interpretation = this.generateVixInterpretation(consensusVix, consensusVvix);
        // Données sources
        const sources = vixData.map(r => ({
            source: r.source,
            value: parseFloat(r.value).toFixed(2),
            change_pct: r.change_pct
        }));
        // Données VVIX
        const vvixSources = vvixData.map(r => ({
            source: r.source,
            value: parseFloat(r.value).toFixed(2),
            change_pct: r.change_pct
        }));
        return {
            metadata: {
                analysis_timestamp: new Date().toISOString(),
                market_status: this.determineMarketStatus(),
                vix_sources_count: vixData.length,
                vvix_sources_count: vvixData.length,
                analysis_type: 'DATABASE_VIX_VVIX_ANALYSIS',
                data_source: 'database',
                interpretation_available: interpretation !== null
            },
            current_vix_data: {
                consensus_value: parseFloat(consensusVix.toFixed(2)),
                sources: sources,
                spread: {
                    min: validVixValues.length > 0 ? Math.min(...validVixValues).toFixed(2) : 'N/A',
                    max: validVixValues.length > 0 ? Math.max(...validVixValues).toFixed(2) : 'N/A',
                    range: validVixValues.length > 1 ? (Math.max(...validVixValues) - Math.min(...validVixValues)).toFixed(2) : '0.00'
                }
            },
            current_vvix_data: {
                consensus_value: consensusVvix ? parseFloat(consensusVvix.toFixed(2)) : null,
                sources: vvixSources
            },
            intelligent_volatility_analysis: interpretation ? {
                vix_level: interpretation.level,
                sentiment: interpretation.sentiment,
                interpretation_text: interpretation.interpretation,
                expected_monthly_volatility: interpretation.expected_monthly_volatility,
                expected_weekly_volatility: interpretation.expected_weekly_volatility,
                expected_daily_move_range: interpretation.expected_daily_move_range,
                alerts: interpretation.alerts,
                market_signal: interpretation.market_signal,
                signal_strength: interpretation.signal_strength,
                combined_analysis: this.createCombinedAnalysis(consensusVix, consensusVvix)
            } : null,
            expert_summary: this.createExpertSummary(consensusVix, consensusVvix, interpretation),
            key_insights: this.createKeyInsights(consensusVix, consensusVvix, interpretation, vixData, vvixData),
            trading_recommendations: this.createTradingRecommendations(consensusVix, interpretation)
        };
    }
    /**
     * Génère l'interprétation VIX/VVIX intelligente
     */
    generateVixInterpretation(vixValue, vvixValue) {
        // Niveaux VIX
        let level;
        let sentiment;
        let interpretation;
        if (vixValue <= 12) {
            level = 'VERY_LOW';
            sentiment = 'BULLISH_CALM';
            interpretation = 'Marché extrêmement calme et confiant. Faible volatilité attendue.';
        }
        else if (vixValue <= 15) {
            level = 'LOW';
            sentiment = 'BULLISH_CALM';
            interpretation = 'Marché confiant avec faible volatilité. Climat de confiance établi.';
        }
        else if (vixValue <= 20) {
            level = 'NORMAL';
            sentiment = 'NEUTRAL';
            interpretation = 'Marché dans la normale. Volatilité modérée attendue.';
        }
        else if (vixValue <= 25) {
            level = 'NERVOUS';
            sentiment = 'BEARISH_NERVOUS';
            interpretation = 'Marché nerveux mais peut être haussier. Volatilité augmentée.';
        }
        else if (vixValue <= 35) {
            level = 'HIGH';
            sentiment = 'BEARISH_NERVOUS';
            interpretation = 'Marché très nerveux. Forte volatilité et crainte.';
        }
        else {
            level = 'EXTREME';
            sentiment = 'CRITICAL';
            interpretation = 'Marché en panique. Volatilité extrême et risque élevé.';
        }
        // Calculs de volatilité attendue
        const sqrt12 = Math.sqrt(12);
        const sqrt52 = Math.sqrt(52);
        const sqrt252 = Math.sqrt(252);
        const expected_monthly_volatility = vixValue / sqrt12;
        const expected_weekly_volatility = vixValue / sqrt52;
        const expected_daily_move_range = (vixValue / sqrt252) * 2;
        // Alertes VIX
        const alerts = [];
        if (vixValue >= 30) {
            alerts.push({
                type: 'CRITICAL',
                message: `VIX extrêmement élevé (${vixValue.toFixed(1)}) - Marché en état de panique`,
                threshold: 30,
                current_value: vixValue,
                indicator: 'VIX'
            });
        }
        else if (vixValue >= 25) {
            alerts.push({
                type: 'WARNING',
                message: `VIX élevé (${vixValue.toFixed(1)}) - Marché très nerveux`,
                threshold: 25,
                current_value: vixValue,
                indicator: 'VIX'
            });
        }
        else if (vixValue <= 12) {
            alerts.push({
                type: 'INFO',
                message: `VIX très bas (${vixValue.toFixed(1)}) - Marché extrêmement calme`,
                threshold: 12,
                current_value: vixValue,
                indicator: 'VIX'
            });
        }
        // Analyse VVIX si disponible
        if (vvixValue) {
            const ratio = vvixValue / vixValue;
            if (vixValue > 20 && vvixValue > 120) {
                alerts.push({
                    type: 'CRITICAL',
                    message: `Signal baissier critique: VIX=${vixValue.toFixed(1)} avec VVIX=${vvixValue.toFixed(1)}`,
                    threshold: 120,
                    current_value: vvixValue,
                    indicator: 'RATIO'
                });
                sentiment = 'CRITICAL';
                interpretation += ' SIGNAL BAISSIER CRITIQUE détecté par VVIX élevé.';
            }
            else if (vixValue > 20 && vvixValue < 100) {
                alerts.push({
                    type: 'WARNING',
                    message: `Incohérence VIX/VVIX: VIX=${vixValue.toFixed(1)} mais VVIX=${vvixValue.toFixed(1)} faible`,
                    threshold: 100,
                    current_value: vvixValue,
                    indicator: 'RATIO'
                });
                interpretation += ' Panique probablement non crédible - rebond possible.';
            }
            else if (vixValue <= 17 && vvixValue >= 110) {
                alerts.push({
                    type: 'WARNING',
                    message: `Volatilité imminente: VIX=${vixValue.toFixed(1)} mais VVIX=${vvixValue.toFixed(1)} élevé`,
                    threshold: 110,
                    current_value: vvixValue,
                    indicator: 'RATIO'
                });
                interpretation += ' Attention: mouvement important attendu dans 24-72h.';
            }
            else if (vvixValue > 130) {
                alerts.push({
                    type: 'CRITICAL',
                    message: `VVIX critique (${vvixValue.toFixed(1)}) - Danger imminent de forte volatilité`,
                    threshold: 130,
                    current_value: vvixValue,
                    indicator: 'VVIX'
                });
                sentiment = 'CRITICAL';
                interpretation += ' DANGER imminent de forte volatilité.';
            }
            else if (vvixValue < 85) {
                alerts.push({
                    type: 'INFO',
                    message: `VVIX faible (${vvixValue.toFixed(1)}) - Volatilité stable et prévisible`,
                    threshold: 85,
                    current_value: vvixValue,
                    indicator: 'VVIX'
                });
                interpretation += ' Marché calme et stable.';
            }
            if (ratio > 5.5) {
                alerts.push({
                    type: 'WARNING',
                    message: `Ratio VVIX/VIX élevé (${ratio.toFixed(1)}) - Volatilité excessivement volatile`,
                    threshold: 5.5,
                    current_value: ratio,
                    indicator: 'RATIO'
                });
            }
        }
        // Génération du signal de marché
        let marketSignal;
        let signalStrength;
        if (sentiment === 'CRITICAL') {
            marketSignal = 'STRONG_SELL';
            signalStrength = 95;
        }
        else if (sentiment === 'BEARISH_NERVOUS') {
            marketSignal = vvixValue && vvixValue > 110 ? 'STRONG_SELL' : 'SELL';
            signalStrength = vvixValue && vvixValue > 110 ? 90 : 70;
        }
        else if (sentiment === 'BULLISH_CALM') {
            marketSignal = level === 'VERY_LOW' ? 'CAUTION' : 'STRONG_BUY';
            signalStrength = level === 'VERY_LOW' ? 60 : 85;
        }
        else {
            marketSignal = 'HOLD';
            signalStrength = 50;
        }
        return {
            level,
            sentiment,
            interpretation,
            expected_monthly_volatility: Math.round(expected_monthly_volatility * 100) / 100,
            expected_weekly_volatility: Math.round(expected_weekly_volatility * 100) / 100,
            expected_daily_move_range: Math.round(expected_daily_move_range * 100) / 100,
            alerts,
            market_signal: marketSignal,
            signal_strength: signalStrength
        };
    }
    /**
     * Crée l'analyse combinée VIX/VVIX
     */
    createCombinedAnalysis(vixValue, vvixValue) {
        if (!vvixValue) {
            return {
                status: 'VIX_ONLY',
                message: 'Analyse VIX sans VVIX disponible',
                reliability: 'MEDIUM'
            };
        }
        const ratio = vvixValue / vixValue;
        if (vixValue > 20 && vvixValue > 120) {
            return {
                status: 'CRITICAL_BEARISH',
                message: 'VIX > 20 ET VVIX > 120 : Signal baissier critique détecté',
                expected_move: 'GROSSE BAISSE IMMINENTE',
                timeframe: '24-72h',
                probability: 'HIGH',
                action: 'SELL/SHORT',
                reliability: 'HIGH'
            };
        }
        if (vixValue > 20 && vvixValue < 100) {
            return {
                status: 'PANIC_NOT_CREDIBLE',
                message: 'VIX > 20 MAIS VVIX < 100 : Panique non crédible',
                expected_move: 'REBOND HAUSSIER PROBABLE',
                timeframe: '1-3 jours',
                probability: 'MEDIUM-HIGH',
                action: 'BUY_DIP',
                reliability: 'HIGH'
            };
        }
        if (vixValue <= 17 && vvixValue >= 110) {
            return {
                status: 'VOLATILITY_IMMINENT',
                message: 'VIX BAS (<17) MAIS VVIX ÉLEVÉ (>110) : Gros mouvement attendu',
                expected_move: 'GROS MOUVEMENT IMPORTANT DANS 24-72h',
                timeframe: '24-72h',
                probability: 'HIGH',
                action: 'PREPARE_VOLATILITY',
                reliability: 'HIGH'
            };
        }
        return {
            status: 'NEUTRAL',
            message: `VIX=${vixValue.toFixed(1)}, VVIX=${vvixValue.toFixed(1)}, Ratio=${ratio.toFixed(1)}`,
            expected_move: 'CONDITIONS NORMALES',
            timeframe: 'INTRADAY',
            probability: 'MEDIUM',
            action: 'HOLD',
            reliability: 'MEDIUM'
        };
    }
    /**
     * Détermine le statut du marché
     */
    determineMarketStatus() {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        if (day === 0 || day === 6)
            return 'WEEKEND';
        if (hour >= 14 && hour < 21)
            return 'MARKET_OPEN';
        if (hour >= 12 && hour < 14)
            return 'PRE_MARKET';
        return 'AFTER_HOURS';
    }
    /**
     * Crée le résumé expert
     */
    createExpertSummary(vixValue, vvixValue, interpretation) {
        let summary = `Analyse VIX/VVIX complète: VIX actuel à ${vixValue.toFixed(2)}`;
        if (vvixValue) {
            summary += `, VVIX à ${vvixValue.toFixed(2)}`;
        }
        if (interpretation) {
            summary += `. Niveau: ${interpretation.level}, Signal: ${interpretation.market_signal.replace('_', ' ')} avec force ${interpretation.signal_strength}/100`;
            if (interpretation.alerts.length > 0) {
                const criticalAlerts = interpretation.alerts.filter((a) => a.type === 'CRITICAL');
                if (criticalAlerts.length > 0) {
                    summary += `. ⚠️ ${criticalAlerts.length} alerte(s) critique(s) détectée(s)`;
                }
            }
        }
        return summary;
    }
    /**
     * Crée les insights clés
     */
    createKeyInsights(vixValue, vvixValue, interpretation, vixData, vvixData) {
        const insights = [];
        // Insight sur le niveau VIX
        if (vixValue < 12) {
            insights.push('🔵 VIX extrêmement bas (<12) : Marché euphorique, faible volatilité attendue');
        }
        else if (vixValue <= 15) {
            insights.push('🟢 VIX bas (12-15) : Climat de confiance, volatilité faible à modérée');
        }
        else if (vixValue <= 20) {
            insights.push('🟡 VIX normal (15-20) : Conditions de marché équilibrées');
        }
        else if (vixValue <= 25) {
            insights.push('🟠 VIX nerveux (20-25) : Marché agité mais peut être haussier');
        }
        else {
            insights.push('🔴 VIX élevé (>25) : Forte nervosité, volatilité importante attendue');
        }
        // Insight sur VVIX
        if (vvixValue) {
            const ratio = vvixValue / vixValue;
            insights.push(`📊 Ratio VVIX/VIX: ${ratio.toFixed(1)} - ${ratio > 5 ? 'Élevé' : ratio < 3 ? 'Faible' : 'Normal'}`);
            if (vvixValue > 130) {
                insights.push('🚨 VVIX critique (>130) : Danger imminent de forte volatilité');
            }
            else if (vvixValue > 110) {
                insights.push('⚠️ VVIX élevé (>110) : Volatilité importante attendue');
            }
            else if (vvixValue < 85) {
                insights.push('😌 VVIX faible (<85) : Marché calme et prévisible');
            }
        }
        // Insight sur les sources
        const workingVixSources = vixData.filter(r => r.value !== null).length;
        insights.push(`📡 Sources VIX fonctionnelles: ${workingVixSources}/${vixData.length} (${Math.round(workingVixSources / vixData.length * 100)}%)`);
        return insights.slice(0, 6); // Limiter à 6 insights maximum
    }
    /**
     * Crée les recommandations de trading
     */
    createTradingRecommendations(vixValue, interpretation) {
        let strategy = 'NEUTRAL';
        let riskManagement = 'Gestion normale du risque';
        if (interpretation) {
            switch (interpretation.market_signal) {
                case 'STRONG_BUY':
                    strategy = 'AGGRESSIVE_BUY';
                    riskManagement = 'Stop loss serré, taille de position augmentée';
                    break;
                case 'BUY':
                    strategy = 'MODERATE_BUY';
                    riskManagement = 'Stop loss standard, diversification';
                    break;
                case 'HOLD':
                    strategy = 'NEUTRAL';
                    riskManagement = 'Gestion conservatrice, taille réduite';
                    break;
                case 'SELL':
                    strategy = 'MODERATE_SELL';
                    riskManagement = 'Stop loss large, réduction exposition';
                    break;
                case 'STRONG_SELL':
                    strategy = 'AGGRESSIVE_SELL';
                    riskManagement = 'Position de protection uniquement, taille minimale';
                    break;
                case 'CAUTION':
                    strategy = 'CAUTION';
                    riskManagement = 'Position très réduite, stop loss large';
                    break;
            }
        }
        return {
            strategy,
            target_vix_levels: {
                support: vixValue > 20 ? 20 : 15,
                resistance: vixValue < 25 ? 25 : 30,
                extreme_high: vixValue > 30 ? vixValue + 5 : 35,
                extreme_low: vixValue < 12 ? vixValue - 2 : 10
            },
            time_horizon: vixValue > 25 ? 'SHORT_TERM' : 'MEDIUM_TERM',
            volatility_adjustment: interpretation ? interpretation.market_signal : 'NEUTRAL'
        };
    }
    /**
     * Sauvegarde l'analyse en base de données
     */
    async saveAnalysisToDatabase(analysis) {
        try {
            const query = `
        INSERT INTO vix_analysis (analysis_data, created_at, analysis_type)
        VALUES ($1, NOW(), 'DATABASE_VIX_VVIX_ANALYSIS')
      `;
            await this.pool.query(query, [JSON.stringify(analysis)]);
            console.log(`[${this.agentName}] ✅ VIX/VVIX analysis saved to database`);
        }
        catch (error) {
            console.error(`[${this.agentName}] Error saving analysis to database:`, error);
        }
    }
    /**
     * Sauvegarde l'analyse en fichier markdown
     */
    async saveAnalysisToMarkdown(analysis) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `vix_analysis_${timestamp}.md`;
            const filepath = path.resolve(filename);
            // Créer le contenu markdown
            let markdown = `# Analyse VIX/VVIX - ${new Date().toLocaleString('fr-FR')}\n\n`;
            // Métadonnées
            markdown += `## 📊 Métadonnées\n\n`;
            markdown += `- **Timestamp** : ${analysis.metadata.analysis_timestamp}\n`;
            markdown += `- **Type d'analyse** : ${analysis.metadata.analysis_type}\n`;
            markdown += `- **Sources VIX** : ${analysis.metadata.vix_sources_count}\n`;
            markdown += `- **Sources VVIX** : ${analysis.metadata.vvix_sources_count}\n`;
            markdown += `- **Statut du marché** : ${this.determineMarketStatus()}\n\n`;
            // Données VIX actuelles
            markdown += `## 📈 Données VIX Actuelles\n\n`;
            markdown += `- **Valeur consensus** : ${analysis.current_vix_data.consensus_value}\n`;
            markdown += `- **Étendue** : ${analysis.current_vix_data.spread.min} - ${analysis.current_vix_data.spread.max} (${analysis.current_vix_data.spread.range})\n`;
            if (analysis.current_vix_data.sources.length > 0) {
                markdown += `### Sources VIX:\n`;
                analysis.current_vix_data.sources.forEach((source, i) => {
                    markdown += `${i + 1}. **${source.source}** : ${source.value} (${source.change_pct || 'N/A'}%)\n`;
                });
            }
            // Analyse VVIX si disponible
            if (analysis.current_vvix_data) {
                markdown += `\n## 📊 Données VVIX Actuelles\n\n`;
                markdown += `- **Valeur consensus** : ${analysis.current_vvix_data.consensus_value}\n`;
                if (analysis.current_vvix_data.sources.length > 0) {
                    markdown += `### Sources VVIX:\n`;
                    analysis.current_vvix_data.sources.forEach((source, i) => {
                        markdown += `${i + 1}. **${source.source}** : ${source.value} (${source.change_pct || 'N/A'}%)\n`;
                    });
                }
            }
            // Analyse intelligente
            if (analysis.intelligent_volatility_analysis) {
                const volAnalysis = analysis.intelligent_volatility_analysis;
                markdown += `\n## 🧠 Analyse Intelligente VIX/VVIX\n\n`;
                markdown += `- **Niveau VIX** : ${volAnalysis.vix_level}\n`;
                markdown += `- **Sentiment** : ${volAnalysis.sentiment.replace('_', ' ')}\n`;
                markdown += `- **Interprétation** : ${volAnalysis.interpretation_text}\n`;
                markdown += `- **Volatilité attendue** :\n`;
                markdown += `  - Mensuelle : ±${volAnalysis.expected_monthly_volatility}%\n`;
                markdown += `  - Hebdomadaire : ±${volAnalysis.expected_weekly_volatility}%\n`;
                markdown += `  - Journalière (ES) : ±${volAnalysis.expected_daily_move_range}%\n`;
                if (volAnalysis.alerts.length > 0) {
                    markdown += `\n### 🚨 Alertes Détectées\n`;
                    volAnalysis.alerts.forEach((alert, i) => {
                        const emoji = alert.type === 'CRITICAL' ? '🔴' : alert.type === 'WARNING' ? '🟡' : '🔵';
                        markdown += `${i + 1}. ${emoji} **${alert.indicator}** : ${alert.message}\n`;
                    });
                }
                markdown += `- **Signal de marché** : ${volAnalysis.market_signal.replace('_', ' ')}\n`;
                markdown += `- **Force du signal** : ${volAnalysis.signal_strength}/100\n`;
                if (volAnalysis.combined_analysis) {
                    const combo = volAnalysis.combined_analysis;
                    markdown += `\n### 📊 Analyse Combinée VIX/VVIX\n`;
                    markdown += `- **Statut** : ${combo.status}\n`;
                    markdown += `- **Message** : ${combo.message}\n`;
                    markdown += `- **Mouvement attendu** : ${combo.expected_move}\n`;
                    markdown += `- **Horizon temporel** : ${combo.timeframe}\n`;
                    markdown += `- **Probabilité** : ${combo.probability}\n`;
                    markdown += `- **Action recommandée** : ${combo.action}\n`;
                    markdown += `- **Fiabilité** : ${combo.reliability}\n`;
                }
            }
            // Résumé expert
            markdown += `\n## 📝 Résumé Expert\n\n`;
            markdown += `${analysis.expert_summary}\n\n`;
            // Insights clés
            markdown += `## 🔑 Insights Clés\n\n`;
            if (analysis.key_insights.length > 0) {
                analysis.key_insights.forEach((insight, i) => {
                    markdown += `${i + 1}. ${insight}\n`;
                });
            }
            // Recommandations de trading
            if (analysis.trading_recommendations) {
                const recos = analysis.trading_recommendations;
                markdown += `\n## 🎯 Recommandations de Trading\n\n`;
                markdown += `- **Stratégie** : ${recos.strategy}\n`;
                markdown += `- **Horizon temporel** : ${recos.time_horizon}\n`;
                markdown += `- **Ajustement volatilité** : ${recos.volatility_adjustment}\n`;
                markdown += `- **Gestion du risque** : ${recos.risk_management}\n`;
                if (recos.target_vix_levels) {
                    const levels = recos.target_vix_levels;
                    markdown += `- **Niveaux cibles VIX** :\n`;
                    markdown += `  - Support : ${levels.support}\n`;
                    markdown += `  - Résistance : ${levels.resistance}\n`;
                    markdown += `  - Extrême haut : ${levels.extreme_high}\n`;
                    markdown += `  - Extrême bas : ${levels.extreme_low}\n`;
                }
            }
            // Écrire le fichier
            await fs.writeFile(filepath, markdown, 'utf-8');
            console.log(`[${this.agentName}] ✅ VIX/VVIX analysis saved to markdown: ${filepath}`);
        }
        catch (error) {
            console.error(`[${this.agentName}] Error saving analysis to markdown:`, error);
        }
    }
}
exports.VixombreAgentFixed = VixombreAgentFixed;
