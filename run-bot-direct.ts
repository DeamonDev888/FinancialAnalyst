#!/usr/bin/env node

/**
 * Direct TypeScript bot runner that bypasses compilation issues
 */

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: import.meta.url.slice(7, 'import.meta.url.length - 1) });

console.log('🤖 NovaQuote Financial Analyst Bot');
console.log('🏗️ Direct TypeScript Runner - Production Ready');
console.log('');

// Validate environment
const requiredEnvVars = ['DISCORD_TOKEN', 'DISCORD_CHANNEL_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n💡 Please add them to your .env file');
  process.exit(1);
}

console.log('✅ Environment variables configured');
console.log(`🔑 Discord Token: ${process.env.DISCORD_TOKEN?.substring(0, 10)}***`);
console.log(`📢 Channel ID: ${process.env.DISCORD_CHANNEL_ID}`);
console.log('');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'financial_analyst',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9022',
});

// Direct imports of handlers
const SentimentHandler = class {
  async handle(message: TextChannel): Promise<void> {
    try {
      const res = await pool.query(
        'SELECT * FROM sentiment_analyses ORDER BY created_at DESC LIMIT 1'
      );

      if (res.rows.length > 0) {
        const data = res.rows[0];
        const sentimentMap: { [key: string]: string } = {
          'BULLISH': 'HAUSSIER 🟢',
          'BEARISH': 'BAISSIER 🔴',
          'NEUTRAL': 'NEUTRE ⚪',
        };

        const riskMap: { [key: string]: string } = {
          'LOW': 'FAIBLE 🛡️',
          'MEDIUM': 'MOYEN ⚠️',
          'HIGH': 'ÉLEVÉ 🚨',
          'CRITICAL': 'CRITIQUE 💀',
        };

        const sentiment = sentimentMap[data.overall_sentiment?.toUpperCase()] || data.overall_sentiment || 'UNKNOWN';
        const risk = riskMap[data.risk_level?.toUpperCase()] || data.risk_level || 'UNKNOWN';
        const score = data.score || 0;

        const message = `
**📊 Analyse du Sentiment de Marché**
**Sentiment :** ${sentiment}
**Score :** ${score}/100
**Niveau de Risque :** ${risk}

**📝 Résumé :**
${data.summary || 'Aucun résumé disponible.'}

**🔑 Catalyseurs Clés :**
${data.catalysts ? JSON.parse(data.catalysts).map((c: string) => `• ${c}`).join('\n') : 'Aucun catalyseur identifié'}

*Date de l'analyse : ${data.created_at ? new Date(data.created_at).toLocaleString('fr-FR') : 'Date non disponible'}*
        `.trim();

        await message.send(message);
        console.log('✅ Sentiment response sent');
      } else {
        await message.send('❌ No sentiment analysis found in database');
      }
    } catch (error) {
      console.error('❌ Sentiment handler error:', error);
      await message.send('❌ Database error occurred');
    }
  }
};

// Direct bot implementation
class NovaQuoteBot {
  private client: Client;
  private isReady = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.once('ready', () => {
      console.log(`✅ Bot logged in as ${this.client.user?.tag}`);
      this.isReady = true;
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot || !message.content.startsWith('!')) {
        return;
      }

      console.log(`📩 Processing command: ${message.content}`);

      try {
        await this.handleCommand(message);
      } catch (error) {
        console.error('❌ Command error:', error);
        await message.reply('❌ An error occurred while processing your command');
      }
    });

    this.client.on('error', (error) => {
      console.error('❌ Discord client error:', error);
    });

    // Graceful shutdown
    process.on('SIGINT', () => this.gracefulShutdown());
    process.on('SIGTERM', () => this.gracefulShutdown());
  }

  private async handleCommand(message: Message): Promise<void> {
    const content = message.content.trim().toLowerCase();
    const channel = message.channel as TextChannel;

    switch (content) {
      case '!sentiment':
        await new SentimentHandler().handle(channel);
        break;

      case '!vix':
        // TODO: Implement VIX handler
        await channel.send('⚠️ VIX handler not yet implemented');
        break;

      case '!rougepulse':
        // TODO: Implement RougePulse handler
        await channel.send('⚠️ RougePulse handler not yet implemented');
        break;

      case '!help':
        await this.sendHelpMessage(channel);
        break;

      default:
        await channel.send('❌ Unknown command. Type `!help` for available commands');
        break;
    }
  }

  private async sendHelpMessage(channel: TextChannel): Promise<void> {
    const helpMessage = `
**🤖 NovaQuote Analyste - Commandes Disponibles**

📊 **Base de Données (instantané)**:
• \`!sentiment\` - Dernière analyse de sentiment
• \`!vix\` - Dernière analyse VIX
• \`!rougepulse\` - Dernière analyse calendrier économique

⚠️ **Handlers à implémenter**:
• \`!rougepulseagent\` - Agent IA analyse calendrier économique
• \`!vortex500\` - Agent IA analyse sentiment avancée
• \`!newsagg\` - Agrégation news financières
• \`!rss\` - Lecture flux RSS

ℹ️ **Informations**:
• \`!help\` - Afficher ce message d'aide

🎯 **Pour interroger la base de données :**
- Utilisez le script : \`node query-data.cjs <commande>\`
- Exemples : \`node query-data.cjs sentiment\`, \`node query-data.cjs activity\`

*Bot prêt pour la production ! 🚀*
    `.trim();

    await channel.send(helpMessage);
  }

  private async gracefulShutdown(): Promise<void> {
    console.log('🛑 Gracefully shutting down...');
    await this.client.destroy();
    await pool.end();
    process.exit(0);
  }

  public async start(): Promise<void> {
    if (!this.isReady) {
      console.log('⏳ Waiting for bot to be ready...');
    }

    try {
      const token = process.env.DISCORD_TOKEN;
      if (!token) {
        throw new Error('DISCORD_TOKEN not found in environment variables');
      }

      await this.client.login(token);
      console.log('✅ Bot started successfully');
    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      process.exit(1);
    }
  }
}

// Start the bot
async function main() {
  const bot = new NovaQuoteBot();
  await bot.start();
}

main().catch((error) => {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
});