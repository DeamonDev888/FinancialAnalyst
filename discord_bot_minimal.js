#!/usr/bin/env node

/**
 * Bot Discord Minimal - Version fonctionnelle
 * Tue les autres instances et fonctionne avec les commandes de base
 */

import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Tuer les autres instances du bot Discord avant de démarrer
async function killOtherBotInstances() {
  console.log('🔍 Recherche d\'autres instances du bot Discord...');

  try {
    const { exec } = await import('child_process');

    // Sur Windows, chercher les processus node.js qui contiennent "discord_bot" ou "discord"
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
          line.includes('index')
        )) {
          const parts = line.split(',');
          if (parts.length >= 2) {
            const pid = parseInt(parts[1]?.replace(/"/g, '').trim());

            if (pid && pid !== currentPid && !isNaN(pid)) {
              try {
                process.kill(pid);
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
      } else {
        console.log('✅ Aucune autre instance du bot trouvée');
      }
      console.log('🚀 Démarrage du bot Discord...');
    });
  } catch (error) {
    console.log('⚠️ Erreur lors de la recherche des autres instances:', error.message);
    console.log('🚀 Démarrage du bot Discord...');
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

let pool;

// Initialiser la base de données
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
**🤖 NovaQuote Analyste - Commandes**

📊 **Commandes d'Analyse (Base de données) :**
• \`!sentiment\` - Dernière analyse de sentiment enregistrée
• \`!vix\` - Dernière analyse VIX enregistrée
• \`!rougepulse\` - Dernière analyse calendrier économique

ℹ️ **Informations :**
• \`!status\` - État du bot et de la base de données
• \`!help\` - Afficher ce message d'aide

💡 **Note :** Ce bot utilise les données déjà enregistrées en base.

*Besoin d'aide ? Contactez l'administrateur !*
  `.trim();
}

function formatStatusMessage() {
  return `
**🤖 État du Bot NovaQuote**

📊 **Connexions :**
${pool ? '✅ Base de données connectée' : '❌ Base de données déconnectée'}

🔧 **Fonctionnalités actives :**
- ✅ Commandes de base
- ✅ Anti-doublon d'instances
- ✅ Gestion des erreurs

📈 **Statistiques :**
- PID: ${process.pid}
- Uptime: ${Math.floor(process.uptime())} secondes
- Mémoire: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB

*Bot corrigé par Deamon - 2024*
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

  const content = message.content.trim().toLowerCase();

  console.log(`📩 Message received: "${message.content}" from ${message.author.tag}`);

  switch (content) {
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
      if (!pool) {
        await message.reply('❌ Base de données non connectée');
        return;
      }
      const sentiment = await getLatestSentiment();
      if (sentiment) {
        const message = `**📊 Analyse du Sentiment de Marché**

**Score :** ${sentiment.score || 'N/A'}/100
**Sentiment :** ${sentiment.overall_sentiment || 'N/A'}
**Niveau de risque :** ${sentiment.risk_level || 'N/A'}

**📝 Résumé :**
${sentiment.summary || 'Aucun résumé disponible'}

*Date : ${new Date(sentiment.created_at).toLocaleString('fr-FR')}*`;

        await message.reply(message);
      } else {
        await message.reply('❌ Aucune analyse de sentiment trouvée en base de données.\n💡 Utilisez d\'abord les agents d\'analyse pour générer des données.');
      }
      break;

    case '!vix':
      console.log('🔍 Processing !vix command...');
      if (!pool) {
        await message.reply('❌ Base de données non connectée');
        return;
      }
      const vix = await getLatestVix();
      if (vix) {
        const analysisData = typeof vix.analysis_data === 'string' ? JSON.parse(vix.analysis_data) : vix.analysis_data;
        const message = `**📉 Analyse Volatilité VIX**

**VIX Actuel :** ${analysisData.current_vix_data?.consensus_value || 'N/A'}
**Tendance :** ${analysisData.expert_volatility_analysis?.vix_trend || 'N/A'}
**Régime :** ${analysisData.expert_volatility_analysis?.volatility_regime || 'N/A'}

**💡 Analyse Expert :**
${analysisData.expert_volatility_analysis?.expert_summary || 'Aucun résumé disponible'}

*Date : ${new Date(vix.created_at).toLocaleString('fr-FR')}*`;

        await message.reply(message);
      } else {
        await message.reply('❌ Aucune analyse VIX trouvée en base de données.\n💡 Utilisez d\'abord !vixagent pour générer des données.');
      }
      break;

    case '!rougepulse':
      console.log('🔴 Processing !rougepulse command...');
      if (!pool) {
        await message.reply('❌ Base de données non connectée');
        return;
      }
      const rougePulse = await getLatestRougePulse();
      if (rougePulse) {
        const message = `**🔴 RougePulseAgent - Analyse Calendrier Économique**

**Score de Volatilité :** ${rougePulse.volatility_score || 0}/10 ${rougePulse.volatility_score >= 7 ? '🔥' : rougePulse.volatility_score >= 5 ? '⚠️' : '✅'}

**📈 Analyse de Marché :**
${rougePulse.summary || 'Aucun résumé disponible'}

**📊 Statistiques :**
- Événements critiques : ${rougePulse.critical_count || 0}
- Événements fort impact : ${rougePulse.high_count || 0}
- Score total : ${rougePulse.volatility_score || 0}/10

*Date : ${new Date(rougePulse.created_at).toLocaleString('fr-FR')}*`;

        await message.reply(message);
      } else {
        await message.reply('❌ Aucune analyse RougePulse trouvée en base de données.\n💡 Utilisez d\'abord !rougepulseagent pour générer des données.');
      }
      break;

    default:
      // Ignorer les autres commandes
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
  console.log('✅ Bot prêt à recevoir les commandes !');
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