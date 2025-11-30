#!/usr/bin/env node

/**
 * Bot Discord Simple - Version corrigée
 * Utilise les fichiers JavaScript compilés
 */

import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Charger les modules nécessaires
import https from 'https';
import http from 'http';
import { parseString } from 'xml2js';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Tuer les autres instances du bot Discord avant de démarrer
async function killOtherBotInstances() {
  console.log('🔍 Recherche d autres instances du bot Discord...');

  try {
    const { exec } = require('child_process');

    // Sur Windows, chercher les processus node.js qui contiennent "discord_bot" ou "index.ts"
    exec('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /format:csv', (error, stdout) => {
      if (error) {
        console.log('⚠️ Impossible de lister les processus:', error.message);
        return;
      }

      const lines = stdout.split('\n').filter((line) =>
        line.includes('discord_bot') ||
        line.includes('index.ts') ||
        line.includes('bot')
      );

      let currentPid = process.pid;
      let killedCount = 0;

      lines.forEach((line) => {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const pid = parseInt(parts[1]);
          const commandLine = parts[0] || '';

          // Tuer les autres processus bot mais pas le processus actuel
          if (pid && pid !== currentPid && !isNaN(pid)) {
            try {
              process.kill(pid, 'SIGTERM');
              console.log(`🔫 Processus bot tué: PID ${pid}`);
              killedCount++;
            } catch (killError) {
              try {
                // Forcer sur Windows
                exec(`taskkill /F /PID ${pid}`, (killErr) => {
                  if (!killErr) {
                    console.log(`🔫 Processus bot forcé: PID ${pid}`);
                    killedCount++;
                  }
                });
              } catch (forceError) {
                console.log(`⚠️ Impossible de tuer le processus ${pid}:`, forceError.message);
              }
            }
          }
        }
      });

      if (killedCount > 0) {
        console.log(`✅ ${killedCount} autre(s) instance(s) du bot tuée(s)`);
        // Attendre un peu que les processus se terminent
        setTimeout(() => {
          console.log('🚀 Démarrage du bot Discord...');
        }, 2000);
      } else {
        console.log('✅ Aucune autre instance du bot trouvée');
        console.log('🚀 Démarrage du bot Discord...');
      }
    });
  } catch (error) {
    console.log('⚠️ Erreur lors de la recherche des autres instances:', error.message);
    console.log('🚀 Démarrage du bot Discord...');
  }
}

// Fonctions RSS
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

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'financial_analyst',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9022',
});

// Services de base de données
const rougePulseDb = new RougePulseDatabaseService();

// Fonctions de formatage simplifiées
function formatHelpMessage() {
  return `
**🤖 NovaQuote Analyste - Commandes**

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
• \`!help\` - Afficher ce message d'aide

*Besoin d'aide ? Contactez l'administrateur !*
  `.trim();
}

// Fonctions de base de données
async function getLatestSentiment() {
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
  try {
    const res = await pool.query(`SELECT * FROM vix_analyses ORDER BY created_at DESC LIMIT 1`);
    return res.rows[0];
  } catch (e) {
    console.error('Error fetching VIX:', e);
    return null;
  }
}

async function getLatestRougePulse() {
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

  switch (content.toLowerCase()) {
    case '!help':
      await message.reply(formatHelpMessage());
      break;

    case '!sentiment':
      console.log('🔍 Processing !sentiment command...');
      const sentiment = await getLatestSentiment();
      if (sentiment) {
        await message.reply(`**📊 Analyse du Sentiment de Marché**\n\n**Score :** ${sentiment.score}/100\n**Sentiment :** ${sentiment.overall_sentiment || 'N/A'}\n**Résumé :** ${sentiment.summary || 'Aucun résumé disponible'}\n\n*Date : ${new Date(sentiment.created_at).toLocaleString('fr-FR')}*`);
      } else {
        await message.reply('❌ Aucune analyse de sentiment trouvée en base de données.');
      }
      break;

    case '!vix':
      console.log('🔍 Processing !vix command...');
      const vix = await getLatestVix();
      if (vix) {
        await message.reply(`**📉 Analyse Volatilité VIX**\n\n**VIX Actuel :** ${vix.current_vix || 'N/A'}\n**Tendance :** ${vix.vix_trend || 'N/A'}\n**Résumé :** ${vix.summary || 'Aucun résumé disponible'}\n\n*Date : ${new Date(vix.created_at).toLocaleString('fr-FR')}*`);
      } else {
        await message.reply('❌ Aucune analyse VIX trouvée en base de données.');
      }
      break;

    case '!rougepulse':
      console.log('🔴 Processing !rougepulse command...');
      const rougePulse = await getLatestRougePulse();
      if (rougePulse) {
        await message.reply(`**🔴 RougePulseAgent - Analyse Calendrier Économique**\n\n**Score de Volatilité :** ${rougePulse.volatility_score || 0}/10\n**Résumé :** ${rougePulse.summary || 'Aucun résumé disponible'}\n\n*Date : ${new Date(rougePulse.created_at).toLocaleString('fr-FR')}*`);
      } else {
        await message.reply('❌ Aucune analyse RougePulse trouvée en base de données.');
      }
      break;

    default:
      // Commandes avancées (agents IA) - implémentation simplifiée
      if (['!rougepulseagent', '!vixagent', '!vortex500', '!newsagg', '!tescraper', '!vixscraper'].includes(content.toLowerCase())) {
        await message.reply(`⚠️ Cette commande nécessite une compilation TypeScript complète. Utilisez \`pnpm run build\` puis relancez le bot.`);
      }
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
});

// Nettoyage propre à l'arrêt
const gracefulShutdown = () => {
  console.log('🛑 Arrêt propre du bot Discord...');
  client.destroy().then(() => {
    console.log('✅ Bot Discord arrêté proprement');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Erreur lors de l arrêt:', err);
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
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Connexion du bot
  const TOKEN = process.env.DISCORD_TOKEN?.trim() || 'YOUR_DISCORD_BOT_TOKEN';
  if (TOKEN === 'YOUR_DISCORD_BOT_TOKEN') {
    console.error('❌ DISCORD_TOKEN non configuré dans .env');
    process.exit(1);
  }

  client.login(TOKEN).catch(err => {
    console.error('Failed to login:', err);
    process.exit(1);
  });
}

// Démarrer le bot
main().catch(console.error);