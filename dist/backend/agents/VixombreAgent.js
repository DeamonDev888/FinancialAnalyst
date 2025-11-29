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
exports.VixombreAgent = void 0;
const BaseAgentSimple_1 = require("./BaseAgentSimple");
const VixPlaywrightScraper_1 = require("../ingestion/VixPlaywrightScraper");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const pg_1 = require("pg");
dotenv.config();
class VixombreAgent extends BaseAgentSimple_1.BaseAgentSimple {
    scraper;
    execAsync;
    pool;
    constructor() {
        super('vixombre-agent');
        this.scraper = new VixPlaywrightScraper_1.VixPlaywrightScraper();
        this.execAsync = (0, util_1.promisify)(child_process_1.exec);
        this.pool = new pg_1.Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
    }
    async analyzeVixStructure() {
        console.log(`[${this.agentName}] Starting VIX Database Analysis (inspired by Vortex500)...`);
        try {
            // 1. Tester la connexion à la base de données
            const dbConnected = await this.testDatabaseConnection();
            if (!dbConnected) {
                console.log(`[${this.agentName}] Database not connected - cannot proceed`);
                return { error: 'Database not connected and scraping fallback is disabled.' };
            }
            console.log(`[${this.agentName}] Using DATABASE-FIRST mode`);
            // 2. Essayer d'obtenir les données VIX depuis la base de données
            const vixData = await this.getVixDataFromDatabase();
            if (vixData && vixData.length > 0) {
                console.log(`[${this.agentName}] Found ${vixData.length} VIX records in DATABASE`);
                return this.performDatabaseAnalysis(vixData);
            }
            console.log(`[${this.agentName}] No VIX data in database - cannot proceed`);
            return { error: 'No VIX data found in database. Please run ingestion pipeline.' };
        }
        catch (error) {
            console.error(`[${this.agentName}] Analysis failed:`, error);
            return {
                error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * NOUVELLE METHODE: Analyse VIX avec VVIX et scraping intelligent
     */
    async analyzeVixWithVVIX() {
        console.log(`[${this.agentName}] 🚀 Starting Enhanced VIX/VVIX Analysis...`);
        try {
            // 1. Lancer le scraper complet avec VVIX et analyse intelligente
            console.log(`[${this.agentName}] 📊 Starting VIX/VVIX scraping with intelligent analysis...`);
            const results = await this.scraper.scrapeAll();
            console.log(`[${this.agentName}] ✅ Scraper completed. Found ${results.filter(r => r.value !== null).length} valid results`);
            // 2. Traiter les résultats avec VVIX
            const validResults = results.filter(r => r.value !== null);
            if (validResults.length === 0) {
                return { error: 'No valid VIX data found from any source.' };
            }
            // 3. Obtenir les données VVIX et interprétations
            let vvixData = null;
            let interpretation = null;
            for (const result of validResults) {
                if (result.vvix_data && result.vvix_data.value) {
                    vvixData = result.vvix_data;
                }
                if (result.interpretation) {
                    interpretation = result.interpretation;
                }
            }
            // 4. Créer l'analyse complète avec VVIX
            const analysis = this.createEnhancedVixAnalysis(validResults, vvixData, interpretation);
            // 5. Sauvegarder dans la base de données
            await this.saveEnhancedAnalysisToDatabase(analysis);
            return analysis;
        }
        catch (error) {
            console.error(`[${this.agentName}] Enhanced VIX/VVIX analysis failed:`, error);
            return {
                error: `Enhanced analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Crée une analyse VIX enrichie avec VVIX et interprétation
     */
    createEnhancedVixAnalysis(vixResults, vvixData, interpretation) {
        // Calculer les valeurs VIX consensus
        const validValues = vixResults.filter(r => r.value !== null).map(r => r.value);
        const consensusValue = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
        console.log(`[${this.agentName}] 📈 VIX Consensus: ${consensusValue.toFixed(2)} (from ${validValues.length} sources)`);
        if (vvixData && vvixData.value) {
            console.log(`[${this.agentName}] 📊 VVIX Value: ${vvixData.value} (source: ${vvixData.source})`);
        }
        if (interpretation) {
            console.log(`[${this.agentName}] 🎯 Analysis: ${interpretation.level} | Signal: ${interpretation.market_signal} | Strength: ${interpretation.signal_strength}/100`);
            // Afficher les alertes importantes
            interpretation.alerts
                .filter(a => a.type === 'CRITICAL')
                .forEach(alert => {
                console.log(`[${this.agentName}] 🚨 CRITICAL ALERT: ${alert.message}`);
            });
        }
        // Créer le résultat final
        return {
            metadata: {
                analysis_timestamp: new Date().toISOString(),
                market_status: this.determineMarketStatus(),
                sources_scraped: vixResults.length,
                sources_successful: validValues.length,
                analysis_type: 'ENHANCED_VIX_VVIX_ANALYSIS',
                data_source: 'web_scraping_with_intelligent_analysis',
                vvix_available: vvixData?.value !== null,
                interpretation_available: interpretation !== null,
            },
            current_vix_data: {
                consensus_value: parseFloat(consensusValue.toFixed(2)),
                sources: vixResults.map(r => ({
                    source: r.source,
                    value: r.value,
                    change_pct: r.change_pct,
                    last_update: r.last_update,
                    interpretation: r.interpretation
                        ? {
                            level: r.interpretation.level,
                            signal: r.interpretation.market_signal,
                            strength: r.interpretation.signal_strength,
                        }
                        : null,
                })),
                spread: {
                    min: validValues.length > 0 ? Math.min(...validValues).toFixed(2) : 'N/A',
                    max: validValues.length > 0 ? Math.max(...validValues).toFixed(2) : 'N/A',
                    range: validValues.length > 1
                        ? (Math.max(...validValues) - Math.min(...validValues)).toFixed(2)
                        : '0.00',
                },
            },
            vvix_analysis: vvixData
                ? {
                    current_vvix: vvixData.value,
                    source: vvixData.source,
                    last_update: vvixData.last_update,
                    change_pct: vvixData.change_pct,
                }
                : null,
            intelligent_volatility_analysis: interpretation
                ? {
                    // Niveaux et sentiment
                    vix_level: interpretation.level,
                    sentiment: interpretation.sentiment,
                    interpretation_text: interpretation.interpretation,
                    // Calculs de volatilité attendue
                    expected_movements: {
                        monthly_volatility: interpretation.expected_monthly_volatility ?? 0,
                        weekly_volatility: interpretation.expected_weekly_volatility ?? 0,
                        daily_move_range: interpretation.expected_daily_move_range ?? 0,
                        es_monthly_move: `±${(interpretation.expected_monthly_volatility ?? 0).toFixed(1)}%`,
                        es_weekly_move: `±${(interpretation.expected_weekly_volatility ?? 0).toFixed(1)}%`,
                        es_daily_move: `±${(interpretation.expected_daily_move_range ?? 0).toFixed(1)}%`,
                    },
                    // Alertes et signaux
                    alerts: interpretation.alerts,
                    market_signal: interpretation.market_signal,
                    signal_strength: interpretation.signal_strength,
                    // Analyse combinée VIX/VVIX
                    combined_analysis: this.createCombinedVixVvixAnalysis(consensusValue, vvixData?.value ?? null),
                    // Catalyseurs de marché
                    market_catalysts: this.extractMarketCatalysts(vixResults),
                }
                : null,
            expert_summary: this.createExpertSummary(consensusValue, vvixData?.value ?? null, interpretation),
            key_insights: this.createKeyInsights(consensusValue, vvixData?.value ?? null, interpretation, vixResults),
            trading_recommendations: this.createTradingRecommendations(consensusValue, vvixData?.value ?? null, interpretation),
            risk_assessment: this.createRiskAssessment(consensusValue, vvixData?.value ?? null, interpretation),
            historical_context: this.createHistoricalContext(consensusValue, interpretation),
        };
    }
    /**
     * Crée une analyse combinée VIX/VVIX selon les principes
     */
    createCombinedVixVvixAnalysis(vixValue, vvixValue) {
        if (!vvixValue) {
            return {
                status: 'VIX_ONLY',
                message: 'Analyse VIX sans VVIX disponible',
                reliability: 'MEDIUM',
            };
        }
        const ratio = vvixValue / vixValue;
        // Application des principes VIX/VVIX
        if (vixValue > 20 && vvixValue > 120) {
            return {
                status: 'CRITICAL_BEARISH',
                message: 'VIX > 20 ET VVIX > 120 : Signal baissier critique détecté',
                expected_move: 'GROSSE BAISSE IMMINENTE',
                timeframe: '24-72h',
                probability: 'HIGH',
                action: 'SELL/SHORT',
                reliability: 'HIGH',
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
                reliability: 'HIGH',
            };
        }
        if (vixValue <= 17 && vvixValue > 110) {
            return {
                status: 'VOLATILITY_IMMINENT',
                message: 'VIX BAS (<17) MAIS VVIX ÉLEVÉ (>110) : Gros mouvement attendu',
                expected_move: 'MOUVEMENT IMPORTANT DANS 24-72h',
                timeframe: '24-72h',
                probability: 'HIGH',
                action: 'PREPARE_VOLATILITY',
                reliability: 'HIGH',
            };
        }
        if (vvixValue > 130) {
            return {
                status: 'EXTREME_DANGER',
                message: 'VVIX > 130 : Danger imminent de forte volatilité',
                expected_move: 'FORTe VOLATILITÉ OU CHUTE',
                timeframe: 'IMMEDIAT',
                probability: 'VERY_HIGH',
                action: 'REDUCE_RISK',
                reliability: 'VERY_HIGH',
            };
        }
        if (vvixValue < 85) {
            return {
                status: 'CALM_MARKET',
                message: 'VVIX < 85 : Marché calme et stable',
                expected_move: 'FAIBLE PROBABILITÉ DE GROS MOUVEMENT',
                timeframe: 'STABLE',
                probability: 'LOW',
                action: 'NORMAL_TRADING',
                reliability: 'HIGH',
            };
        }
        return {
            status: 'NEUTRAL',
            message: `VIX=${vixValue.toFixed(1)}, VVIX=${vvixValue.toFixed(1)}, Ratio=${ratio.toFixed(1)}`,
            expected_move: 'CONDITIONS NORMALES',
            timeframe: 'INTRADAY',
            probability: 'MEDIUM',
            action: 'HOLD',
            reliability: 'MEDIUM',
        };
    }
    /**
     * Extrait les catalyseurs de marché des news
     */
    extractMarketCatalysts(vixResults) {
        const headlines = vixResults.flatMap(r => r.news_headlines.map(n => n.title));
        const catalysts = [];
        const keywords = {
            geopolitical: ['war', 'conflict', 'tension', 'sanctions', 'israel', 'ukraine', 'russie'],
            economic: ['inflation', 'fed', 'rate', 'employment', 'gdp', 'recession'],
            market: ['crash', 'crisis', 'spike', 'plunge', 'surge', 'correction'],
            earnings: ['earnings', 'revenue', 'profit', 'guidance', 'forecast'],
        };
        headlines.forEach(headline => {
            const lower = headline.toLowerCase();
            for (const [category, words] of Object.entries(keywords)) {
                if (words.some(word => lower.includes(word))) {
                    const catalyst = `${category.toUpperCase()}: ${headline.substring(0, 60)}...`;
                    if (!catalysts.includes(catalyst) && catalysts.length < 5) {
                        catalysts.push(catalyst);
                    }
                }
            }
        });
        return catalysts;
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
                const criticalAlerts = interpretation.alerts.filter(a => a.type === 'CRITICAL');
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
    createKeyInsights(vixValue, vvixValue, interpretation, vixResults) {
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
        const workingSources = vixResults.filter(r => r.value !== null).length;
        insights.push(`📡 Sources fiables: ${workingSources}/${vixResults.length} (${Math.round((workingSources / vixResults.length) * 100)}%)`);
        return insights.slice(0, 6); // Limiter à 6 insights maximum
    }
    /**
     * Crée les recommandations de trading
     */
    createTradingRecommendations(vixValue, vvixValue, interpretation) {
        let strategy = 'NEUTRAL';
        let entrySignals = [];
        let riskManagement = 'Gestion normale du risque';
        if (interpretation) {
            switch (interpretation.market_signal) {
                case 'STRONG_BUY':
                    strategy = 'AGGRESSIVE_BUY';
                    entrySignals = [
                        "VIX faible - Opportunité d'achat",
                        'VVIX stable - Faible volatilité',
                        'Biais haussier confirmé',
                    ];
                    riskManagement = 'Stop loss serré, taille de position augmentée';
                    break;
                case 'BUY':
                    strategy = 'MODERATE_BUY';
                    entrySignals = ['VIX modéré - Accumulation progressive', 'Biais haussier modéré'];
                    riskManagement = 'Stop loss standard, diversification';
                    break;
                case 'HOLD':
                    strategy = 'NEUTRAL';
                    entrySignals = ['VIX neutre - Attendre confirmation', 'Pas de signal clair'];
                    riskManagement = 'Gestion conservatrice, taille réduite';
                    break;
                case 'SELL':
                    strategy = 'MODERATE_SELL';
                    entrySignals = ['VIX élevé - Prise de profits', 'Augmentation de la nervosité'];
                    riskManagement = 'Stop loss large, réduction exposition';
                    break;
                case 'STRONG_SELL':
                    strategy = 'AGGRESSIVE_SELL';
                    entrySignals = ['VIX très élevé - Sortie rapide', 'VVIX critique - Danger imminent'];
                    riskManagement = 'Position de protection uniquement, taille minimale';
                    break;
                case 'CAUTION':
                    strategy = 'CAUTION';
                    entrySignals = ['VIX très bas - Risque de rebond', 'Conditions extrêmes'];
                    riskManagement = 'Position très réduite, stop loss large';
                    break;
            }
        }
        // Ajustements basés sur VVIX
        if (vvixValue && vvixValue > 130) {
            entrySignals.push('VVIX critique - Volatilité extrême attendue');
            riskManagement = 'Réduction maximale du risque, position de protection';
        }
        if (vvixValue && vvixValue < 85) {
            entrySignals.push('VVIX faible - Conditions de marché calmes');
            riskManagement = 'Trading normal avec gestion standard';
        }
        return {
            strategy,
            entry_signals: entrySignals,
            risk_management: riskManagement,
            target_vix_levels: {
                support: vixValue > 20 ? 20 : 15,
                resistance: vixValue < 25 ? 25 : 30,
                extreme_high: vixValue > 30 ? vixValue + 5 : 35,
                extreme_low: vixValue < 12 ? vixValue - 2 : 10,
            },
            time_horizon: vixValue > 25 ? 'SHORT_TERM' : 'MEDIUM_TERM',
            volatility_adjustment: interpretation ? interpretation.market_signal : 'NEUTRAL',
        };
    }
    /**
     * Crée l'évaluation des risques
     */
    createRiskAssessment(vixValue, vvixValue, interpretation) {
        let overallRisk = 'MEDIUM';
        let volatilityRisk = 'MODERATE';
        let directionalRisk = 'NEUTRAL';
        // Évaluation basée sur VIX
        if (vixValue > 30) {
            overallRisk = 'VERY_HIGH';
            volatilityRisk = 'EXTREME';
            directionalRisk = 'HIGHLY_VOLATILE';
        }
        else if (vixValue > 25) {
            overallRisk = 'HIGH';
            volatilityRisk = 'ELEVATED';
            directionalRisk = 'VOLATILE';
        }
        else if (vixValue > 20) {
            overallRisk = 'MEDIUM-HIGH';
            volatilityRisk = 'MODERATE-HIGH';
            directionalRisk = 'NERVOUS';
        }
        else if (vixValue > 15) {
            overallRisk = 'MEDIUM';
            volatilityRisk = 'MODERATE';
            directionalRisk = 'NORMAL';
        }
        else if (vixValue > 12) {
            overallRisk = 'MEDIUM-LOW';
            volatilityRisk = 'LOW-MODERATE';
            directionalRisk = 'CALM';
        }
        else {
            overallRisk = 'LOW';
            volatilityRisk = 'LOW';
            directionalRisk = 'VERY_CALM';
        }
        // Ajustements basés sur VVIX
        if (vvixValue) {
            if (vvixValue > 130) {
                overallRisk = 'VERY_HIGH';
                volatilityRisk = 'EXTREME_DANGER';
            }
            else if (vvixValue > 110) {
                overallRisk = 'HIGH';
                volatilityRisk = 'HIGH_VOLATILITY';
            }
            else if (vvixValue < 85) {
                overallRisk =
                    overallRisk === 'VERY_HIGH'
                        ? 'HIGH'
                        : overallRisk === 'HIGH'
                            ? 'MEDIUM-HIGH'
                            : overallRisk === 'LOW'
                                ? 'VERY_LOW'
                                : 'LOW-VERY_LOW';
            }
        }
        return {
            overall_risk_level: overallRisk,
            volatility_risk: volatilityRisk,
            directional_risk: directionalRisk,
            confidence_level: interpretation ? interpretation.signal_strength : 50,
            risk_factors: this.identifyRiskFactors(vixValue, vvixValue),
            recommended_position_sizing: this.calculatePositionSizing(overallRisk),
            stop_loss_recommendations: this.calculateStopLossRecommendations(vixValue, volatilityRisk),
        };
    }
    /**
     * Identifie les facteurs de risque
     */
    identifyRiskFactors(vixValue, vvixValue) {
        const factors = [];
        if (vixValue > 30)
            factors.push('VIX en zone de crise (>30)');
        if (vixValue > 25)
            factors.push('VIX élevé - forte nervosité');
        if (vixValue < 12)
            factors.push('VIX très bas - risque de rebond violent');
        if (vvixValue) {
            if (vvixValue > 130)
                factors.push('VVIX critique - volatilité extrême imminente');
            if (vvixValue > 110)
                factors.push('VVIX élevé - volatilité importante attendue');
            if (vvixValue < 85)
                factors.push('VVIX faible - conditions de marché calmes');
            const ratio = vvixValue / vixValue;
            if (ratio > 5.5)
                factors.push('Ratio VVIX/VIX très élevé');
            if (ratio < 3)
                factors.push('Ratio VVIX/VIX très faible');
        }
        return factors;
    }
    /**
     * Calcule la taille de position recommandée
     */
    calculatePositionSizing(riskLevel) {
        switch (riskLevel) {
            case 'VERY_HIGH':
                return '10-25% de la taille normale';
            case 'HIGH':
                return '25-50% de la taille normale';
            case 'MEDIUM-HIGH':
                return '50-75% de la taille normale';
            case 'MEDIUM':
                return '100% de la taille normale';
            case 'MEDIUM-LOW':
                return '100-125% de la taille normale';
            case 'LOW':
                return '125-150% de la taille normale';
            case 'VERY_LOW':
                return '150-200% de la taille normale';
            default:
                return '100% de la taille normale';
        }
    }
    /**
     * Calcule les recommandations de stop loss
     */
    calculateStopLossRecommendations(vixValue, volatilityRisk) {
        let stopLossPercentage = '2%';
        let stopLossType = 'TIGHT';
        if (vixValue > 30) {
            stopLossPercentage = '4-5%';
            stopLossType = 'WIDE';
        }
        else if (vixValue > 25) {
            stopLossPercentage = '3-4%';
            stopLossType = 'MODERATE-WIDE';
        }
        else if (vixValue > 20) {
            stopLossPercentage = '2.5-3%';
            stopLossType = 'MODERATE';
        }
        else if (vixValue > 15) {
            stopLossPercentage = '2%';
            stopLossType = 'NORMAL';
        }
        else {
            stopLossPercentage = '1.5-2%';
            stopLossType = 'TIGHT';
        }
        return {
            recommended_percentage: stopLossPercentage,
            type: stopLossType,
            reasoning: `Basé sur VIX=${vixValue.toFixed(1)} (${volatilityRisk} volatilité)`,
            volatility_adjustment: volatilityRisk === 'EXTREME' ? 'Stop loss très large requis' : 'Ajustement standard',
        };
    }
    /**
     * Crée le contexte historique
     */
    createHistoricalContext(vixValue, interpretation) {
        return {
            current_vs_historical_mean: {
                mean_20_year: 19.4,
                current_difference: parseFloat((vixValue - 19.4).toFixed(2)),
                percentile_rank: this.calculatePercentileRank(vixValue),
            },
            current_regime_analysis: interpretation
                ? {
                    regime: interpretation.level,
                    expected_duration: this.getRegimeExpectedDuration(interpretation.level),
                    typical_market_behavior: this.getTypicalMarketBehavior(interpretation.level),
                }
                : null,
            volatility_cycle: {
                current_phase: vixValue > 20 ? 'HIGH_VOLATILITY' : 'LOW_VOLATILITY',
                cycle_duration: 'Variable (2-8 semaines typique)',
                next_phase_expectation: vixValue > 25 ? 'RETREAT_TO_NORMAL' : 'POTENTIAL_SPIKE',
            },
        };
    }
    calculatePercentileRank(currentVix) {
        // Simplification - en pratique, utiliserierait les données historiques
        if (currentVix < 12)
            return 10;
        if (currentVix < 15)
            return 25;
        if (currentVix < 18)
            return 40;
        if (currentVix < 20)
            return 50;
        if (currentVix < 25)
            return 70;
        if (currentVix < 30)
            return 85;
        return 95;
    }
    getRegimeExpectedDuration(level) {
        switch (level) {
            case 'VERY_LOW':
                return '1-3 semaines (rare)';
            case 'LOW':
                return '2-6 semaines';
            case 'NORMAL':
                return '1-4 semaines';
            case 'NERVOUS':
                return '1-2 semaines';
            case 'HIGH':
                return '3-7 jours';
            case 'EXTREME':
                return '1-3 jours (crise)';
            default:
                return 'Variable';
        }
    }
    getTypicalMarketBehavior(level) {
        switch (level) {
            case 'VERY_LOW':
                return 'Marché euphorique, tendances haussières prolongées';
            case 'LOW':
                return 'Confiance accrue, volatilité faible, trend établi';
            case 'NORMAL':
                return 'Conditions équilibrées, volatilité modérée';
            case 'NERVOUS':
                return 'Nervosité mais peut être haussier, corrections possibles';
            case 'HIGH':
                return 'Forte nervosité, mouvements rapides, risques élevés';
            case 'EXTREME':
                return 'Panique, ventes massives, conditions de crise';
            default:
                return 'Comportement de marché variable';
        }
    }
    /**
     * Sauvegarde l'analyse enrichie dans la base de données
     */
    async saveEnhancedAnalysisToDatabase(analysis) {
        try {
            const query = `
        INSERT INTO vix_analysis (analysis_data, created_at, analysis_type)
        VALUES ($1, NOW(), 'ENHANCED_VIX_VVIX')
      `;
            await this.pool.query(query, [JSON.stringify(analysis)]);
            console.log(`[${this.agentName}] ✅ Enhanced VIX/VVIX analysis saved to database`);
        }
        catch (error) {
            console.error(`[${this.agentName}] Error saving enhanced analysis to database:`, error);
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
     * Analyse avec les données de la base de données
     */
    async performDatabaseAnalysis(vixData) {
        console.log(`[${this.agentName}] Performing analysis with ${vixData.length} database records...`);
        // Calculer la valeur consensus
        const validValues = vixData.filter(r => r.value !== null).map(r => parseFloat(r.value));
        const consensusValue = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
        // Analyser les changements
        const validChanges = vixData
            .filter(r => r.change_pct !== null)
            .map(r => parseFloat(r.change_pct));
        const avgChange = validChanges.length > 0 ? validChanges.reduce((a, b) => a + b, 0) / validChanges.length : 0;
        // Déterminer le tendance et le régime
        const trend = avgChange < -0.5 ? 'BEARISH' : avgChange > 0.5 ? 'BULLISH' : 'NEUTRAL';
        const regime = consensusValue > 30 ? 'CRISIS' : consensusValue > 20 ? 'ELEVATED' : 'NORMAL';
        const riskLevel = consensusValue > 25 ? 'HIGH' : consensusValue > 15 ? 'MEDIUM' : 'LOW';
        // Créer le résultat
        const result = {
            metadata: {
                analysis_timestamp: new Date().toISOString(),
                markets_status: this.determineMarketStatus(),
                sources_scraped: 0,
                sources_failed: [],
                analysis_type: 'DATABASE_VOLATILITY_ANALYSIS',
                data_source: 'database',
                record_count: vixData.length,
            },
            current_vix_data: {
                consensus_value: parseFloat(consensusValue.toFixed(2)),
                trend: trend,
                sources: vixData.map(r => ({
                    source: r.source,
                    value: r.value,
                    change_abs: r.change_abs,
                    change_pct: r.change_pct,
                    last_update: r.last_update,
                })),
            },
            expert_volatility_analysis: {
                current_vix: parseFloat(consensusValue.toFixed(2)),
                vix_trend: trend,
                volatility_regime: regime,
                sentiment: trend === 'BEARISH' ? 'NEGATIVE' : trend === 'BULLISH' ? 'POSITIVE' : 'NEUTRAL',
                sentiment_score: Math.round(avgChange * 10),
                risk_level: riskLevel,
                catalysts: [
                    'Analyse basée sur données récentes',
                    consensusValue > 25 ? 'Volatilité élevée détectée' : 'Volatilité normale',
                    avgChange > 0 ? 'Pression haussière' : avgChange < 0 ? 'Pression baissière' : 'Stabilité',
                ],
                technical_signals: {
                    signal_strength: consensusValue > 20 ? 'HIGH' : 'MEDIUM',
                    direction: trend.toLowerCase(),
                },
                market_implications: {
                    es_futures_bias: trend === 'BEARISH' ? 'BEARISH' : trend === 'BULLISH' ? 'BULLISH' : 'NEUTRAL',
                    sp500_impact: consensusValue > 25 ? 'HIGH_VOLATILITY_EXPECTED' : 'NORMAL_CONDITIONS',
                },
                expert_summary: `Analyse VIX basée sur ${vixData.length} enregistrements récents. VIX actuel: ${consensusValue.toFixed(2)}, tendance: ${trend}, régime: ${regime}.`,
                key_insights: [
                    `VIX consensus: ${consensusValue.toFixed(2)}`,
                    `Tendance: ${trend}`,
                    `Régime de volatilité: ${regime}`,
                    `Niveau de risque: ${riskLevel}`,
                ],
                trading_recommendations: {
                    strategy: consensusValue > 25 ? 'DEFENSIVE' : consensusValue < 15 ? 'AGGRESSIVE' : 'NEUTRAL',
                    target_vix_levels: [15, 25, 30],
                },
            },
            historical_context: {
                comparison_5day: null,
                comparison_20day: null,
                volatility_trend: avgChange > 0 ? 'RISING' : avgChange < 0 ? 'FALLING' : 'STABLE',
                key_levels: {
                    support: consensusValue > 20 ? 20 : 15,
                    resistance: consensusValue < 25 ? 25 : 30,
                },
            },
        };
        // Sauvegarder l'analyse dans la base de données
        await this.saveAnalysisToDatabase(result);
        return result;
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
     * Sauvegarde l'analyse dans la base de données
     */
    async saveAnalysisToDatabase(analysis) {
        try {
            const query = `
        INSERT INTO vix_analysis (analysis_data, created_at)
        VALUES ($1, NOW())
      `;
            await this.pool.query(query, [JSON.stringify(analysis)]);
            console.log(`[${this.agentName}] ✅ Analysis saved to database`);
        }
        catch (error) {
            console.error(`[${this.agentName}] Error saving analysis to database:`, error);
        }
    }
    /**
     * Nouvelle méthode principale VIX/VVIX avec sortie markdown
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
            await this.saveVixAnalysisToMarkdown(analysis);
            return analysis;
        }
        catch (error) {
            console.error(`[${this.agentName}] VIX/VVIX analysis failed:`, error);
            return {
                error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    createAnalysisPrompt(results) {
        return `
You are VIXOMBRE, a world-class volatility expert and market analyst.

## 🤖 INSTRUCTIONS
Analyze the provided VIX data and news to deliver an EXPERT VOLATILITY ANALYSIS.

CRITICAL RULES:
1. Return ONLY valid JSON.
2. NO conversational text.
3. ALL text fields MUST be in FRENCH.

## 🧠 KNOWLEDGE BASE: VIX & VVIX INTERPRETATION
1. **VIX LEVELS**:
   - **10-15**: Marché confiant, faible volatilité.
   - **20-30**: Marché nerveux/volatile (peut être haussier mais agité).
   - **>30**: Peur élevée / Crise.

2. **CALCUL DU MOUVEMENT ATTENDU (ES Futures)**:
   - "Le VIX te dit de combien ES peut bouger".
   - **Mouvement Mensuel**: VIX / 3.46 (ex: VIX 20 → ~5.8% / mois).
   - **Mouvement Hebdo**: ~1.35% pour VIX 20.
   - **Mouvement Quotidien (Rule of 16)**: VIX / 16.

3. **CORRÉLATION VVIX (Volatilité de la Volatilité)**:
   - **VIX > 20 & VVIX > 120**: 🚨 GROS MOUVEMENT IMMINENT (généralement BAISSIER).
   - **VIX Monte & VVIX < 100**: Panique non crédible, le marché rebondit souvent.
   - **VIX Bas (<15-17) & VVIX > 110**: Gros mouvement dans les 24-72h.
   - **VVIX > 130**: DANGER, forte probabilité de volatilité/chute.
   - **VVIX < 85**: Marché calme, gros mouvement peu probable.

## 📊 VIX DATA
${JSON.stringify(this.simplifyResults(results), null, 2)}

IMPORTANT DATA POINTS:
- **Value**: Current VIX level.
- **Change**: Daily change in points and percentage.
- **Range (High/Low)**: Intraday volatility range.
- **Open/Prev Close**: Gap analysis (Opening Gap).
- **News**: Recent headlines for context.

HISTORICAL CONTEXT:
- VIX Long-Term Mean: ~19-20
- VIX Crisis Levels: >30 (High Fear), >40 (Extreme Fear)
- VIX Calm Levels: <15 (Low Volatility), <12 (Extreme Calm)
- VIX Spike Reversal: Often signals market bottoms when spikes reverse

REQUIRED EXPERT ANALYSIS FORMAT:
{
  "volatility_analysis": {
    "current_vix": number,
    "vix_trend": "BULLISH|BEARISH|NEUTRAL",
    "volatility_regime": "CRISIS|ELEVATED|NORMAL|CALM|EXTREME_CALM",
    "sentiment": "EXTREME_FEAR|FEAR|NEUTRAL|GREED|EXTREME_GREED",
    "sentiment_score": number_between_-100_and_100,
    "risk_level": "CRITICAL|HIGH|MEDIUM|LOW",
    "catalysts": ["List of 3-5 key volatility drivers from news (IN FRENCH)"],
    "technical_signals": {
      "vix_vs_mean": "string (IN FRENCH)",
      "volatility_trend": "string (IN FRENCH)",
      "pattern_recognition": "string (IN FRENCH)",
      "gap_analysis": "GAP_UP|GAP_DOWN|NONE",
      "intraday_range_analysis": "EXPANDING|CONTRACTING|STABLE"
    },
    "market_implications": {
      "es_futures_bias": "BULLISH|BEARISH|NEUTRAL",
      "volatility_expectation": "INCREASING|DECREASING|STABLE",
      "confidence_level": number_between_0_100,
      "time_horizon": "INTRADAY|SWING|POSITIONAL"
    },
    "expert_summary": "Professional volatility analysis summary (2-3 sentences) IN FRENCH",
    "key_insights": ["3-5 bullet points of actionable volatility insights IN FRENCH"],
    "trading_recommendations": {
      "strategy": "VOLATILITY_BUY|VOLATILITY_SELL|NEUTRAL",
      "entry_signals": ["Specific entry conditions IN FRENCH"],
      "risk_management": "Risk management advice IN FRENCH",
      "target_vix_levels": [min_target, max_target]
    }
  }
}

ANALYSIS METHODOLOGY:
1. Compare current VIX to historical averages and recent trends.
2. **Analyze the Intraday Range (High - Low) and Opening Gap (Open - Prev Close)** for immediate sentiment.
3. Analyze news for volatility catalysts (geopolitical, economic, market events).
4. Assess market sentiment from VIX levels and news tone.
5. Provide ES Futures directional bias based on volatility expectations.
6. Include risk assessment and confidence levels.
7. Focus on actionable trading insights.

RULES:
1. Return ONLY valid JSON - no explanations outside JSON.
2. Be decisive in your analysis - avoid "may" or "might".
3. Provide specific, actionable recommendations.
4. Base sentiment_score on: Negative = -50 to -100, Neutral = -49 to 49, Positive = 50 to 100.
5. Include numerical VIX targets when providing recommendations.
6. Consider both current conditions AND future volatility expectations.
7. **IMPORTANT: ALL TEXT FIELDS (summary, insights, catalysts, recommendations) MUST BE IN FRENCH.**
`;
    }
    async tryKiloCodeWithFile(prompt) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const bufferPath = path.resolve(`vix_buffer_${timestamp}.md`);
        const content = `# Vixombre Analysis Buffer

## 📊 VIX Data
\`\`\`json
${prompt}
\`\`\`

## 🤖 Instructions
Analyze the data above and return ONLY the requested JSON.
`;
        try {
            // Écrire le fichier buffer
            await fs.writeFile(bufferPath, content, 'utf-8');
            console.log(`\n[${this.agentName}] 📝 Buffer créé: ${bufferPath}`);
            console.log(`[${this.agentName}] 📊 Taille du prompt: ${prompt.length} caractères`);
            // Préparer la commande selon l'OS
            const isWindows = process.platform === 'win32';
            const readCommand = isWindows ? `type "${bufferPath}"` : `cat "${bufferPath}"`;
            const command = `${readCommand} | kilocode -m ask --auto --json`;
            console.log(`\n[${this.agentName}] 🚀 Exécution KiloCode...`);
            const { stdout, stderr } = await this.execAsync(command, {
                timeout: 120000, // 2 minutes timeout
                cwd: process.cwd(),
                maxBuffer: 1024 * 1024, // 1MB buffer
            });
            console.log(`[${this.agentName}] ✅ KiloCode terminé, parsing de la réponse...`);
            // Nettoyer le fichier buffer après succès
            await fs.unlink(bufferPath).catch(() => {
                console.log(`[${this.agentName}] ⚠️ Impossible de supprimer le buffer: ${bufferPath}`);
            });
            return this.parseOutput(stdout, stderr);
        }
        catch (error) {
            console.error(`[${this.agentName}] ❌ Erreur KiloCode:`, error instanceof Error ? error.message : error);
            // Garder le fichier en cas d'erreur pour debugging
            console.log(`[${this.agentName}] 📄 Buffer conservé pour debug: ${bufferPath}`);
            return null;
        }
    }
    parseOutput(stdout, stderr) {
        console.log(`[${this.agentName}] 📊 Parsing de la réponse KiloCode...`);
        console.log(`[${this.agentName}] 📏 Taille stdout: ${stdout.length} caractères`);
        if (stderr) {
            console.log(`[${this.agentName}] ⚠️ Stderr: ${stderr}`);
        }
        // Sauvegarder pour debug
        fs.writeFile('vix_debug_output.txt', stdout).catch(console.error);
        try {
            // Nettoyer les codes ANSI et autres artifacts
            const clean = stdout
                .replace(/\\x1b\[[0-9;]*m/g, '') // Supprimer les couleurs
                .replace(/\\x1b\[[0-9;]*[A-Z]/g, '') // Supprimer les codes de contrôle
                .replace(/\\x1b\[.*?[A-Za-z]/g, '') // Supprimer autres séquences d'échappement
                .trim();
            console.log(`[${this.agentName}] 🧹 Nettoyage effectué, recherche du JSON...`);
            // Essayer 1: Extraire directement du contenu JSON
            let extracted = this.extractJsonFromContent(clean);
            if (extracted) {
                console.log(`[${this.agentName}] ✅ JSON extrait directement du contenu`);
                return this.validateAndCleanVixJson(extracted);
            }
            // Essayer 2: Parser ligne par ligne pour les événements KiloCode
            const lines = clean.split('\n').filter(line => line.trim() !== '');
            console.log(`[${this.agentName}] 📄 Analyse de ${lines.length} lignes...`);
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line)
                    continue;
                try {
                    const event = JSON.parse(line);
                    console.log(`[${this.agentName}] 🔍 Événement trouvé ligne ${i + 1}:`, event.type || 'unknown');
                    // Vérifier les différents types de réponses KiloCode
                    if (event.type === 'completion_result' && event.content) {
                        if (typeof event.content === 'string') {
                            extracted = this.extractJsonFromContent(event.content);
                            if (extracted) {
                                console.log(`[${this.agentName}] ✅ JSON trouvé dans completion_result`);
                                return this.validateAndCleanVixJson(extracted);
                            }
                        }
                        else if (typeof event.content === 'object') {
                            console.log(`[${this.agentName}] ✅ Objet JSON trouvé dans completion_result`);
                            return this.validateAndCleanVixJson(event.content);
                        }
                    }
                    if (event.type === 'say' && event.content && event.say !== 'reasoning') {
                        extracted = this.extractJsonFromContent(event.content);
                        if (extracted) {
                            console.log(`[${this.agentName}] ✅ JSON trouvé dans say event`);
                            return this.validateAndCleanVixJson(extracted);
                        }
                    }
                    // Vérifier s'il y a des métadonnées
                    if (event.metadata &&
                        (event.metadata.volatility_analysis || event.metadata.current_vix)) {
                        console.log(`[${this.agentName}] ✅ JSON trouvé dans metadata`);
                        return this.validateAndCleanVixJson(event.metadata);
                    }
                }
                catch {
                    // Ignorer les erreurs de parsing ligne par ligne
                    continue;
                }
            }
            // Essayer 3: Reconstruire depuis les fragments JSON
            console.log(`[${this.agentName}] 🔧 Tentative de reconstruction depuis fragments...`);
            const jsonFragments = this.extractJsonFragments(clean);
            if (jsonFragments.length > 0) {
                console.log(`[${this.agentName}] ✅ ${jsonFragments.length} fragments JSON trouvés`);
                return this.validateAndCleanVixJson(jsonFragments[0]);
            }
            throw new Error('No valid JSON found in KiloCode response');
        }
        catch (error) {
            console.error(`[${this.agentName}] ❌ Erreur de parsing:`, error instanceof Error ? error.message : error);
            // Créer une réponse de fallback minimale
            return this.createFallbackAnalysis();
        }
    }
    extractJsonFromContent(content) {
        const patterns = [
            /```json\s*(\{[\s\S]*?\})\s*```/,
            /```\s*(\{[\s\S]*?\})\s*```/,
            /\{[\s\S]*?"comparisons"[\s\S]*?\}/,
            /\{[\s\S]*?\}/,
        ];
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                try {
                    const jsonStr = match[1] || match[0];
                    return JSON.parse(jsonStr);
                }
                catch {
                    continue;
                }
            }
        }
        return null;
    }
    extractNewsThemes(results) {
        const headlines = results.flatMap(r => r.news_headlines.map(h => h.title));
        const themes = new Set();
        const keywords = [
            'inflation',
            'fed',
            'rate',
            'war',
            'earnings',
            'tech',
            'oil',
            'recession',
            'growth',
        ];
        headlines.forEach(h => {
            keywords.forEach(k => {
                if (h.toLowerCase().includes(k))
                    themes.add(k.toUpperCase());
            });
        });
        return Array.from(themes).slice(0, 5);
    }
    identifyVolatilityCatalysts(results) {
        const headlines = results.flatMap(r => r.news_headlines.map(h => h.title));
        const catalysts = headlines.filter(h => h.toLowerCase().includes('spike') ||
            h.toLowerCase().includes('plunge') ||
            h.toLowerCase().includes('crash') ||
            h.toLowerCase().includes('surge') ||
            h.toLowerCase().includes('jump') ||
            h.toLowerCase().includes('drop'));
        return catalysts.slice(0, 3);
    }
    async getVixHistoricalData() {
        try {
            const client = await this.pool.connect();
            // Récupérer les 20 derniers jours de données VIX
            const result = await client.query(`
                SELECT price as value, timestamp as created_at
                FROM market_data
                WHERE symbol = 'VIX'
                AND timestamp >= NOW() - INTERVAL '20 days'
                ORDER BY timestamp DESC
                LIMIT 20
            `);
            client.release();
            if (result.rows.length === 0) {
                return {
                    five_day_avg: 20,
                    twenty_day_avg: 20,
                    support_level: 15,
                    resistance_level: 25,
                    current_trend: 'NEUTRAL',
                };
            }
            const values = result.rows.map(row => parseFloat(row.value));
            const fiveDayAvg = values.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(5, values.length);
            const twentyDayAvg = values.reduce((a, b) => a + b, 0) / values.length;
            // Calculer niveaux de support/résistance
            const sortedValues = [...values].sort((a, b) => a - b);
            const supportLevel = sortedValues[Math.floor(sortedValues.length * 0.2)] || 15;
            const resistanceLevel = sortedValues[Math.floor(sortedValues.length * 0.8)] || 25;
            return {
                five_day_avg: parseFloat(fiveDayAvg.toFixed(2)),
                twenty_day_avg: parseFloat(twentyDayAvg.toFixed(2)),
                support_level: parseFloat(supportLevel.toFixed(2)),
                resistance_level: parseFloat(resistanceLevel.toFixed(2)),
                current_trend: this.calculateTrendDirection(values),
            };
        }
        catch (error) {
            console.error('[VixombreAgent] Error fetching historical VIX data:', error);
            return {
                five_day_avg: 20,
                twenty_day_avg: 20,
                support_level: 15,
                resistance_level: 25,
                current_trend: 'NEUTRAL',
            };
        }
    }
    getConsensusValue(results) {
        const validValues = results.filter(r => r.value !== null).map(r => r.value);
        if (validValues.length === 0)
            return 20;
        const sum = validValues.reduce((a, b) => a + b, 0);
        return parseFloat((sum / validValues.length).toFixed(2));
    }
    calculateVolatilityTrend(historicalData) {
        const fiveDayAvg = historicalData.five_day_avg;
        const twentyDayAvg = historicalData.twenty_day_avg;
        if (fiveDayAvg && twentyDayAvg) {
            if (fiveDayAvg > twentyDayAvg * 1.1)
                return 'BULLISH_VOLATILITY';
            if (fiveDayAvg < twentyDayAvg * 0.9)
                return 'BEARISH_VOLATILITY';
        }
        return 'NEUTRAL_VOLATILITY';
    }
    calculateTrendDirection(values) {
        if (values.length < 3)
            return 'NEUTRAL';
        const recent = values.slice(0, 3);
        const older = values.slice(3, 6);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
        if (recentAvg > olderAvg * 1.05)
            return 'BULLISH';
        if (recentAvg < olderAvg * 0.95)
            return 'BEARISH';
        return 'NEUTRAL';
    }
    simplifyResults(results) {
        return results.map(r => ({
            source: r.source,
            value: r.value,
            change_pct: r.change_pct,
            news: r.news_headlines.slice(0, 5).map(n => n.title), // Only top 5 titles
        }));
    }
    /**
     * Valide et nettoie la réponse JSON VIX (spécialisation de la méthode de base)
     */
    validateAndCleanVixJson(json) {
        try {
            // S'assurer que c'est un objet
            if (typeof json !== 'object' || json === null) {
                throw new Error('Response is not a JSON object');
            }
            // Vérifier la structure minimale attendue
            if (json.volatility_analysis) {
                console.log(`[${this.agentName}] ✅ Structure volatility_analysis valide`);
                return json;
            }
            if (json.current_vix || json.vix_trend) {
                console.log(`[${this.agentName}] ✅ Structure VIX valide`);
                return { volatility_analysis: json };
            }
            // Si aucune structure attendue, envelopper dans volatility_analysis
            console.log(`[${this.agentName}] 📦 Enveloppement dans volatility_analysis`);
            return { volatility_analysis: json };
        }
        catch (error) {
            console.error(`[${this.agentName}] ❌ Erreur validation JSON:`, error);
            return this.createFallbackAnalysis();
        }
    }
    /**
     * Crée une analyse de fallback si KiloCode échoue
     */
    createFallbackAnalysis() {
        console.log(`[${this.agentName}] 🔄 Création analyse de fallback...`);
        return {
            volatility_analysis: {
                current_vix: 0,
                vix_trend: 'NEUTRAL',
                volatility_regime: 'NORMAL',
                sentiment: 'NEUTRAL',
                sentiment_score: 0,
                risk_level: 'MEDIUM',
                catalysts: ['Analyse IA indisponible - données en cours de collecte'],
                technical_signals: {
                    vix_vs_mean: 'Indisponible',
                    volatility_trend: 'Indisponible',
                    pattern_recognition: 'Pas de pattern détecté',
                    gap_analysis: 'NONE',
                    intraday_range_analysis: 'STABLE',
                },
                market_implications: {
                    es_futures_bias: 'NEUTRAL',
                    volatility_expectation: 'STABLE',
                    confidence_level: 0,
                    time_horizon: 'INTRADAY',
                },
                expert_summary: 'Analyse VIX de secours - service IA temporairement indisponible. Veuillez réessayer ultérieurement.',
                key_insights: [
                    "Service d'analyse IA temporairement indisponible",
                    'Données VIX en cours de collecte',
                    'Veuillez consulter les sources directes pour les dernières valeurs',
                ],
                trading_recommendations: {
                    strategy: 'NEUTRAL',
                    entry_signals: ['Attendre confirmation IA'],
                    risk_management: "Gestion prudente en attendant l'analyse complète",
                    target_vix_levels: [15, 20, 25],
                },
            },
            metadata: {
                analysis_type: 'FALLBACK_ANALYSIS',
                error_reason: 'KiloCode parsing failed',
                fallback_used: true,
                timestamp: new Date().toISOString(),
            },
        };
    }
    /**
     * Extrait tous les fragments JSON du contenu
     */
    extractJsonFragments(content) {
        const fragments = [];
        const jsonRegex = /\{[\s\S]*?\}/g;
        let match;
        while ((match = jsonRegex.exec(content)) !== null) {
            try {
                const json = JSON.parse(match[0]);
                fragments.push(json);
            }
            catch {
                continue;
            }
        }
        return fragments;
    }
}
exports.VixombreAgent = VixombreAgent;
