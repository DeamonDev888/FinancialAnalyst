"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VixSimpleAgentFixed = void 0;
const pg_1 = require("pg");
class VixSimpleAgentFixed {
    pool;
    constructor() {
        this.pool = new pg_1.Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
    }
    async analyzeVixStructure() {
        console.log('🔍 VixSimpleAgent: Début analyse VIX/VVIX depuis base de données...');
        try {
            // 1. Récupérer les données VIX depuis la base
            const vixData = await this.getVixDataFromDatabase();
            const vvixData = await this.getVvixDataFromDatabase();
            if (!vixData || vixData.length === 0) {
                return {
                    error: 'Aucune donnée VIX trouvée dans la base de données',
                    metadata: { analysis_type: 'VIX/VVIX Analysis', vix_sources_count: 0, vvix_sources_count: 0, analysis_timestamp: new Date().toISOString(), data_source: 'Database', record_count: 0 },
                    current_vix_data: { consensus_value: 0, sources: [], spread: { min: null, max: null, range: null }, last_updated: '' },
                    current_vvix_data: { consensus_value: 0, sources: [], spread: { min: null, max: null, range: null }, last_updated: '' },
                    intelligent_volatility_analysis: {
                        level: 'NORMAL', interpretation: 'No data available', sentiment: 'NEUTRAL',
                        expected_monthly_volatility: 0, expected_weekly_volatility: 0, expected_daily_move_range: 0,
                        alerts: [], market_signal: 'HOLD', signal_strength: 0
                    },
                    expert_summary: 'No VIX data available for analysis',
                    key_insights: [], trading_recommendations: {
                        strategy: 'N/A', time_horizon: 'N/A', volatility_adjustment: 'N/A',
                        risk_management: 'N/A', target_vix_levels: { support: 0, resistance: 0 }
                    }
                };
            }
            if (!vvixData || vvixData.length === 0) {
                console.warn('⚠️ Aucune donnée VVIX trouvée - analyse limitée au VIX');
            }
            // 2. Créer l'analyse complète
            const analysis = this.createVixVvixAnalysis(vixData, vvixData || []);
            // 3. Sauvegarder l'analyse dans la base (optionnel)
            await this.saveAnalysisToDatabase(analysis);
            // 4. Générer le fichier markdown
            await this.saveVixAnalysisToMarkdown(analysis);
            console.log('✅ VixSimpleAgent: Analyse terminée avec succès');
            return analysis;
        }
        catch (error) {
            console.error('❌ VixSimpleAgent: Erreur durant l\'analyse:', error);
            return {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                metadata: { analysis_type: 'VIX/VVIX Analysis', vix_sources_count: 0, vvix_sources_count: 0, analysis_timestamp: new Date().toISOString(), data_source: 'Database', record_count: 0 },
                current_vix_data: { consensus_value: 0, sources: [], spread: { min: null, max: null, range: null }, last_updated: '' },
                current_vvix_data: { consensus_value: 0, sources: [], spread: { min: null, max: null, range: null }, last_updated: '' },
                intelligent_volatility_analysis: {
                    level: 'NORMAL', interpretation: 'Analysis failed', sentiment: 'CRITICAL',
                    expected_monthly_volatility: 0, expected_weekly_volatility: 0, expected_daily_move_range: 0,
                    alerts: [], market_signal: 'CAUTION', signal_strength: 0
                },
                expert_summary: 'Analysis failed due to error',
                key_insights: [], trading_recommendations: {
                    strategy: 'N/A', time_horizon: 'N/A', volatility_adjustment: 'N/A',
                    risk_management: 'N/A', target_vix_levels: { support: 0, resistance: 0 }
                }
            };
        }
    }
    async getVixDataFromDatabase() {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT
          source,
          value,
          change_abs,
          change_pct,
          last_update,
          scraped_at
        FROM vix_data
        WHERE scraped_at >= NOW() - INTERVAL '24 hours'
        ORDER BY scraped_at DESC
        LIMIT 10
      `);
            return result.rows.map(row => ({
                source: row.source,
                value: parseFloat(row.value),
                change_abs: row.change_abs ? parseFloat(row.change_abs) : undefined,
                change_pct: row.change_pct ? parseFloat(row.change_pct) : undefined,
                last_update: row.last_update
            }));
        }
        finally {
            client.release();
        }
    }
    async getVvixDataFromDatabase() {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT
          source,
          value,
          change_abs,
          change_pct,
          last_update,
          scraped_at
        FROM vvix_data
        WHERE scraped_at >= NOW() - INTERVAL '24 hours'
        ORDER BY scraped_at DESC
        LIMIT 10
      `);
            return result.rows.map(row => ({
                source: row.source,
                value: parseFloat(row.value),
                change_abs: row.change_abs ? parseFloat(row.change_abs) : undefined,
                change_pct: row.change_pct ? parseFloat(row.change_pct) : undefined,
                last_update: row.last_update
            }));
        }
        finally {
            client.release();
        }
    }
    createVixVvixAnalysis(vixData, vvixData) {
        // Calculer le consensus VIX
        const validVixValues = vixData.filter(d => d.value !== null);
        const consensusVix = validVixValues.length > 0
            ? validVixValues.reduce((sum, d) => sum + d.value, 0) / validVixValues.length
            : 0;
        // Calculer le consensus VVIX
        const validVvixValues = vvixData.filter(d => d.value !== null);
        const consensusVvix = validVvixValues.length > 0
            ? validVvixValues.reduce((sum, d) => sum + d.value, 0) / validVvixValues.length
            : 0;
        // Calculer les spreads
        const vixValues = validVixValues.map(d => d.value);
        const vixSpread = {
            min: vixValues.length > 0 ? Math.min(...vixValues) : null,
            max: vixValues.length > 0 ? Math.max(...vixValues) : null,
            range: vixValues.length > 1 ? Math.max(...vixValues) - Math.min(...vixValues) : null
        };
        const vvixValues = validVvixValues.map(d => d.value);
        const vvixSpread = {
            min: vvixValues.length > 0 ? Math.min(...vvixValues) : null,
            max: vvixValues.length > 0 ? Math.max(...vvixValues) : null,
            range: vvixValues.length > 1 ? Math.max(...vvixValues) - Math.min(...vvixValues) : null
        };
        // Générer l'interprétation VIX/VVIX selon vos principes
        const interpretation = this.generateVixInterpretation(consensusVix, consensusVvix);
        // Créer l'analyse complète
        return {
            metadata: {
                analysis_type: 'Intelligent VIX/VVIX Analysis',
                vix_sources_count: validVixValues.length,
                vvix_sources_count: validVvixValues.length,
                analysis_timestamp: new Date().toISOString(),
                data_source: 'PostgreSQL Database',
                record_count: validVixValues.length + validVvixValues.length
            },
            current_vix_data: {
                consensus_value: consensusVix,
                sources: validVixValues,
                spread: vixSpread,
                last_updated: vixData.length > 0 ? vixData[0].last_update || new Date().toISOString() : new Date().toISOString()
            },
            current_vvix_data: {
                consensus_value: consensusVvix,
                sources: validVvixValues,
                spread: vvixSpread,
                last_updated: vvixData.length > 0 ? vvixData[0].last_update || new Date().toISOString() : new Date().toISOString()
            },
            intelligent_volatility_analysis: interpretation,
            expert_summary: this.generateExpertSummary(consensusVix, consensusVvix, interpretation),
            key_insights: this.generateKeyInsights(consensusVix, consensusVvix, interpretation),
            trading_recommendations: this.generateTradingRecommendations(consensusVix, consensusVvix, interpretation)
        };
    }
    generateVixInterpretation(vix, vvix) {
        let level;
        let interpretation = '';
        let sentiment;
        let marketSignal;
        let signalStrength = 0;
        // Appliquer vos principes de trading spécifiques
        if (vix <= 15) {
            level = 'VERY_LOW';
            interpretation = 'Marché en confiance avec très faible volatilité - Conditions optimistes';
            sentiment = 'BULLISH_CALM';
            marketSignal = 'BUY';
            signalStrength = 75;
        }
    }
    if(vix) { }
}
exports.VixSimpleAgentFixed = VixSimpleAgentFixed;
 <= 20;
{
    level = 'LOW';
    interpretation = 'Volatilité faible à modérée - Légère nervosité mais stabilité générale';
    sentiment = 'NEUTRAL';
    marketSignal = 'HOLD';
    signalStrength = 50;
}
if (vix <= 30) {
    level = 'NORMAL';
    interpretation = 'Marché nerveux et volatile - Incertitude économique';
    sentiment = 'BEARISH_NERVOUS';
    marketSignal = 'SELL';
    signalStrength = 60;
}
else {
    level = 'HIGH';
    interpretation = 'Marché en crise ou panique - Volatilité extrême';
    sentiment = 'CRITICAL';
    marketSignal = 'STRONG_SELL';
    signalStrength = 90;
}
// Ajustement basé sur le VVIX
if (vvix > 120) {
    level = 'EXTREME';
    interpretation += ' - VVIX élevé indique un danger imminent de forte volatilité';
    sentiment = 'CRITICAL';
    marketSignal = 'STRONG_SELL';
    signalStrength = Math.min(100, signalStrength + 20);
}
else if (vvix > 100) {
    interpretation += ' - VVIX élevé suggère une forte probabilité de mouvement';
    signalStrength = Math.min(95, signalStrength + 10);
}
else if (vvix < 85) {
    interpretation += ' - VVIX bas confirme la faible volatilité';
    sentiment = 'BULLISH_CALM';
    if (marketSignal === 'SELL') {
        marketSignal = 'HOLD';
        signalStrength = Math.max(25, signalStrength - 20);
    }
}
// Logique combinée VIX + VVIX
if (vix > 20 && vvix > 120) {
    interpretation += ' - Signal baissier extrême confirmé par VVIX élevé';
    marketSignal = 'STRONG_SELL';
    signalStrength = 100;
}
else if (vix < 15 && vvix < 85) {
    interpretation += ' - Marché calme et confiant, conditions haussières';
    marketSignal = 'BUY';
    sentiment = 'BULLISH_CALM';
}
const alerts = [];
// Alertes VIX
if (vix > 20) {
    alerts.push({
        type: vix > 30 ? 'CRITICAL' : 'WARNING',
        message: `VIX à ${vix.toFixed(2)} - Marché nerveux et volatile`,
        threshold: 20,
        current_value: vix,
        indicator: 'VIX'
    });
}
// Alertes VVIX
if (vvix > 120) {
    alerts.push({
        type: 'CRITICAL',
        message: `VVIX à ${vvix.toFixed(2)} - Danger de volatilité extrême`,
        threshold: 120,
        current_value: vvix,
        indicator: 'VVIX'
    });
}
else if (vvix > 100) {
    alerts.push({
        type: 'WARNING',
        message: `VVIX à ${vvix.toFixed(2)} - Probabilité élevée de mouvement`,
        threshold: 100,
        current_value: vvix,
        indicator: 'VVIX'
    });
}
return {
    level,
    interpretation,
    sentiment,
    expected_monthly_volatility: (vix / Math.sqrt(12)) * 100, // % par mois
    expected_weekly_volatility: (vix / Math.sqrt(52)) * 100, // % par semaine
    expected_daily_move_range: (vix / Math.sqrt(252)) * 100, // % par jour
    alerts,
    market_signal: marketSignal,
    signal_strength: signalStrength
};
generateExpertSummary(vix, number, vvix, number, interpretation, VixInterpretation);
string;
{
    const vixLevel = vix <= 15 ? 'FAIBLE' : vix <= 20 ? 'MODÉRÉ' : vix <= 30 ? 'ÉLEVÉ' : 'CRITIQUE';
    const vvixLevel = vvix <= 85 ? 'FAIBLE' : vvix <= 100 ? 'MODÉRÉ' : vvix <= 120 ? 'ÉLEVÉ' : 'DANGEREUX';
    return `
Analyse Experte VIX/VVIX - ${new Date().toLocaleDateString('fr-FR')}

📊 NIVEAUX ACTUELS:
• VIX: ${vix.toFixed(2)} (${vixLevel})
• VVIX: ${vvix.toFixed(2)} (${vvixLevel})
• Signal: ${interpretation.market_signal.toUpperCase()} (force: ${interpretation.signal_strength}/100)

🧠 ANALYSE COMBINÉE:
${interpretation.interpretation}

📈 VOLATILITÉ ATTENDUE:
• Mensuelle: ${interpretation.expected_monthly_volatility.toFixed(1)}%
• Hebdomadaire: ${interpretation.expected_weekly_volatility.toFixed(1)}%
• Quotidienne: ${interpretation.expected_daily_move_range.toFixed(1)}%

🎯 RECOMMANDATION PRINCIPALE:
Basé sur VIX ${vix.toFixed(2)} et VVIX ${vvix.toFixed(2)}, position défensive recommandée avec surveillance active des signaux de retournement.
    `.trim();
}
generateKeyInsights(vix, number, vvix, number, interpretation, VixInterpretation);
string[];
{
    const insights = [];
    if (vix <= 15) {
        insights.push('Marché en confiance avec faible volatilité - idéal pour stratégies de tendance haussière');
    }
    else if (vix <= 20) {
        insights.push('Transition de volatilité - période d\'incertitude modérée');
    }
    else if (vix <= 30) {
        insights.push('Marché nerveux et volatile - éviter les positions spéculatives agressives');
    }
    if (vvix > 120) {
        insights.push('VVIX extrême indique un risque de crise - recommandé hedges de protection');
    }
    else if (vvix < 85) {
        insights.push('VVIX bas confirme la stabilité actuelle du marché');
    }
    if (vix > 20 && vvix < 100) {
        insights.push('Divergence VIX/VVIX - panique non-crédible, possible rebond');
    }
    return insights;
}
generateTradingRecommendations(vix, number, vvix, number, interpretation, VixInterpretation);
VixAnalysis['trading_recommendations'];
{
    let strategy;
    let timeHorizon;
    let volatilityAdjustment;
    let riskManagement;
    if (vix <= 15) {
        strategy = 'Tendance haussière modérée';
        timeHorizon = 'Court à moyen terme (1-4 semaines)';
        volatilityAdjustment = 'Taille de position standard - volatilité faible';
        riskManagement = 'Stop-loss à 8% en dessous du point d\'entrée';
    }
    else if (vix <= 20) {
        strategy = 'Position défensive avec sélectivité';
        timeHorizon = 'Très court terme (1-5 jours)';
        volatilityAdjustment = 'Réduction de taille - volatilité modérée';
        riskManagement = 'Stop-loss serré à 5% - hedges de protection';
    }
    else if (vix <= 30) {
        strategy = 'Préservation du capital';
        timeHorizon = 'Trading intraday uniquement';
        volatilityAdjustment = 'Taille minimale - volatilité élevée';
        riskManagement = 'Aucune position overnight - risques extrêmes';
    }
    else {
        strategy = 'Sortie complète du marché';
        timeHorizon = 'Liquidation immédiate';
        volatilityAdjustment = 'Marché de crise - éviter le trading';
        riskManagement = 'Protection maximale - actifs refuges';
    }
    return {
        strategy,
        time_horizon: timeHorizon,
        volatility_adjustment: volatilityAdjustment,
        risk_management: riskManagement,
        target_vix_levels: {
            support: vix * 0.95, // Support à -5%
            resistance: vix * 1.05 // Résistance à +5%
        }
    };
}
async;
saveAnalysisToDatabase(analysis, VixAnalysis);
Promise < void  > {
    const: client = await this.pool.connect(),
    try: {
        await, client, : .query(`
        INSERT INTO vix_analyses (analysis_data, created_at)
        VALUES ($1, NOW())
        ON CONFLICT (created_at)
        DO UPDATE SET analysis_data = $1
        WHERE created_at = (
          SELECT created_at FROM vix_analyses
          ORDER BY created_at DESC
          LIMIT 1
        )
      `, [JSON.stringify(analysis)]),
        console, : .log('💾 Analyse VIX sauvegardée en base de données')
    }, finally: {
        client, : .release()
    }
};
async;
saveVixAnalysisToMarkdown(analysis, VixAnalysis);
Promise < void  > {
    const: timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19),
    const: filename = `vix_analysis_${timestamp}.md`,
    const: filepath = `vix_buffer/${filename}`,
    // Créer le contenu markdown
    let, content = `# 📊 Analyse Intelligente VIX/VVIX

**Date**: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}
**Source**: ${analysis.metadata.data_source} | **Enregistrements**: ${analysis.metadata.record_count}

---

## 📈 Données Actuelles

### VIX (Volatilité du Marché)
- **Valeur Consensus**: ${analysis.current_vix_data.consensus_value.toFixed(2)}
- **Sources**: ${analysis.current_vix_data.sources.length} sources
- **Étendue**: ${analysis.current_vix_data.spread.min?.toFixed(2) || 'N/A'} - ${analysis.current_vix_data.spread.max?.toFixed(2) || 'N/A'} (${analysis.current_vix_data.spread.range?.toFixed(2) || 'N/A'})

### VVIX (Volatilité de la Volatilité)
- **Valeur Consensus**: ${analysis.current_vvix_data.consensus_value.toFixed(2)}
- **Sources**: ${analysis.current_vvix_data.sources.length} sources
- **Étendue**: ${analysis.current_vvix_data.spread.min?.toFixed(2) || 'N/A'} - ${analysis.current_vvix_data.spread.max?.toFixed(2) || 'N/A'} (${analysis.current_vvix_data.spread.range?.toFixed(2) || 'N/A'})

---

## 🧠 Analyse Intelligente

### Niveau VIX: ${analysis.intelligent_volatility_analysis.level.toUpperCase()}
**${analysis.intelligent_volatility_analysis.interpretation}**

### Sentiment du Marché: ${analysis.intelligent_volatility_analysis.sentiment.toUpperCase()}
### Signal de Trading: ${analysis.intelligent_volatility_analysis.market_signal.toUpperCase()} (Force: ${analysis.intelligent_volatility_analysis.signal_strength}/100)

---

## 📊 Volatilité Attendue

- **Mensuelle**: ${analysis.intelligent_volatility_analysis.expected_monthly_volatility.toFixed(1)}%
- **Hebdomadaire**: ${analysis.intelligent_volatility_analysis.expected_weekly_volatility.toFixed(1)}%
- **Quotidienne**: ${analysis.intelligent_volatility_analysis.expected_daily_move_range.toFixed(1)}%

*Basé sur la formule VIX/√time (VIX mensuel = VIX/√12)*

---

## 🚨 Alertes Détectées
`,
    if(analysis) { }, : .intelligent_volatility_analysis.alerts.length > 0
};
{
    for (const alert of analysis.intelligent_volatility_analysis.alerts) {
        const emoji = alert.type === 'CRITICAL' ? '🔴' : alert.type === 'WARNING' ? '🟡' : '🔵';
        content += `${emoji} **${alert.indicator.toUpperCase()}**: ${alert.message}\n`;
        content += `   • Seuil: ${alert.threshold} | Actuel: ${alert.current_value.toFixed(2)}\n\n`;
    }
}
{
    content += `✅ **Aucune alerte active** - Marché dans conditions normales\n\n`;
}
content += `---

## 📝 Résumé Expert

${analysis.expert_summary}

---

## 🔑 Insights Clés

`;
for (let i = 0; i < analysis.key_insights.length; i++) {
    content += `${i + 1}. ${analysis.key_insights[i]}\n`;
}
content += `---

## 🎯 Recommandations de Trading

### Stratégie Principale
**${analysis.trading_recommendations.strategy}**

### Horizon Temporel
**${analysis.trading_recommendations.time_horizon}**

### Ajustement Volatilité
**${analysis.trading_recommendations.volatility_adjustment}**

### Gestion du Risque
**${.trading_recommendations.risk_management}**

### Niveaux Cibles VIX
- **Support**: ${analysis.trading_recommendations.target_vix_levels.support.toFixed(2)}
- **Résistance**: ${analysis.trading_recommendations.target_vix_levels.resistance.toFixed(2)}

---

## 📊 Méta-informations

- **Type d'analyse**: ${analysis.metadata.analysis_type}
- **Sources VIX**: ${analysis.metadata.vix_sources_count}
- **Sources VVIX**: ${analysis.metadata.vvix_sources_count}
- **Timestamp**: ${analysis.metadata.analysis_timestamp}
- **Fichier généré**: ${filename}

---

*Analyse générée par VixSimpleAgentFixed (Database-First Approach)*
*Principes de trading VIX/VVIX appliqués selon vos spécifications*
`;
// Créer le répertoire si nécessaire
const fs = require('fs').promises;
const path = require('path');
try {
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, content, 'utf-8');
    console.log(`📄 Analyse VIX sauvegardée: ${filepath}`);
}
catch (error) {
    console.error('❌ Erreur sauvegarde markdown:', error);
    throw error;
}
