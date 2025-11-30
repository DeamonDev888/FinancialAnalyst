#!/usr/bin/env node
import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as cron from 'node-cron';
import * as path from 'path';
import * as fs from 'fs';
// Import des agents et scrapers
import { RougePulseAgent } from '../backend/agents/RougePulseAgent';
// import { VixSimpleAgent } from '../backend/agents/VixSimpleAgent'; // File removed
import { Vortex500Agent } from '../backend/agents/Vortex500Agent.js';
import { TradingEconomicsScraper } from '../backend/ingestion/TradingEconomicsScraper.js';
import { NewsAggregator } from '../backend/ingestion/NewsAggregator.js';
// import { VixPlaywrightScraper } from '../backend/ingestion/VixPlaywrightScraper'; // File removed
// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const PID_FILE = path.join(process.cwd(), 'bot.pid');
function killPreviousInstance() {
    if (fs.existsSync(PID_FILE)) {
        try {
            const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));
            if (pid && pid !== process.pid) {
                console.log(`🛑 Killing previous instance (PID: ${pid})...`);
                try {
                    process.kill(pid, 'SIGKILL'); // Force kill
                    console.log('✅ Previous instance killed.');
                }
                catch (e) {
                    if (e.code === 'ESRCH') {
                        console.log('⚠️ Previous instance not found (stale PID file).');
                    }
                    else {
                        console.error('❌ Failed to kill previous instance:', e);
                    }
                }
            }
        }
        catch (error) {
            console.error('❌ Error reading PID file:', error);
        }
    }
    try {
        fs.writeFileSync(PID_FILE, process.pid.toString());
        console.log(`📝 PID file created (PID: ${process.pid})`);
    }
    catch (error) {
        console.error('❌ Failed to write PID file:', error);
    }
}
// Kill previous instance before doing anything else
killPreviousInstance();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'financial_analyst',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '9022',
});
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '';
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID || '';
client.once('ready', () => {
    const asciiArt = `
   _______
  /       \\
 /  🤖 BOT  \\
| FINANCIAL |
 \\ ANALYST /
  \\_______/
  `;
    console.log(asciiArt);
    console.log(`🤖 Discord Bot logged in as ${client.user?.tag}`);
    console.log(`🔗 Lien d'invitation: https://discord.com/api/oauth2/authorize?client_id=${APPLICATION_ID}&permissions=84992&scope=bot`);
    // Schedule daily summary
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ Running daily summary...');
        await postDailySummary();
    });
    // Schedule news broadcast (every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
        console.log('📡 Checking for relevant news to broadcast...');
        await broadcastRelevantNews();
    });
});
// Basic message handling
client.on('messageCreate', async (message) => {
    if (message.author.bot)
        return;
    console.log(`📩 Message received: "${message.content}" from ${message.author.tag} in ${message.channelId}`);
    // Simple ping command
    if (message.content.trim().toLowerCase() === '!ping') {
        await message.reply('🏓 Pong!');
    }
    // Help command
    if (message.content.trim().toLowerCase() === '!help') {
        await message.reply(formatHelpMessage());
    }
    // Status command
    if (message.content.trim().toLowerCase() === '!status') {
        await message.reply(formatStatusMessage());
    }
    // Sentiment command
    if (message.content.trim().toLowerCase() === '!sentiment') {
        console.log('🔍 Processing !sentiment command...');
        const sentiment = await getLatestSentiment();
        if (sentiment) {
            console.log('✅ Sentiment found, replying...');
            await message.reply(formatSentimentMessage(sentiment));
        }
        else {
            console.log('❌ No sentiment found in DB.');
            await message.reply('❌ No sentiment analysis found in database.');
        }
    }
    // VIX command
    if (message.content.trim().toLowerCase() === '!vix') {
        console.log('🔍 Processing !vix command...');
        const vix = await getLatestVix();
        if (vix) {
            console.log('✅ VIX found, replying...');
            await message.reply(formatVixMessage(vix));
        }
        else {
            console.log('❌ No VIX found in DB.');
            await message.reply('❌ No VIX analysis found in database.');
        }
    }
    // RougePulse command
    if (message.content.trim().toLowerCase() === '!rougepulse' ||
        message.content.trim().toLowerCase() === '!pulse') {
        console.log('🔴 Processing !rougepulse command...');
        const rougePulse = await getLatestRougePulse();
        if (rougePulse) {
            console.log('✅ RougePulse found, replying...');
            await message.reply(formatRougePulseMessage(rougePulse));
        }
        else {
            console.log('❌ No RougePulse found in DB.');
            await message.reply('❌ No RougePulse analysis found in database.');
        }
    }
    // ===== NOUVELLES COMMANDES POUR EXECUTER LES SCRIPTS =====
    // Commandes pour les AGENTS
    if (message.content.trim().toLowerCase() === '!run-rougepulse') {
        console.log('🚀 Lancement du RougePulseAgent...');
        await message.reply('🔄 Lancement de l\'analyse RougePulse en cours...');
        try {
            const agent = new RougePulseAgent();
            const result = await agent.analyzeMarketSentiment();
            await agent.close();
            if (result && !result.error) {
                console.log('✅ RougePulseAgent terminé avec succès');
                await message.reply(`✅ **Analyse RougePulse terminée**\n\n**Événements trouvés:** ${result.total_events || 0}\n**Événements critiques:** ${result.critical_count || 0}\n**Score de volatilité:** ${result.volatility_score || 0}/10\n\n*Résumé généré avec succès*`);
            }
            else {
                console.log('❌ Erreur dans RougePulseAgent:', result?.error);
                await message.reply(`❌ **Erreur lors de l'analyse RougePulse**\n\`${result?.error || 'Erreur inconnue'}\``);
            }
        }
        catch (error) {
            console.error('❌ Exception dans RougePulseAgent:', error);
            await message.reply(`❌ **Exception lors de l'exécution**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\``);
        }
    }
    if (message.content.trim().toLowerCase() === '!run-vixsimple') {
        console.log('📈 VixSimpleAgent supprimé - fonctionnalité non disponible');
        await message.reply('⚠️ **Fonctionnalité supprimée**\n\n*L\'agent VIX a été supprimé du projet*');
    }
    if (message.content.trim().toLowerCase() === '!run-vortex500') {
        console.log('🧪 Lancement du Vortex500Agent...');
        await message.reply('🔄 Lancement de l\'analyse de sentiment Vortex500 en cours...');
        try {
            const agent = new Vortex500Agent();
            const result = await agent.analyzeMarketSentiment();
            if (result && result.sentiment && result.sentiment !== 'N/A') {
                console.log('✅ Vortex500Agent terminé avec succès');
                const sentimentMap = {
                    BULLISH: 'HAUSSIER 🟢',
                    BEARISH: 'BAISSIER 🔴',
                    NEUTRAL: 'NEUTRE ⚪',
                };
                await message.reply(`✅ **Analyse Vortex500 terminée**\n\n**Sentiment:** ${sentimentMap[result.sentiment] || result.sentiment}\n**Score:** ${result.score}/100\n**Niveau de risque:** ${result.risk_level || 'N/A'}\n**Sources de données:** ${result.data_source || 'N/A'}\n**Nombre d'articles:** ${result.news_count || 0}\n\n*Analyse sauvegardée avec succès*`);
            }
            else {
                console.log('❌ Erreur dans Vortex500Agent - pas de résultat valide');
                await message.reply(`❌ **Erreur lors de l'analyse Vortex500**\n\`Pas de résultat valide retourné\`\n\n*Assurez-vous que des données news sont disponibles dans la base de données*`);
            }
        }
        catch (error) {
            console.error('❌ Exception dans Vortex500Agent:', error);
            await message.reply(`❌ **Exception lors de l'exécution**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\``);
        }
    }
    // Commandes pour les SCRAPERS
    if (message.content.trim().toLowerCase() === '!run-tradingeconomics') {
        console.log('📊 Lancement du TradingEconomicsScraper...');
        await message.reply('🔄 Lancement du scraping Trading Economics en cours...');
        try {
            const scraper = new TradingEconomicsScraper();
            const events = await scraper.scrapeUSCalendar();
            if (events && events.length > 0) {
                await scraper.saveEvents(events);
                console.log(`✅ TradingEconomicsScraper terminé - ${events.length} événements`);
                await message.reply(`✅ **Scraping Trading Economics terminé**\n\n**Événements récupérés:** ${events.length}\n**Événements sauvegardés:** ${events.length}\n**Période:** 7 prochains jours\n\n*Données économiques sauvegardées en base de données*`);
            }
            else {
                console.log('⚠️ TradingEconomicsScraper n\'a trouvé aucun événement');
                await message.reply('⚠️ **Aucun événement trouvé**\n\n*Le scraping s\'est terminé mais aucun événement n\'a été récupéré*');
            }
        }
        catch (error) {
            console.error('❌ Exception dans TradingEconomicsScraper:', error);
            await message.reply(`❌ **Exception lors de l'exécution**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\``);
        }
    }
    if (message.content.trim().toLowerCase() === '!run-newsaggregator') {
        console.log('📰 Lancement du NewsAggregator...');
        await message.reply('🔄 Lancement de l\'agrégation de news en cours...\n\n⏠️ *Ceci peut prendre plusieurs minutes...*');
        try {
            const aggregator = new NewsAggregator();
            const totalNews = await aggregator.fetchAndSaveAllNews();
            await aggregator.close();
            console.log(`✅ NewsAggregator terminé - ${totalNews} news items`);
            await message.reply(`✅ **Agrégation de news terminée**\n\n**Articles récupérés:** ${totalNews}\n**Sources:** ZeroHedge, CNBC, FinancialJuice, X Feeds, Finnhub, FRED, TradingEconomics\n\n*Données sauvegardées en base de données*`);
        }
        catch (error) {
            console.error('❌ Exception dans NewsAggregator:', error);
            await message.reply(`❌ **Exception lors de l'exécution**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\``);
        }
    }
    // VIX Playwright Scraper
    if (message.content.trim().toLowerCase() === '!run-vixplaywright') {
        console.log('📊 Lancement du VixPlaywrightScraper...');
        await message.reply('🔄 Lancement du scraping VIX en cours...');
        try {
            // const scraper = new VixPlaywrightScraper(); // Commented out - file removed
            // const results = await scraper.scrapeAll(); // Commented out - file removed
            // Find the first valid result with a value
            const result = null; // results.find(r => r.value !== null); // Commented out - file removed
            // if (result) { // Commented out - file removed
            //   console.log('✅ VixPlaywrightScraper terminé avec succès');
            //   await message.reply(`✅ **Scraping VIX terminé**\n\n**Source:** ${result.source}\n**VIX:** ${result.value}\n**Variation:** ${result.change_abs} (${result.change_pct}%)\n**Heure:** ${result.last_update}\n\n*Données sauvegardées en base de données*`);
            // } else {
            console.log('⚠️ VixPlaywrightScraper supprimé - fonctionnalité non disponible');
            await message.reply('⚠️ **Fonctionnalité supprimée**\n\n*Le scraper VIX a été supprimé du projet*');
            // }
        }
        catch (error) {
            console.error('❌ Exception dans VixPlaywrightScraper:', error);
            await message.reply(`❌ **Exception lors de l'exécution**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\``);
        }
    }
    // News Filter Agent
    if (message.content.trim().toLowerCase() === '!run-newsfilter') {
        console.log('🕵️ Lancement du NewsFilterAgent...');
        await message.reply('🔄 Lancement du filtrage des news en cours...');
        try {
            // Dynamic import to avoid circular dependencies if any
            const { NewsFilterAgent } = await import('../backend/agents/NewsFilterAgent.js');
            const agent = new NewsFilterAgent();
            await agent.runFilterCycle();
            console.log('✅ NewsFilterAgent terminé');
            await message.reply('✅ **Filtrage des news terminé**\n\n*Les news pertinentes ont été identifiées et seront diffusées prochainement.*');
            // Trigger broadcast immediately
            await broadcastRelevantNews();
        }
        catch (error) {
            console.error('❌ Exception dans NewsFilterAgent:', error);
            await message.reply(`❌ **Exception lors de l'exécution**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\``);
        }
    }
    // Post Top Relevant News to Private Channel
    if (message.content.trim().toLowerCase() === '!post-top-news') {
        console.log('📢 Publication des news les plus pertinentes dans le salon privé...');
        await message.reply('🔄 Publication des news les plus pertinentes en cours...');
        try {
            const postedCount = await postTopRelevantNewsToPrivate();
            console.log(`✅ ${postedCount} news publiées dans le salon privé`);
            await message.reply(`✅ **Publication terminée**\n\n**News publiées:** ${postedCount}\n**Salon:** Privé (ID: 1383069855070158969)\n\n*Les news les plus pertinentes ont été partagées dans le salon privé.*`);
        }
        catch (error) {
            console.error('❌ Exception lors de la publication:', error);
            await message.reply(`❌ **Exception lors de la publication**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\``);
        }
    }
    // Post Top Relevant News to Private Channel
    if (message.content.trim().toLowerCase() === '!post-top-news') {
        console.log('📢 Publication des news les plus pertinentes dans le salon privé...');
        await message.reply('🔄 Publication des news les plus pertinentes en cours...');
        try {
            const postedCount = await postTopRelevantNewsToPrivate();
            console.log(`✅ ${postedCount} news publiées dans le salon privé`);
            await message.reply(`✅ **Publication terminée**\n\n**News publiées:** ${postedCount}\n**Salon:** Privé (ID: 1383069855070158969)\n\n*Les news les plus pertinentes ont été partagées dans le salon privé.*`);
        }
        catch (error) {
            console.error('❌ Exception lors de la publication:', error);
            await message.reply(`❌ **Exception lors de la publication**\n\`${error instanceof Error ? error.message : 'Erreur inconnue'}\``);
        }
    }
});
function formatSentimentMessage(data) {
    const catalysts = data.catalysts
        ? Array.isArray(data.catalysts)
            ? data.catalysts
            : JSON.parse(data.catalysts)
        : [];
    const sentimentMap = {
        BULLISH: 'HAUSSIER 🟢',
        BEARISH: 'BAISSIER 🔴',
        NEUTRAL: 'NEUTRE ⚪',
    };
    const riskMap = {
        LOW: 'FAIBLE 🛡️',
        MEDIUM: 'MOYEN ⚠️',
        HIGH: 'ÉLEVÉ 🚨',
        CRITICAL: 'CRITIQUE 💀',
    };
    const sentiment = sentimentMap[data.overall_sentiment?.toUpperCase()] || data.overall_sentiment;
    const risk = riskMap[data.risk_level?.toUpperCase()] || data.risk_level;
    return `
**📊 Analyse du Sentiment de Marché**
**Sentiment :** ${sentiment}
**Score :** ${data.score}/100
**Niveau de Risque :** ${risk}

**📝 Résumé :**
${data.summary}

**🔑 Catalyseurs Clés :**
${catalysts.map((c) => `• ${c}`).join('\n')}

*Date de l'analyse : ${data.created_at ? new Date(data.created_at).toLocaleString('fr-FR') : 'Date non disponible'}*
  `.trim();
}
function formatVixMessage(row) {
    const data = row.analysis_data;
    const expert = data?.expert_volatility_analysis || {};
    const current = data?.current_vix_data || {};
    const trendMap = {
        BULLISH: 'HAUSSIER 📈',
        BEARISH: 'BAISSIER 📉',
        NEUTRAL: 'NEUTRE ➡️',
    };
    return `
**📉 Analyse Volatilité VIX**
**VIX Actuel :** ${current.consensus_value ?? 'N/A'}
**Tendance :** ${trendMap[expert.vix_trend?.toUpperCase()] || expert.vix_trend || 'N/A'}
**Régime :** ${expert.volatility_regime ?? 'N/A'}

**💡 Résumé Expert :**
${expert.expert_summary ?? 'Aucun résumé disponible.'}

**🎯 Recommandation Trading :**
Stratégie : ${expert.trading_recommendations?.strategy || 'N/A'}
Niveaux Cibles : ${expert.trading_recommendations?.target_vix_levels?.join(' - ') || 'N/A'}

*Date de l'analyse : ${row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : 'Date non disponible'}*
  `.trim();
}
function formatRougePulseMessage(data) {
    const narrative = data.market_narrative || 'Pas de narratif disponible.';
    const score = data.impact_score || 0;
    const events = Array.isArray(data.high_impact_events)
        ? data.high_impact_events
        : data.high_impact_events
            ? JSON.parse(data.high_impact_events)
            : [];
    const rec = data.trading_recommendation || 'Aucune recommandation.';
    let eventsList = '';
    if (events.length > 0) {
        eventsList = events
            .map((e) => {
            const event = e.event || e.name || 'Événement';
            const details = e.actual_vs_forecast || e.actual || 'N/A';
            const significance = e.significance || '';
            return `**📊 ${event}**\n💫 ${details}${significance ? `\n🎯 ${significance}` : ''}`;
        })
            .join('\n\n');
    }
    else {
        eventsList = '**📋 Aucun événement majeur détecté**';
    }
    return `
**🔴 RougePulse ES Futures Expert** 📊
**Impact :** ${score}/100 ${score >= 70 ? '🔥' : score >= 50 ? '⚠️' : '📉'}

**📈 Analyse de Marché :**
${narrative}

**📅 Événements Économiques :**
${eventsList}

**🎯 Signal Trading :**
${rec}

💹 *RougePulse Analysis | ${(() => {
        try {
            return data.created_at && new Date(data.created_at).getTime() > 0
                ? new Date(data.created_at).toLocaleDateString('fr-FR')
                : new Date().toLocaleDateString('fr-FR');
        }
        catch {
            return new Date().toLocaleDateString('fr-FR');
        }
    })()}*
  `.trim();
}
// Additional formatting functions for agents
function formatVortex500Message(result) {
    return `
**🧪 Vortex500 - Analyse Sentiment Marché**
**Sentiment :** ${result.sentiment || 'N/A'}
**Score :** ${result.score || 'N/A'}/100
**Confiance :** ${result.confidence || 'N/A'}%

**📝 Résumé :**
${result.summary || 'Aucun résumé disponible'}

**🎯 Recommandations :**
${result.recommendations || 'Aucune recommandation'}

*Date : ${new Date().toLocaleString('fr-FR')}*
  `.trim();
}
function formatVixAgentMessage(result) {
    const data = result.analysis_data || {};
    const current = data.current_vix_data || {};
    const expert = data.expert_volatility_analysis || {};
    return `
**📈 VIX Agent - Analyse Expert Volatilité**
**VIX Actuel :** ${current.consensus_value || 'N/A'}
**Tendance :** ${expert.vix_trend || 'N/A'}
**Régime :** ${expert.volatility_regime || 'N/A'}

**💡 Analyse Expert :**
${expert.expert_summary || 'Aucune analyse disponible'}

**🎯 Recommandations :**
Stratégie : ${expert.trading_recommendations?.strategy || 'N/A'}
Niveaux : ${expert.trading_recommendations?.target_vix_levels?.join(' - ') || 'N/A'}

*Date : ${new Date().toLocaleString('fr-FR')}*
  `.trim();
}
async function postDailySummary() {
    try {
        const [sentiment, vix, rougePulse] = await Promise.all([
            getLatestSentiment(),
            getLatestVix(),
            getLatestRougePulse()
        ]);
        let summary = '**📊 Résumé Quotidien des Marchés**\n\n';
        if (sentiment) {
            summary += `**📈 Sentiment:** ${sentiment.overall_sentiment || 'N/A'} (${sentiment.score || 'N/A'}/100)\n`;
        }
        if (vix) {
            const data = vix.analysis_data;
            const current = data?.current_vix_data || {};
            summary += `**📉 VIX:** ${current.consensus_value || 'N/A'}\n`;
        }
        if (rougePulse) {
            summary += `**🔴 Impact RougePulse:** ${rougePulse.impact_score || 'N/A'}/100\n`;
        }
        if (!sentiment && !vix && !rougePulse) {
            summary += 'Aucune analyse disponible actuellement.';
        }
        summary += `\n*${new Date().toLocaleDateString('fr-FR')}*`;
        if (CHANNEL_ID) {
            const channel = await client.channels.fetch(CHANNEL_ID);
            if (channel) {
                await channel.send(summary);
            }
        }
    }
    catch (error) {
        console.error('Error posting daily summary:', error);
    }
}
// Error handling
client.on('error', (error) => {
    console.error('Discord client error:', error);
});
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});
process.on('SIGINT', () => {
    console.log('🛑 Shutting down bot...');
    client.destroy();
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('🛑 Shutting down bot...');
    client.destroy();
    process.exit(0);
});
// Database query functions
async function getLatestSentiment() {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM sentiment_analyses ORDER BY created_at DESC LIMIT 1');
        return result.rows[0];
    }
    finally {
        client.release();
    }
}
async function getLatestVix() {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM vix_analyses ORDER BY created_at DESC LIMIT 1');
        return result.rows[0];
    }
    finally {
        client.release();
    }
}
async function getLatestRougePulse() {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM rouge_pulse_analyses ORDER BY created_at DESC LIMIT 1');
        return result.rows[0];
    }
    finally {
        client.release();
    }
}
async function broadcastRelevantNews() {
    const NEWS_CHANNEL_ID = '1442317829998383235';
    try {
        const dbClient = await pool.connect();
        try {
            // Ensure is_sent column exists (idempotent)
            await dbClient.query(`
        ALTER TABLE news_items
        ADD COLUMN IF NOT EXISTS is_sent BOOLEAN DEFAULT FALSE
      `);
            // Get relevant news that hasn't been sent yet
            // We look for processing_status = 'RELEVANT' which implies score >= 6
            const result = await dbClient.query(`
        SELECT id, title, source, url, category, content, relevance_score, published_at
        FROM news_items
        WHERE processing_status = 'RELEVANT'
          AND is_sent = FALSE
        ORDER BY created_at ASC
        LIMIT 5
      `);
            const news = result.rows;
            if (news.length > 0) {
                const channel = await client.channels.fetch(NEWS_CHANNEL_ID);
                if (!channel) {
                    console.error(`News channel ${NEWS_CHANNEL_ID} not found`);
                    return;
                }
                for (const item of news) {
                    const embed = {
                        color: 0x00ff00, // Green for relevant news
                        title: `🚨 ${item.title}`,
                        url: item.url,
                        description: item.content || 'Pas de résumé disponible.',
                        fields: [
                            { name: 'Source', value: item.source, inline: true },
                            { name: 'Catégorie', value: item.category || 'N/A', inline: true },
                            { name: 'Pertinence', value: `${item.relevance_score}/10`, inline: true },
                        ],
                        footer: { text: 'NovaQuote News Filter' },
                        timestamp: item.published_at ? new Date(item.published_at).toISOString() : new Date().toISOString(),
                    };
                    await channel.send({ embeds: [embed] });
                    // Mark as sent
                    await dbClient.query('UPDATE news_items SET is_sent = TRUE WHERE id = $1', [item.id]);
                    // Small delay to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                console.log(`📡 Broadcasted ${news.length} relevant news items to ${NEWS_CHANNEL_ID}`);
            }
        }
        finally {
            dbClient.release();
        }
    }
    catch (error) {
        console.error('Error broadcasting news:', error);
    }
}
async function postTopRelevantNewsToPrivate() {
    const PRIVATE_CHANNEL_ID = '1383069855070158969';
    try {
        const dbClient = await pool.connect();
        try {
            // Get top relevant news (highest scores first)
            // Look for processing_status = 'RELEVANT' and order by relevance_score DESC
            const result = await dbClient.query(`
        SELECT id, title, source, url, category, content, relevance_score, published_at
        FROM news_items
        WHERE processing_status = 'RELEVANT'
        ORDER BY relevance_score DESC, created_at DESC
        LIMIT 10
      `);
            const news = result.rows;
            if (news.length > 0) {
                const channel = await client.channels.fetch(PRIVATE_CHANNEL_ID);
                if (!channel) {
                    console.error(`Private channel ${PRIVATE_CHANNEL_ID} not found`);
                    return 0;
                }
                // Send header message
                await channel.send(`**🔥 TOP ${news.length} NEWS LES PLUS PERTINENTES** 📊\n*Classées par score de pertinence*\n`);
                let postedCount = 0;
                for (const item of news) {
                    const embed = {
                        color: 0xffd700, // Gold for top news
                        title: `⭐ ${item.title}`,
                        url: item.url,
                        description: item.content || 'Pas de résumé disponible.',
                        fields: [
                            { name: 'Source', value: item.source, inline: true },
                            { name: 'Catégorie', value: item.category || 'N/A', inline: true },
                            { name: 'Score', value: `🔥 ${item.relevance_score}/10`, inline: true },
                        ],
                        footer: { text: 'NovaQuote Top News' },
                        timestamp: item.published_at ? new Date(item.published_at).toISOString() : new Date().toISOString(),
                    };
                    await channel.send({ embeds: [embed] });
                    postedCount++;
                    // Small delay to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
                // Send summary
                await channel.send(`✅ **${postedCount} news publiées avec succès**\n*Mis à jour: ${new Date().toLocaleString('fr-FR')}*`);
                console.log(`🔒 Posted ${postedCount} top relevant news items to private channel ${PRIVATE_CHANNEL_ID}`);
                return postedCount;
            }
            else {
                console.log('⚠️ No relevant news found to post');
                return 0;
            }
        }
        finally {
            dbClient.release();
        }
    }
    catch (error) {
        console.error('Error posting top news to private channel:', error);
        return 0;
    }
}
function formatHelpMessage() {
    return `
**🤖 Financial Analyst Bot - Commandes Disponibles**

**📊 Analyses de Marché:**
\`!sentiment\` - Analyse du sentiment de marché
\`!vix\` - Analyse de la volatilité VIX
\`!rougepulse\` ou \`!pulse\` - Analyse RougePulse ES Futures

**🚀 Exécution d'Agents:**
\`!run-rougepulse\` - Lance l'analyse RougePulse
\`!run-vixsimple\` - Lance l'analyse VIX
\`!run-vortex500\` - Lance l'analyse Vortex500

**📰 Scraping de Données:**
\`!run-tradingeconomics\` - Scrape le calendrier économique
\`!run-newsaggregator\` - Agrège les news de toutes les sources
\`!run-newsfilter\` - Filtre les news par pertinence

**📢 Publication de News:**
\`!post-top-news\` - Publie les news les plus pertinentes dans le salon privé

**ℹ️ Informations:**
\`!status\` - État du bot et statistiques
\`!help\` - Affiche cette aide
\`!ping\` - Test de connectivité

**⏰ Tâches Automatiques:**
- Résumé quotidien à 8h00
- Diffusion de news toutes les 5 minutes

*Utilisez les commandes en minuscules.*
  `.trim();
}
function formatStatusMessage() {
    return `
**📊 État du Bot Financial Analyst**

**🤖 Statut:** En ligne ✅
**⏱️ Uptime:** ${Math.floor(process.uptime() / 60)} minutes
**💾 Mémoire:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB utilisés

**🔄 Tâches Programmées:**
- ✅ Résumé quotidien (8h00)
- ✅ Diffusion news (toutes les 5 min)

**📈 Analyses Disponibles:**
- Sentiment de marché
- Analyse VIX
- RougePulse ES Futures

**📰 Sources de Données:**
- ZeroHedge, CNBC, FinancialJuice
- X (Twitter) feeds, Finnhub, FRED
- TradingEconomics, VIX data

*Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}*
  `.trim();
}
// Start the bot
async function startBot() {
    try {
        const token = process.env.DISCORD_TOKEN;
        if (!token) {
            throw new Error('DISCORD_TOKEN not found in environment variables');
        }
        await client.login(token);
    }
    catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}
// Bootstrap
startBot();
//# sourceMappingURL=index.js.map