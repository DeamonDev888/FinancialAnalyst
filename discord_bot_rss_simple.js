#!/usr/bin/env node

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { parseOpml } = require('./dist/backend/ingestion/opml_parser.js');
const https = require('https');
const http = require('http');
const { parseString } = require('xml2js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '';
const APPLICATION_ID = '1442309135646331001';

// Système de suivi des articles déjà envoyés
const sentArticles = new Set();
const MAX_SENT_ARTICLES = 1000;

// Charge les articles précédemment envoyés depuis le stockage local
function loadSentArticles() {
    try {
        const dataFile = require('path').resolve(process.cwd(), 'data', 'sent_articles.json');

        if (fs.existsSync(dataFile)) {
                const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
                data.forEach(articleId => sentArticles.add(articleId));
                console.log(`📚 ${sentArticles.size} articles précédemment envoyés chargés`);
        }
    } catch (error) {
        console.log('ℹ️ Aucun historique d\'articles trouvé, démarrage avec une liste vide');
    }
}

// Sauvegarde les articles envoyés
function saveSentArticles() {
    try {
        const dataFile = require('path').resolve(process.cwd(), 'data', 'sent_articles.json');

        // Crée le dossier data s'il n'existe pas
        const dataDir = require('path').dirname(dataFile);
        if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
        }

        const articlesArray = Array.from(sentArticles);
        fs.writeFileSync(dataFile, JSON.stringify(articlesArray, null, 2));
        console.log(`💾 ${articlesArray.length} articles sauvegardés`);
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des articles:', error);
    }
}

// Génère un ID unique pour un article
function getArticleId(title, link, pubDate) {
    const cleanTitle = (title || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanLink = (link || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `${cleanTitle}_${cleanLink}_${pubDate}`;
}

// Vérifie si un article est nouveau
function isArticleNew(title, link, pubDate) {
    const articleId = getArticleId(title, link, pubDate);
    return !sentArticles.has(articleId);
}

// Marque un article comme envoyé
function markArticleAsSent(title, link, pubDate) {
    const articleId = getArticleId(title, link, pubDate);
    sentArticles.add(articleId);

    // Limite la taille du Set
    if (sentArticles.size > MAX_SENT_ARTICLES) {
        const articlesArray = Array.from(sentArticles);
        const toKeep = articlesArray.slice(-MAX_SENT_ARTICLES);
        sentArticles.clear();
        toKeep.forEach(id => sentArticles.add(id));
    }

    saveSentArticles();
}

// Fonction RSS simple
function fetchRssFeed(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
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
        }).on('error', (err) => {
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
            const description = item.description?.[0] || item.summary?.[0] || 'Description non disponible';
            const pubDate = item.pubDate?.[0] || item.published?.[0] || 'Date non disponible';
            return {
                title,
                link,
                description: description.length > 150 ? description.substring(0, 150) + '...' : description,
                pubDate: new Date(pubDate).toLocaleDateString('fr-FR'),
                isNew: true
            };
        });
    }
    catch (error) {
        console.error('Error extracting RSS items:', error);
        return [];
    }
}

async function getLatestFeedsFromOpml(opmlPath, maxFeeds = 8) {
    try {
        const feeds = parseOpml(opmlPath);
        const results = [];
        let totalNewArticles = 0;

        // Prendre un échantillon aléatoire de flux pour éviter la surcharge
        const shuffledFeeds = feeds.sort(() => 0.5 - Math.random());
        const selectedFeeds = shuffledFeeds.slice(0, maxFeeds);

        for (const feed of selectedFeeds) {
            try {
                console.log(`🔄 Récupération du flux: ${feed.title}`);
                const rssData = await fetchRssFeed(feed.xmlUrl);
                const newItems = extractRssItems(rssData, 2);

                if (newItems.length > 0) {
                    results.push({
                        title: feed.title,
                        items: newItems,
                        htmlUrl: feed.htmlUrl,
                        newItemsCount: newItems.length
                    });

                    totalNewArticles += newItems.length;

                    // Marquer tous les nouveaux articles comme envoyés
                    newItems.forEach(item => {
                        markArticleAsSent(item.title, item.link, item.pubDate);
                    });
                }

                // Petit délai pour éviter de surcharger les serveurs
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            catch (error) {
                console.error(`❌ Erreur pour ${feed.title}:`, error.message);
            }
        }

        console.log(`✅ ${totalNewArticles} nouveaux articles trouvés sur ${results.length} flux analysés`);
        return results;
    }
    catch (error) {
        console.error('❌ Erreur lors de la lecture du fichier OPML:', error);
        return [];
    }
}

function formatHelpMessage() {
    return `
**🤖 NovaQuote Analyste - Commandes RSS**

📰 **Commandes RSS :**
• \`!rss\` - Afficher les NOUVEAUX articles des experts IA depuis ia.opml (~45s)
• \`!resetrss\` - Réinitialiser l'historique des articles envoyés

ℹ️ **Informations :**
• \`!help\` - Afficher ce message d'aide

⏰ **Fonctionnalités Automatiques :**
• Suivi des articles envoyés pour éviter les doublons
• Filtre temporel : uniquement les articles des 24 dernières heures

💡 **Information :**
Le bot RSS fournit les derniers articles des experts en IA depuis votre fichier ia.opml, en évitant les doublons et en ne montrant que les nouveautés.

🎯 **Conseils :**
- Utilisez !rss pour voir les nouveaux articles uniquement
- Utilisez !resetrss pour réinitialiser l'historique
- Les articles sont sauvegardés dans data/sent_articles.json

*Besoin d'aide ? Contactez l'administrateur !*
  `.trim();
}

client.once('ready', () => {
    const asciiArt = `
   _______
  /       \\
 /  🤖 BOT  \\
| FINANCIAL |
 \ ANALYST /
  \_______/
  `;
    console.log(asciiArt);
    console.log(`🤖 Discord Bot logged in as ${client.user?.tag}`);
    console.log(`🔗 Lien d'invitation: https://discord.com/api/oauth2/authorize?client_id=${APPLICATION_ID}&permissions=84992&scope=bot`);

    // Charger les articles précédemment envoyés au démarrage
    loadSentArticles();
});

client.on('messageCreate', async (message) => {
    console.log(`📩 Message received: "${message.content}" from ${message.author.tag} in ${message.channelId}`);
    if (message.author.bot) return;

    if (message.content.trim().toLowerCase() === '!rss') {
        console.log('📰 Processing !rss command...');
        const loadingMsg = await message.reply('📰 **RSS Reader** recherche les NOUVEAUX articles depuis les flux IA... ⏳');

        try {
            const opmlPath = require('path').resolve(process.cwd(), 'ia.opml');
            const feeds = await getLatestFeedsFromOpml(opmlPath, 8);

            if (feeds.length === 0) {
                await loadingMsg.edit('ℹ️ **RSS Reader**: Aucun nouvel article trouvé depuis les dernières 24 heures.\n\n📋 *Essayez plus tard ou utilisez !resetrss pour forcer la relecture.*');
                return;
            }

            const totalNewArticles = feeds.reduce((sum, feed) => sum + feed.newItemsCount, 0);
            let mainMessage = `**📰 RSS IA - NOUVEAUX Articles des Experts**\n\n`;
            mainMessage += `🆕 **Articles récents**: ${totalNewArticles} (dernières 24h)\n`;
            mainMessage += `📊 **Flux analysés**: ${feeds.length}\n\n`;

            const allNewItems = feeds.flatMap(feed =>
                feed.items.map(item => ({
                    ...item,
                    source: feed.title
                }))
            ).slice(0, 8);

            if (allNewItems.length > 0) {
                mainMessage += `**🆕 Nouveaux Articles (${allNewItems.length}):**\n\n`;
                allNewItems.forEach((item, index) => {
                    mainMessage += `**${index + 1}. ${item.title}** 🆕\n`;
                    mainMessage += `📅 ${item.pubDate} | 📰 ${item.source}\n`;
                    mainMessage += `📝 ${item.description}\n`;
                    mainMessage += `🔗 ${item.link}\n\n`;
                });
            }

            mainMessage += `*Uniquement les nouveaux articles depuis ia.opml (dernières 24h)*`;

            await loadingMsg.edit(mainMessage);

        } catch (error) {
            console.error('❌ Error in !rss command:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            await loadingMsg.edit(`❌ **RSS Reader**: Erreur lors de la récupération des flux\n\n${errorMessage.substring(0, 200)}`);
        }
    }

    if (message.content.trim().toLowerCase() === '!resetrss') {
        console.log('🔄 Processing !resetrss command...');
        try {
            sentArticles.clear();
            saveSentArticles();
            await message.reply('🔄 **RSS Reader**: Historique réinitialisé ✅\n\n*Le prochain !rss enverra tous les articles comme nouveaux*');
        } catch (error) {
            console.error('❌ Error in !resetrss command:', error);
            await message.reply('❌ Erreur lors de la réinitialisation de l\'historique RSS');
        }
    }

    if (message.content.trim() === '!help') {
        console.log('📖 Processing !help command...');
        await message.reply(formatHelpMessage());
    }
});

const TOKEN = process.env.DISCORD_TOKEN?.trim() || 'YOUR_DISCORD_BOT_TOKEN';
client.login(TOKEN).catch(err => {
    console.error('Failed to login:', err);
});