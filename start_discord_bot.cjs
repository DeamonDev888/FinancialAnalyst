#!/usr/bin/env node

// Charger l'environnement D'ABORD
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage du Bot NovaQuote avec commandes...');
// Définir la fonction help AVANT de l'utiliser
function formatHelpMessage() {
  return `
**🤖 NovaQuote Financial Analyst - Commandes**

📊 **Commandes de Base :**
• \`!ping\` - Tester la connexion du bot
• \`!help\` - Afficher ce message d'aide

🚀 **Agents IA (Lancer des analyses) :**
• \`!run-rougepulse\` - Lancer l'analyse du calendrier économique
• \`!run-vixsimple\` - Lancer l'analyse VIX/VVIX
• \`!run-vortex500\` - Lancer l'analyse de sentiment de marché

📡 **Scrapers (Récupérer des données) :**
• \`!run-tradingeconomics\` - Scraper le calendrier économique US
• \`!run-newsaggregator\` - Agréger les news financières
• \`!run-vixplaywright\` - Scraper les données VIX en temps réel

⚡ **Fonctionnalités :**
• Les scripts sont exécutés directement avec ts-node
• Les opérations longues affichent un avertissement
• Les résultats sont sauvegardés automatiquement

💡 **Information :**
Ce bot exécute directement les fichiers TypeScript de votre projet.
Les commandes fonctionnent même après refactorisation des scripts.

*Pour de l'aide supplémentaire, contactez l'administrateur !*
  `.trim();
}

console.log('🔍 Variables d\'environnement chargées');
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅ Présent' : '❌ Manquant');
console.log('DISCORD_CHANNEL_ID:', process.env.DISCORD_CHANNEL_ID ? '✅ Présent' : '❌ Manquant');
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN non trouvé dans l\'environnement');
  console.error('💡 Vérifiez que le fichier .env contient bien la variable DISCORD_TOKEN');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

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
  console.log(`🤖 Bot NovaQuote connecté en tant que: ${client.user?.tag}`);
  console.log('📋 Commandes disponibles:');
  console.log('  • !ping - Test de connexion');
  console.log('  • !help - Afficher l\'aide');
  console.log('  • !run-rougepulse - Lancer RougePulseAgent');
  console.log('  • !run-vixsimple - Lancer VixSimpleAgent');
  console.log('  • !run-vortex500 - Lancer Vortex500Agent');
  console.log('  • !run-tradingeconomics - Lancer TradingEconomicsScraper');
  console.log('  • !run-newsaggregator - Lancer NewsAggregator');
  console.log('  • !run-vixplaywright - Lancer VixPlaywrightScraper');
  console.log('');
  console.log('✅ Bot prêt à recevoir des commandes sur Discord!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  console.log(`📩 Message reçu: "${message.content}" de ${message.author.tag}`);

  // Commande PING
  if (message.content.trim().toLowerCase() === '!ping') {
    await message.reply('🏓 Pong!');
    return;
  }

  // Commande HELP
  if (message.content.trim().toLowerCase() === '!help') {
    await message.reply(formatHelpMessage());
    return;
  }

  // ===== COMMANDES POUR LANCER LES SCRIPTS =====

  const commands = [
    {
      trigger: '!run-rougepulse',
      name: 'RougePulseAgent',
      file: 'src/backend/agents/RougePulseAgent.ts',
      description: 'Analyse du calendrier économique',
      emoji: '🔴'
    },
    {
      trigger: '!run-vixsimple',
      name: 'VixSimpleAgent',
      file: 'src/backend/agents/VixSimpleAgent.ts',
      description: 'Analyse VIX/VVIX',
      emoji: '📈'
    },
    {
      trigger: '!run-vortex500',
      name: 'Vortex500Agent',
      file: 'src/backend/agents/Vortex500Agent.ts',
      description: 'Analyse de sentiment de marché',
      emoji: '🧪'
    },
    {
      trigger: '!run-tradingeconomics',
      name: 'TradingEconomicsScraper',
      file: 'src/backend/ingestion/TradingEconomicsScraper.ts',
      description: 'Scraping calendrier économique US',
      emoji: '📊'
    },
    {
      trigger: '!run-newsaggregator',
      name: 'NewsAggregator',
      file: 'src/backend/ingestion/NewsAggregator.ts',
      description: 'Agrégation de news financières',
      emoji: '📰',
      long: true
    },
    {
      trigger: '!run-vixplaywright',
      name: 'VixPlaywrightScraper',
      file: 'src/backend/ingestion/VixPlaywrightScraper.ts',
      description: 'Scraping VIX en temps réel',
      emoji: '🎭'
    }
  ];

  for (const cmd of commands) {
    if (message.content.trim().toLowerCase() === cmd.trigger) {
      console.log(`${cmd.emoji} Lancement de ${cmd.name}...`);

      const longMessage = cmd.long ?
        `🔄 ${cmd.description} en cours...\\n\\n⏳ *Cette opération peut prendre plusieurs minutes*` :
        `🔄 Lancement de ${cmd.description}...`;

      await message.reply(`${cmd.emoji} ${longMessage}`);

      try {
        const startTime = Date.now();

        // Préparation du message de progression
        let progressMessage = await message.reply(
          `${cmd.emoji} **${cmd.name} en cours d\'exécution...**\\n\\n⏳ Démarrage - Veuillez patienter...`
        );

        // Configuration de la commande
        const command = `npx ts-node --transpile-only "${cmd.file}"`;

        console.log(`🚀 Exécution: ${command}`);

        // Exécution avec timeout et capture de sortie
        const result = execSync(command, {
          encoding: 'utf8',
          cwd: process.cwd(),
          timeout: cmd.long ? 300000 : 120000, // 5 min pour long, 2 min pour normal
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });

        const duration = Math.round((Date.now() - startTime) / 1000);

        // Message de succès
        await progressMessage.edit(
          `${cmd.emoji} **✅ ${cmd.name} terminé avec succès**\\n\\n` +
          `**Durée:** ${duration}s\\n` +
          `**Fichier:** ${cmd.file}\\n` +
          `**Status:** Exécution complétée\\n\\n` +
          `*Résultats sauvegardés dans la base de données*`
        );

        console.log(`✅ ${cmd.name} terminé en ${duration}s`);

      } catch (error) {
        const duration = Math.round((Date.now() - startTime) / 1000);

        console.error(`❌ Erreur ${cmd.name}:`, error.message || error);

        // Message d'erreur détaillé
        await message.reply(
          `${cmd.emoji} **❌ Erreur lors de l'exécution de ${cmd.name}**\\n\\n` +
          `**Durée:** ${duration}s\\n` +
          `**Fichier:** ${cmd.file}\\n` +
          `**Erreur:** ${error.message || 'Erreur inconnue'}\\n\\n` +
          `*Vérifiez les logs pour plus de détails*`
        );
      }

      return;
    }
  }
});

function formatHelpMessage() {
  return `
**🤖 NovaQuote Financial Analyst - Commandes**

📊 **Commandes de Base :**
• \`!ping\` - Tester la connexion du bot
• \`!help\` - Afficher ce message d'aide

🚀 **Agents IA (Lancer des analyses) :**
• \`!run-rougepulse\` - Lancer l'analyse du calendrier économique
• \`!run-vixsimple\` - Lancer l'analyse VIX/VVIX
• \`!run-vortex500\` - Lancer l'analyse de sentiment de marché

📡 **Scrapers (Récupérer des données) :**
• \`!run-tradingeconomics\` - Scraper le calendrier économique US
• \`!run-newsaggregator\` - Agréger les news financières
• \`!run-vixplaywright\` - Scraper les données VIX en temps réel

⚡ **Fonctionnalités :**
• Les scripts sont exécutés directement avec ts-node
• Les opérations longues affichent un avertissement
• Les résultats sont sauvegardés automatiquement

💡 **Information :**
Ce bot exécute directement les fichiers TypeScript de votre projet.
Les commandes fonctionnent même après refactorisation des scripts.

*Pour de l'aide supplémentaire, contactez l'administrateur !*
  `.trim();
}

// Gestion des erreurs
client.on('error', (error) => {
  console.error('❌ Erreur Discord:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Rejection non gérée:', error);
});

process.on('SIGINT', () => {
  console.log('🛑 Arrêt du bot...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du bot...');
  client.destroy();
  process.exit(0);
});

// Connexion
const token = process.env.DISCORD_TOKEN;
console.log('🔗 Connexion à Discord...');
client.login(token);