#!/usr/bin/env node

/**
 * Bot Discord TypeScript Complet - Vraie récupération RSS
 * Version hybride TypeScript/JavaScript pour contourner les problèmes d'imports
 */

import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as cron from 'node-cron';
import * as path from 'path';

// Charger les modules requis
const fs = require('fs');
const https = require('https');
const http = require('http');
const { parseString } = require('xml2js');

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
          console.log('🚀 Démarrage du bot Discord TypeScript...');
        }, 3000);
      } else {
        console.log('✅ Aucune autre instance du bot trouvée');
        console.log('🚀 Démarrage du bot Discord TypeScript...');
      }
    });
  } catch (error) {
    console.log('⚠️ Erreur lors de la recherche des autres instances:', error.message);
    console.log('🚀 Démarrage du bot Discord TypeScript...');
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

// RSS Functions - Version vraie avec TypeScript
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

// Importer les modules requis au début
const https = require('https');
const http = require('http');
const { parseString } = require('xml2js');

// Vraie fonction de récupération RSS
async function fetchRssFeed(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol
      .get(url, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          parseString(data, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .on('error', err => {
        reject(err);
      });
  });
}

function extractRssItems(rssData, maxItems = 5) {
  try {
    const items = rssData.rss?.channel?.[0]?.item || rssData.feed?.entry || [];
    return items.slice(0, maxItems).map(item => {
      const title = item.title?.[0] || item.title || 'Titre non disponible';
      const link = item.link?.[0]?._?.href || item.link?.[0] || 'Lien non disponible';
      const description =
        item.description?.[0] || item.summary?.[0] || 'Description non disponible';
      const pubDate = item.pubDate?.[0] || item.published?.[0] || 'Date non disponible';
      return {
        title,
        link,
        description: description.length > 150 ? description.substring(0, 150) + '...' : description,
        pubDate: new Date(pubDate).toLocaleDateString('fr-FR'),
      };
    });
  } catch (error) {
    console.error('Error extracting RSS items:', error);
    return [];
  }
}

// Vraie fonction de récupération depuis OPML
async function getLatestFeedsFromOpml(opmlPath, maxFeeds = 8) {
  try {
    // Vérifier plusieurs chemins possibles pour ia.opml
    const possiblePaths = [
      opmlPath,
      path.join(process.cwd(), 'ia.opml'),
      path.join(process.cwd(), 'mes-comptes-x.opml'),
      path.join(process.cwd(), 'mes-comptes-x.opml'),
      path.join(process.cwd(), ' ListeXtofollow.md.opml')
    ];

    let actualPath = null;
    for (const testPath of possiblePaths) {
      console.log(`🔍 Vérification du fichier: ${testPath}`);
      if (fs.existsSync(testPath)) {
        actualPath = testPath;
        console.log(`✅ Fichier OPML trouvé: ${actualPath}`);
        break;
      }
    }

    if (!actualPath) {
      const errorMsg = `Aucun fichier OPML trouvé dans les chemins testés:\n${possiblePaths.map(p => `- ${p}`).join('\n')}`;
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const xml = fs.readFileSync(actualPath, 'utf8');

    const opmlData = fs.readFileSync(actualPath, 'utf8');
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
      throw new Error('Aucun flux RSS trouvé dans le fichier OPML');
    }

    const results = [];
    let totalNewArticles = 0;

    // Prendre un échantillon aléatoire de flux pour éviter la surcharge
    const shuffledFeeds = feeds.sort(() => 0.5 - Math.random());
    const selectedFeeds = shuffledFeeds.slice(0, maxFeeds);

    for (const feed of selectedFeeds) {
      try {
        console.log(`🔄 Récupération du flux: ${feed.title}`);
        const rssData = await fetchRssFeed(feed.xmlUrl);
        const items = extractRssItems(rssData, 2);

        const newItems = items.filter(item => isArticleNew(item.title, item.link, item.pubDate));

        if (newItems.length > 0) {
          results.push({
            title: feed.title,
            items: newItems,
            htmlUrl: feed.htmlUrl,
            newItemsCount: newItems.length,
          });

          totalNewArticles += newItems.length;

          // Marquer tous les nouveaux articles comme envoyés
          newItems.forEach(item => {
            markArticleAsSent(item.title, item.link, item.pubDate);
          });
        }

        // Petit délai pour éviter de surcharger les serveurs
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Erreur pour ${feed.title}:`, error.message);
      }
    }

    console.log(
      `✅ ${totalNewArticles} nouveaux articles trouvés sur ${results.length} flux analysés`
    );
    return results;
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du fichier OPML:', error);
    return [];
  }
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
**🤖 NovaQuote Analyste TypeScript - Commandes Complètes**

📰 **Commandes RSS (RÉELLES) :**
• \`!rss\` - Afficher les VRAIS articles des experts IA depuis ia.opml (~45s)
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

⚡ **Note importante :**
- ✅ **RSS RÉEL** : Vraie récupération depuis ia.opml
- ✅ **Anti-doublon** : Articles uniques sauvegardés
- ✅ **TypeScript** : Version corrigée et optimisée

*Besoin d'aide ? Contactez l'administrateur !*
  `.trim();
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

    case '!rss':
      console.log('📰 Processing !rss command - VRAIE RÉCUPÉRATION...');
      try {
        const loadingMsg = await message.reply('📰 **RSS Reader** - Récupération des vrais articles depuis ia.opml... ⏳');

        const opmlPath = path.resolve(process.cwd(), 'ia.opml');
        const feeds = await getLatestFeedsFromOpml(opmlPath, 8);

        if (feeds.length === 0) {
          await loadingMsg.edit('❌ **RSS Reader**: Aucun flux trouvé dans ia.opml\n\n💡 *Vérifiez que le fichier ia.opml existe dans le dossier principal*');
          return;
        }

        // Créer un message principal
        const totalArticles = feeds.reduce((sum, feed) => sum + feed.items.length, 0);
        let rssMessage = `**📰 RSS Reader - Vrais Articles des Experts IA**\n\n`;
        rssMessage += `📊 **Flux analysés**: ${feeds.length}\n`;
        rssMessage += `📄 **Nouveaux articles trouvés**: ${totalArticles}\n\n`;

        // Ajouter quelques articles en vedette
        const allItems = feeds
          .flatMap(feed =>
            feed.items.map(item => ({
              ...item,
              source: feed.title,
            }))
          )
          .slice(0, 10); // Top 10 articles

        if (allItems.length > 0) {
          rssMessage += `**🌟 Articles Récents :**\n\n`;
          allItems.forEach((item, index) => {
            rssMessage += `**${index + 1}. ${item.title}**\n`;
            rssMessage += `📅 ${item.pubDate}\n`;
            rssMessage += `📝 ${item.description}\n`;
            rssMessage += `🔗 ${item.link}\n\n`;
          });
        }

        rssMessage += `*Articles réels récupérés depuis ia.opml*`;
        rssMessage += `\n*${totalArticles} nouveaux articles sauvegardés*`;

        await loadingMsg.edit(rssMessage);
      } catch (error) {
        console.error('Error in !rss command:', error);
        await message.reply(`❌ **RSS Reader**: Erreur lors de la récupération des flux\n\n${error.message.substring(0, 200)}...`);
      }
      break;

    case '!resetrss':
      console.log('🔄 Processing !resetrss command...');
      try {
        sentArticles.clear();
        saveSentArticles();
        await message.reply('🔄 **RSS Reader**: Historique réinitialisé ✅\n\n*Le prochain !rss enverra tous les articles comme nouveaux*');
      } catch (error) {
        console.error('Error in !resetrss command:', error);
        await message.reply('❌ Erreur lors de la réinitialisation de l\'historique RSS');
      }
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
  console.log(`🤖 Discord Bot TypeScript logged in as ${client.user?.tag}`);
  console.log(`🔗 Lien d'invitation: https://discord.com/api/oauth2/authorize?client_id=${APPLICATION_ID}&permissions=84992&scope=bot`);
  console.log('✅ Bot TypeScript avec RSS RÉEL prêt à recevoir les commandes !');
});

// Nettoyage propre à l'arrêt
const gracefulShutdown = () => {
  console.log('🛑 Arrêt propre du bot Discord TypeScript...');
  if (pool) {
    pool.end().then(() => {
      console.log('✅ Base de données fermée');
    });
  }
  client.destroy().then(() => {
    console.log('✅ Bot TypeScript arrêté proprement');
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
  await new Promise(resolve => setTimeout(resolve, 3000));

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