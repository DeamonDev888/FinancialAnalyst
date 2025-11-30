#!/usr/bin/env node

require('dotenv').config();

console.log('🚀 Démarrage du Bot NovaQuote Final Corrigé...');

const { Client, GatewayIntentBits } = require('discord.js');
const { execSync } = require('child_process');
const path = require('path');

// Vérification des variables d'environnement
console.log('🔍 Variables d\'environnement:');
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅ Présent' : '❌ Manquant');
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
  console.log('  • !help - Afficher ce message d\'aide');
  console.log('  • !run-rougepulse - Lancer RougePulseAgent');
  console.log('  • !run-vixsimple - Lancer VixSimpleAgent');
  console.log('  • !run-vortex500 - Lancer Vortex500Agent');
  console.log('  • !run-tradingeconomics - Lancer TradingEconomicsScraper');
  console.log('  • !run-newsaggregator - Lancer NewsAggregator');
  console.log('  • !run-vixplaywright - Lancer VixPlaywrightScraper');
  console.log('  • !kill-bots - Arrêter tous les bots');
  console.log('  • !kill-bot {botname} - Arrêter un bot spécifique');
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
    console.log('🔍 Déclenchement de la commande !help');
    try {
      const helpText = formatHelpMessage();
      console.log('✅ formatHelpMessage() a retourné du texte');
      await message.reply(helpText);
    } catch (error) {
      console.error('❌ Erreur dans formatHelpMessage():', error.message);
      await message.reply(`❌ **Erreur lors de l\'affichage de l\'aide**\n\n\`${error.message}\`\n\n*Veuillez contacter l\'administrateur*`);
    }
    return;
  }

  // ===== COMMANDES POUR LANCER LES SCRIPTS =====

  // Commande KILL BOTS
  if (message.content.trim().toLowerCase() === '!kill-bots') {
    console.log('🔍 Déclenchement de !kill-bots');
    await killAllBots();
    await message.reply('✅ **Arrêt de tous les bots demandé**\n\n*Tous les processus node.exe ont été arrêtés*');
    return;
  }

  // Commande KILL BOT SPÉCIFIQUE
  if (message.content.startsWith('!kill-bot ')) {
    const botName = message.content.split(' ')[1];
    console.log(`🔍 Déclenchement de !kill-bot pour ${botName}`);

    if (botName) {
      try {
        execSync(`taskkill /F "${botName}"`, { timeout: 5000 });
        console.log(`✅ Arrêt du bot ${botName} réussi`);
        await message.reply(`✅ **Arrêt du bot ${botName} réussi**`);
      } catch (error) {
        console.error(`❌ Erreur lors de l\'arrêt du bot ${botName}:`, error.message);
        await message.reply(`❌ **Erreur lors de l\'arrêt du bot ${botName}**\n\n\`${error.message}\`\n\n*Le processus peut être déjà arrêté ou le nom est incorrect*`);
      }
    } else {
      await message.reply('❌ **Erreur:** Veuillez spécifier un nom de bot après !kill-bot\n*Exemple: !kill-bot bot1*');
    }
    return;
  }

  // Tableau des commandes
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

  // Fonction d'exécution de script
  const executeScript = async (message, scriptName, description, emoji, isLong = false) => {
    console.log(`${emoji} Lancement de ${scriptName}...`);

    const startMessage = isLong ?
      `${emoji} **${scriptName} en cours...**\n\n⏳ *Cette opération peut prendre plusieurs minutes*` :
      `${emoji} **${scriptName} en cours...`;

    const replyMessage = await message.reply(startMessage);

    try {
      const startTime = Date.now();

      // Configuration de la commande
      const command = `cd "${process.cwd()}" && npx ts-node "${scriptName}"`;

      console.log(`🚀 Exécution: ${command}`);

      // Exécution avec timeout et sortie bufferisée
      const result = execSync(command, {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: isLong ? 300000 : 120000, // 5 min max pour long, 2 min pour normal
        maxBuffer: 1024 * 1024, // 10MB buffer
        stdio: 'pipe'
      });

      const duration = Math.round((Date.now() - startTime) / 1000);

      // Message de succès
      await replyMessage.edit(
        `${emoji} **✅ ${scriptName} terminé avec succès**\n\n` +
          `**Durée:** ${duration}s\n` +
          `**Fichier:** ${scriptName}\n` +
          `**Status:** Exécution complétée\n\n` +
          `*Résultats sauvegardés dans la base de données*`
      );

      console.log(`✅ ${scriptName} terminé en ${duration}s`);

    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000);

      console.error(`❌ Erreur ${scriptName}:`, error.message || error);

      // Message d'erreur détaillé
      await replyMessage.edit(
        `${emoji} **❌ Erreur lors de l\'exécution de ${scriptName}**\n\n` +
          `**Durée:** ${duration}s\n` +
          `**Fichier:** ${scriptName}\n` +
          `**Erreur:** ${error.message || 'Erreur inconnue'}\n` +
          `*Vérifiez les logs pour plus de détails*`
      );
    }
  };

  // Fonction d'arrêt de tous les bots
  const killAllBots = async () => {
    const { execSync } = require('child_process');

    try {
      const result = execSync('tasklist | findstr /i "node.exe"', {
        encoding: 'utf8',
        timeout: 5000
      });

      if (result.stdout) {
        const bots = result.stdout
          .split('\n')
          .filter(line => line.includes('node.exe'))
          .map(line => {
            const match = line.match(/"([^"]+).*$/);
            return match ? match[1] : line.trim();
          });

        if (bots.length > 0) {
          console.log('⚠️ Bots détectés:', bots.length);
          console.log('⚠️ Arrêt des bots...');

        // Arrêter chaque bot
        bots.forEach(bot => {
          try {
            execSync(`taskkill /F "${bot}" /IM "${bot}"`, { timeout: 5000 });
            console.log(`✅ Arrêt du bot ${bot} réussi`);
          } catch (error) {
            console.error(`❌ Erreur arrêt de ${bot}:`, error.message);
          }
        });

        await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes pour s'assurer que tout soit arrêté

        console.log('✅ Arrêt des bots terminé');
      } else {
        console.log('✅ Aucun bot à arrêter');
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'arrêt des bots:', error.message);
    }
  };

    await message.reply('✅ **Arrêt de tous les bots demandé**\n\n*Tous les processus node.exe ont été arrêtés*');
  };

  // Vérification des bots existants
  function checkExistingBots() {
    try {
      const result = execSync('tasklist | findstr /i "node.exe"', {
        encoding: 'utf8',
        timeout: 5000
      });

      if (result.stdout) {
        const bots = result.stdout
          .split('\n')
          .filter(line => line.includes('node.exe'))
          .map(line => {
            const match = line.match(/"([^"]+)".*$/);
            return match ? match[1] : line.trim();
          });

        return bots.length > 0;
      } catch (error) {
        return false;
      }
    } catch (error) {
      return false;
      }
  };

  // Commande HELP
  function formatHelpMessage() {
    return `
**🤖 NovaQuote Financial Analyst - Commandes**

📊 **Commandes de Base :**
• \`!ping\` - Tester la connexion du bot
• \`!help\` - Afficher ce message d\'aide

🚀 **Agents IA (Lancer des analyses) :**
• \`!run-rougepulse\` - Lancer l\'analyse du calendrier économique
• \`!run-vixsimple\` - Lancer l\'analyse VIX/VVIX
• \`!run-vortex500\` - Lancer l\'analyse de sentiment de marché

📡 **Scrapers (Récupérer des données) :**
• \`!run-tradingeconomics\` - Scraper le calendrier économique US
• \`!run-newsaggregator\` - Agréger les news financières
• \`!run-vixplaywright\` - Scraper les données VIX en temps réel

🛑️ **Gestion des bots multiples :**
• \`!kill-bots\` - Arrêter tous les bots
• \`!kill-bot {botname}\` - Arrêter un bot spécifique

⚡ **Fonctionnalités :**
• Les scripts sont exécutés directement avec \`ts-node\`
• Les opérations longues affichent un avertissement
• Les résultats sont sauvegardés automatiquement

💡 **Information :**
Ce bot exécute directement les fichiers TypeScript de votre projet.
Les commandes fonctionnent même après refactorisation des scripts.

*Utilisez \`pnpm bot:final\` pour lancer ce bot !*
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