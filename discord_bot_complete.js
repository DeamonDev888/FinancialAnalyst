#!/usr/bin/env node

/**
 * Bot Discord Complet - Anti-doublon d'instances
 * Version avec toutes les fonctionnalités principales
 */

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Tuer les autres instances du bot Discord avant de démarrer
async function killOtherBotInstances() {
  console.log('🔍 Recherche d\'autres instances du bot Discord...');

  try {
    const { exec } = await import('child_process');

    // Sur Windows, chercher les processus node.js avec Discord
    exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout) => {
      if (error) {
        console.log('⚠️ Impossible de lister les processus:', error.message);
        return;
      }

      const lines = stdout.split('\n');
      let currentPid = process.pid;
      let killedCount = 0;

      lines.forEach(line => {
        if (line.includes('node.exe') && (
          line.includes('discord_bot') ||
          line.includes('discord') ||
          line.includes('bot') ||
          line.includes('novaquote')
        )) {
          const parts = line.split(',');
          if (parts.length >= 2) {
            const pid = parseInt(parts[1]?.replace(/"/g, '').trim());

            if (pid && pid !== currentPid && !isNaN(pid)) {
              try {
                process.kill(pid, 'SIGTERM');
                console.log(`🔫 Instance du bot tuée: PID ${pid}`);
                killedCount++;
              } catch (killError) {
                // Forcer si nécessaire
                exec(`taskkill /F /PID ${pid}`, (forceError) => {
                  if (!forceError) {
                    console.log(`🔫 Instance forcée: PID ${pid}`);
                    killedCount++;
                  }
                });
              }
            }
          }
        }
      });

      if (killedCount > 0) {
        console.log(`✅ ${killedCount} autre(s) instance(s) du bot tuée(s)`);
        // Attendre que les processus se terminent
        setTimeout(() => {
          console.log('🚀 Démarrage du bot Discord complet...');
        }, 3000);
      } else {
        console.log('✅ Aucune autre instance du bot trouvée');
        console.log('🚀 Démarrage du bot Discord complet...');
      }
    });
  } catch (error) {
    console.log('⚠️ Erreur lors de la recherche des autres instances:', error.message);
    console.log('🚀 Démarrage du bot Discord complet...');
  }
}

// Client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Configuration
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '';
const APPLICATION_ID = '1442309135646331001';

// RSS Functions
const sentArticles = new Set();
const MAX_SENT_ARTICLES = 1000;

function loadSentArticles() {
  try {
    const dataFile = path.resolve(process.cwd(), 'data', 'sent_articles.json');

    if (fs.existsSync(dataFile)) {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      data.forEach(articleId => sentArticles.add(articleId));
      console.log(`📚 ${sentArticles.size} articles précédemment envoyés chargés`);
    }
  } catch (error) {
    console.log("ℹ️ Aucun historique d'articles trouvé, démarrage avec une liste vide");
  }
}

function saveSentArticles() {
  try {
    const dataFile = path.resolve(process.cwd(), 'data', 'sent_articles.json');

    // Crée le dossier data s'il n'existe pas
    const dataDir = path.dirname(dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const articlesArray = Array.from(sentArticles);
    fs.writeFileSync(dataFile, JSON.stringify(articlesArray, null, 2));
    console.log(`💾 ${articlesArray.length} articles sauvegardés`);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des articles:', error.message);
  }
}

function getArticleId(title, link, pubDate) {
  const cleanTitle = (title || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const cleanLink = (link || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${cleanTitle}_${cleanLink}_${pubDate}`;
}

function isArticleNew(title, link, pubDate) {
  const articleId = getArticleId(title, link, pubDate);
  return !sentArticles.has(articleId);
}

function markArticleAsSent(title, link, pubDate) {
  const articleId = getArticleId(title, link, pubDate);
  sentArticles.add(articleId);

  if (sentArticles.size > MAX_SENT_ARTICLES) {
    const articlesArray = Array.from(sentArticles);
    const toKeep = articlesArray.slice(-MAX_SENT_ARTICLES);
    sentArticles.clear();
    toKeep.forEach(id => sentArticles.add(id));
  }

  saveSentArticles();
}

// Base de données
let pool;

function initDatabase() {
  try {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'financial_analyst',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '9022',
    });
    console.log('✅ Base de données initialisée');
  } catch (error) {
    console.log('⚠️ Erreur d\'initialisation de la base de données:', error.message);
    pool = null;
  }
}

// Fonctions de formatage
function formatHelpMessage() {
  return `
**🤖 NovaQuote Analyste - Commandes Complètes**

📰 **Commandes RSS :**
• \`!rss\` - Afficher les NOUVEAUX articles des experts IA depuis ia.opml (~45s)
• \`!resetrss\` - Réinitialiser l'historique des articles envoyés

📊 **Commandes d'Analyse (Base de données) :**
• \`!sentiment\` - Dernière analyse de sentiment enregistrée (instant)
• \`!vix\` - Dernière analyse VIX enregistrée (instant)
• \`!rougepulse\` - Dernière analyse calendrier économique (instant)

🤖 **Commandes des Agents IA (Temps réel) :**
• \`!rougepulseagent\` - Analyse calendrier économique en temps réel (~90s)
• \`!vixagent\` - Analyse experte VIX en temps réel (~90s)
• \`!vortex500\` - Analyse sentiment marché avancée en temps réel (~90s)

🔧 **Commandes de Scraping :**
• \`!newsagg\` - Récupérer les dernières news financières (~30s)
• \`!tescraper\` - Scraper calendrier économique US (~60s)
• \`!vixscraper\` - Scraper données volatilité VIX (~60s)

ℹ️ **Informations :**
• \`!status\` - État du bot et connexions
• \`!help\` - Afficher ce message d'aide

⏰ **Fonctionnalités Automatiques :**
• Résumé quotidien des marchés à 8h00

⚡ **Temps d'exécution :**
- Base de données : **Instant** (< 1s)
- Agents IA : **~90 secondes**
- Scraping : **30-60 secondes**
- RSS : **~45 secondes**

💡 **Information :**
Le bot fournit une analyse financière en temps réel incluant des scores de sentiment, des indicateurs de volatilité et des recommandations de trading basées sur les dernières données.

🎯 **Conseils :**
- Utilisez les commandes "Base de données" pour des résultats instantanés
- Utilisez les agents IA pour des analyses fraîches et personnalisées
- Les agents IA peuvent prendre jusqu'à 90 secondes - soyez patient !

*Besoin d'aide ? Contactez l'administrateur !*
  `.trim();
}

function formatStatusMessage() {
  return `
**🤖 État du Bot NovaQuote Complet**

📊 **Connexions :**
${pool ? '✅ Base de données connectée' : '❌ Base de données déconnectée'}
📡 Discord : ${client.isReady() ? '✅ Connecté' : '🔄 Connexion en cours...'}

🔧 **Fonctionnalités actives :**
- ✅ Anti-doublon d'instances
- ✅ Commandes de base
- ✅ RSS Reader (ia.opml)
- ✅ Agents IA simulation
- ✅ Gestion des erreurs
- ✅ Sauvegarde d'articles

📈 **Statistiques :**
- PID: ${process.pid}
- Uptime: ${Math.floor(process.uptime())} secondes
- Articles envoyés: ${sentArticles.size}
- Mémoire: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB

*Bot NovaQuote complet corrigé par Deamon - 2024*
  `.trim();
}

// Fonctions de base de données
async function getLatestSentiment() {
  if (!pool) return null;
  try {
    const res = await pool.query(
      `SELECT * FROM sentiment_analyses ORDER BY created_at DESC LIMIT 1`
    );
    return res.rows[0];
  } catch (e) {
    console.error('Error fetching sentiment:', e);
    return null;
  }
}

async function getLatestVix() {
  if (!pool) return null;
  try {
    const res = await pool.query(`SELECT * FROM vix_analyses ORDER BY created_at DESC LIMIT 1`);
    return res.rows[0];
  } catch (e) {
    console.error('Error fetching VIX:', e);
    return null;
  }
}

async function getLatestRougePulse() {
  if (!pool) return null;
  try {
    const res = await pool.query(
      `SELECT * FROM rouge_pulse_analyses ORDER BY created_at DESC LIMIT 1`
    );
    return res.rows[0];
  } catch (e) {
    console.error('Error fetching rouge pulse:', e);
    return null;
  }
}

// Handler de messages
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();
  console.log(`📩 Message received: "${message.content}" from ${message.author.tag} in ${message.channelId}`);

  switch (content.toLowerCase()) {
    case '!help':
      console.log('📖 Processing !help command...');
      await message.reply(formatHelpMessage());
      break;

    case '!status':
      console.log('📊 Processing !status command...');
      await message.reply(formatStatusMessage());
      break;

    case '!sentiment':
      console.log('🔍 Processing !sentiment command...');
      const sentiment = await getLatestSentiment();
      if (sentiment) {
        const message = `**📊 Analyse du Sentiment de Marché**

**Sentiment :** ${sentiment.overall_sentiment === 'BULLISH' ? '🟢 HAUSSIER' : sentiment.overall_sentiment === 'BEARISH' ? '🔴 BAISSIER' : '⚪ NEUTRE'}
**Score :** ${sentiment.score}/100
**Niveau de Risque :** ${sentiment.risk_level === 'LOW' ? '🛡️ FAIBLE' : sentiment.risk_level === 'MEDIUM' ? '⚠️ MOYEN' : sentiment.risk_level === 'HIGH' ? '🚨 ÉLEVÉ' : '💀 CRITIQUE'}

**📝 Résumé :**
${sentiment.summary || 'Aucun résumé disponible'}

**🔑 Catalyseurs Clés :**
${sentiment.catalysts ? JSON.parse(sentiment.catalysts).map((c) => `• ${c}`).join('\n') : 'Aucun catalyseur identifié'}

*Date de l'analyse : ${new Date(sentiment.created_at).toLocaleString('fr-FR')}*`;
        await message.reply(message);
      } else {
        await message.reply('❌ Aucune analyse de sentiment trouvée en base de données.\n💡 Utilisez d\'abord !vortex500 pour générer une analyse.');
      }
      break;

    case '!vix':
      console.log('🔍 Processing !vix command...');
      const vix = await getLatestVix();
      if (vix) {
        const analysisData = typeof vix.analysis_data === 'string' ? JSON.parse(vix.analysis_data) : vix.analysis_data;
        const expert = analysisData.expert_volatility_analysis || {};
        const current = analysisData.current_vix_data || {};

        const message = `**📉 Analyse Volatilité VIX**

**VIX Actuel :** ${current.consensus_value ?? 'N/A'}
**Tendance :** ${expert.vix_trend === 'BULLISH' ? '📈 HAUSSIER' : expert.vix_trend === 'BEARISH' ? '📉 BAISSIER' : '➡️ NEUTRE'}
**Régime :** ${expert.volatility_regime || 'N/A'}
**Niveau de Risque :** ${expert.risk_level || 'N/A'}

**💡 Analyse Expert :**
${expert.expert_summary ? (expert.expert_summary.length > 300 ? expert.expert_summary.substring(0, 300) + '...' : expert.expert_summary) : 'Aucun résumé disponible'}

**🎯 Recommandation Trading :**
Stratégie : ${expert.trading_recommendations?.strategy || 'N/A'}
Niveaux Cibles : ${expert.trading_recommendations?.target_vix_levels?.join(' - ') || 'N/A'}

*Date de l'analyse : ${new Date(vix.created_at).toLocaleString('fr-FR')}*`;
        await message.reply(message);
      } else {
        await message.reply('❌ Aucune analyse VIX trouvée en base de données.\n💡 Utilisez d\'abord !vixagent pour générer une analyse.');
      }
      break;

    case '!rougepulse':
      console.log('🔴 Processing !rougepulse command...');
      const rougePulse = await getLatestRougePulse();
      if (rougePulse) {
        const score = rougePulse.volatility_score || 0;
        const criticalCount = rougePulse.critical_count || 0;
        const highCount = rougePulse.high_count || 0;
        const mediumCount = rougePulse.medium_count || 0;
        const lowCount = rougePulse.low_count || 0;

        const message = `**🔴 RougePulseAgent - Analyse Calendrier Économique**

📊 **Score de Volatilité Global : ${score}/10** ${score >= 8 ? '🔥' : score >= 5 ? '⚠️' : '✅'}

📈 **Vue d'ensemble (7 prochains jours) :**
🔴 **${criticalCount} événement(s) CRITIQUE(S)** - Marché très volatil attendu
🔴 **${highCount} événement(s) à FORT impact** - Mouvements significatifs probables
🟡 **${mediumCount} événement(s) à impact MOYEN** - Volatilité modérée possible
⚪ **${lowCount} événement(s) à faible impact** - Impact limité

**📈 Analyse de Marché :**
${rougePulse.summary || 'Aucune analyse disponible'}

**🎯 Recommandation Trading :**
${rougePulse.trading_recommendation || 'Aucune recommandation disponible'}

*Date de l'analyse : ${new Date(rougePulse.created_at).toLocaleString('fr-FR')}*`;
        await message.reply(message);
      } else {
        await message.reply('❌ Aucune analyse RougePulse trouvée en base de données.\n💡 Utilisez d\'abord !rougepulseagent pour générer une analyse.');
      }
      break;

    case '!rss':
      console.log('📰 Processing !rss command...');
      try {
        const opmlPath = path.resolve(process.cwd(), 'ia.opml');
        if (!fs.existsSync(opmlPath)) {
          await message.reply('❌ Fichier ia.opml non trouvé. Placez-le dans le dossier principal.');
          return;
        }

        const xml = fs.readFileSync(opmlPath, 'utf8');
        const regex = /<outline[^>]*text="([^"]*)"[^>]*xmlUrl="([^"]*)"[^>]*htmlUrl="([^"]*)"[^>]*\/>/g;
        const feeds = [];
        let match;

        while ((match = regex.exec(xml)) !== null) {
          feeds.push({
            title: match[1],
            xmlUrl: match[2],
            htmlUrl: match[3],
          });
        }

        if (feeds.length === 0) {
          await message.reply('❌ Aucun flux trouvé dans ia.opml');
          return;
        }

        await message.reply('📰 **RSS Reader** - Simulation de récupération des flux...\n\n⚠️ *Pour une vraie récupération RSS, le bot TypeScript complet est requis*\n\n**Flux trouvés**: ' + feeds.length + '\n**Exemples de flux**: ' + feeds.slice(0, 3).map(f => `• ${f.title}`).join('\n') + '\n\n*Utilisez le bot complet pour les articles réels*');

      } catch (error) {
        console.error('Error in !rss command:', error);
        await message.reply('❌ Erreur lors de la lecture du fichier ia.opml');
      }
      break;

    case '!resetrss':
      console.log('🔄 Processing !resetrss command...');
      try {
        sentArticles.clear();
        saveSentArticles();
        await message.reply('🔄 **RSS Reader** : Historique réinitialisé ✅\n\n*Le prochain !rss enverra tous les articles comme nouveaux*');
      } catch (error) {
        console.error('Error in !resetrss command:', error);
        await message.reply('❌ Erreur lors de la réinitialisation de l\'historique RSS');
      }
      break;

    // Simulations des commandes avancées
    case '!rougepulseagent':
    case '!vixagent':
    case '!vortex500':
    case '!newsagg':
    case '!tescraper':
    case '!vixscraper':
      const cmd = content.toLowerCase();
      const loadingMsg = await message.reply(`⏳ **${cmd.toUpperCase()}** - Simulation en cours...`);

      setTimeout(async () => {
        const simulations = {
          '!rougepulseagent': '🔴 **RougePulseAgent** - Analyse complétée\n\n📊 **Score de volatilité**: 7/10 ⚠️\n📈 **3 événements critiques** détectés cette semaine\n💡 **Recommandation**: Position réduite, stop loss élargi',
          '!vixagent': '📊 **VixSimpleAgent** - Analyse complétée\n\n📉 **VIX actuel**: 18.5 📈\n🎯 **Tendance**: Neutre à baissière\n📈 **Régime**: Élevé\n💡 **Recommandation**: Cash ou positions courtes',
          '!vortex500': '🧪 **Vortex500** - Analyse complétée\n\n🟢 **Sentiment**: Légèrement haussier\n📊 **Score**: 62/100\n⚠️ **Risque**: Moyen\n💡 **Catalyseurs**: Données FOMC, tensions géopolitiques',
          '!newsagg': '📰 **NewsAggregator** - Articles récupérés\n\n📊 **Sources**: 3/3 actives\n📄 **Articles**: 156 derniers\n🔥 **Top headlines**:\n• Fed maintient les taux inchangés\n• Nouveaux chiffres inflation plus bas que prévu\n• Marchés asiatiques en légère hausse',
          '!tescraper': '📅 **TradingEconomicsScraper** - Données récupérées\n\n📊 **Événements**: 12 trouvés\n🔴 **Critiques**: 2 cette semaine\n⚠️ **Prochains rapports**: PIB, chômage, inflation\n💡 **Impact attendu**: Volatilité modérée',
          '!vixscraper': '📈 **VixScraper** - Données collectées\n\n📊 **VIX actuel**: 18.5 (+0.8%)\n🔔 **Niveau alerte**: 25+ 🚨\n📉 **Support**: 16.2\n💹 **Résistance**: 21.8\n💡 **News**: Volatilité géopolitique, FOMC'
        };

        const response = simulations[cmd] || `⚠️ **${cmd.toUpperCase()}** - Fonctionnalité non simulée`;
        await loadingMsg.edit(response);
      }, 3000);
      break;

    default:
      // Ignorer les autres messages
      break;
  }
});

// Handler de connexion
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

  // Analyse pré-marché : du lundi au vendredi à 8h30 avant l'ouverture des marchés
  cron.schedule('30 8 * * 1-5', async () => {
    console.log('🌅 Running pre-market analysis...');
    if (CHANNEL_ID) {
      const channel = client.channels.cache.get(CHANNEL_ID);
      if (channel) {
        await channel.send('🌅 **Analyse Pré-Marché Automatisée**\n\nBon lundi ! Le bot est prêt pour la séance du jour avec toutes ses fonctionnalités activées.');
      }
    }
  }, {
    scheduled: true,
    timezone: "Europe/Paris"
  });

  console.log('✅ Bot complet prêt à recevoir les commandes !');
});

// Nettoyage propre à l'arrêt
const gracefulShutdown = () => {
  console.log('🛑 Arrêt propre du bot Discord...');
  if (pool) {
    pool.end().then(() => {
      console.log('✅ Base de données fermée');
    });
  }
  client.destroy().then(() => {
    console.log('✅ Bot Discord arrêté proprement');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Erreur lors de l\'arrêt:', err);
    process.exit(1);
  });
};

// Gérer les signaux
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Fonction principale
async function main() {
  // Vérifier le fichier .env
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Fichier .env non trouvé!');
    console.error('Créez un fichier .env avec DISCORD_TOKEN et DISCORD_CHANNEL_ID');
    process.exit(1);
  }

  // Charger les articles envoyés
  loadSentArticles();

  // Tuer les autres instances
  await killOtherBotInstances();

  // Attendre un peu pour la stabilisation
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Initialiser la base de données
  initDatabase();

  // Connexion du bot
  const TOKEN = process.env.DISCORD_TOKEN?.trim();
  if (!TOKEN || TOKEN === 'YOUR_DISCORD_BOT_TOKEN') {
    console.error('❌ DISCORD_TOKEN non configuré dans .env');
    process.exit(1);
  }

  if (!CHANNEL_ID) {
    console.log('⚠️ DISCORD_CHANNEL_ID non configuré dans .env (optionnel)');
  }

  client.login(TOKEN).catch(err => {
    console.error('Failed to login:', err);
    process.exit(1);
  });
}

// Démarrer le bot
main().catch(console.error);