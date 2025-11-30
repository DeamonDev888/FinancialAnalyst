#!/usr/bin/env node

/**
 * Ultra-simple Discord bot - All code inline, no imports
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { Client, GatewayIntentBits } = require('discord.js');
const { Pool } = require('pg');

console.log('🤖 NovaQuote Financial Analyst - Ultra Simple Bot');

// Configuration
const BOT_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'financial_analyst',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9022',
};

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log('❌ Missing DISCORD_TOKEN or DISCORD_CHANNEL_ID');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

let pool;

client.once('ready', async () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);

  // Connect to database
  try {
    pool = new Pool(DB_CONFIG);
    await pool.connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  console.log(`📩 Command: ${message.content}`);

  const content = message.content.trim().toLowerCase();
  const channel = message.channel;

  try {
    switch (content) {
      case '!sentiment':
        const res = await pool.query('SELECT * FROM sentiment_analyses ORDER BY created_at DESC LIMIT 1');
        if (res.rows.length > 0) {
          const data = res.rows[0];
          await message.reply(`**📊 Analyse du Sentiment**
**Score :** ${data.score}/100
**Sentiment :** ${data.overall_sentiment || 'N/A'}
**Risque :** ${data.risk_level || 'N/A'}
**Date :** ${new Date(data.created_at).toLocaleString('fr-FR')}

**📝 Résumé :** ${data.summary || 'Aucun résumé'}`);
        } else {
          await message.reply('❌ No sentiment analysis found');
        }
        break;

      case '!vix':
        const res = await pool.query('SELECT * FROM vix_analyses ORDER BY created_at DESC LIMIT 1');
        if (res.rows.length > 0) {
          const data = res.rows[0];
          const expertData = JSON.parse(data.analysis_data || '{}');
          await message.reply(`**📉 Analyse VIX**
**VIX Actuel :** ${expertData.current_vix_data?.consensus_value || 'N/A'}
**Tendance :** ${expertData.expert_volatility_analysis?.vix_trend || 'N/A'}
**Régime :** ${expertData.expert_volatility_analysis?.volatility_regime || 'N/A'}

**📝 Résumé Expert :** ${expertData.expert_volatility_analysis?.expert_summary || 'N/A'}

**Date :** ${new Date(data.created_at).toLocaleString('fr-FR')}`);
        } else {
          await message.reply('❌ No VIX analysis found');
        }
        break;

      case '!rougepulse':
        const res = await pool.query('SELECT * FROM rouge_pulse_analyses ORDER BY created_at DESC LIMIT 1');
        if (res.rows.length > 0) {
          const data = res.rows[0];
          await message.reply(`**🔴 RougePulse Calendrier Économique**
**Score Volatilité :** ${data.volatility_score}/10
**Événements Critiques :** ${data.critical_count || 0}
**Événements Haut Impact :** ${data.high_count || 0}
**Résumé :** ${data.summary?.substring(0, 200) || 'Aucun résumé'}...

**Date :** ${new Date(data.created_at).toLocaleString('fr-FR')}`);
        } else {
          await message.reply('❌ No RougePulse analysis found');
        }
        break;

      case '!help':
        await message.reply(`**🤖 NovaQuote Analyste - Commandes**

📊 **Base de Données :**
• \`!sentiment\` - Dernière analyse de sentiment
• \`!vix\` - Dernière analyse VIX
• \`!rougepulse\` - Dernière analyse calendrier économique

ℹ️ **État Actuel :**
✅ Base de données : Connectée et fonctionnelle
✅ Bot Discord : Configuré et prêt

🎯 **Utilisation :**
Le bot est prêt pour recevoir vos commandes !
        `);
        break;

      default:
        await message.reply(`❌ Commande inconnue. Tapez \`!help\` pour voir les commandes disponibles.`);
        break;
    }
  } catch (error) {
    console.error('❌ Command error:', error);
    await message.reply('❌ Erreur lors du traitement de la commande');
  }
});

client.on('error', (error) => {
  console.error('❌ Discord error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Graceful shutdown...');
  if (pool) await pool.end();
  await client.destroy();
  process.exit(0);
});

client.login(BOT_TOKEN).catch(error => {
  console.error('❌ Login failed:', error);
  process.exit(1);
});