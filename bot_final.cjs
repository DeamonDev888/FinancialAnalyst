#!/usr/bin/env node

require('dotenv').config();

console.log('🚀 Démarrage du Bot NovaQuote Final...');

const { Client, GatewayIntentBits } = require('discord.js');
const { execSync } = require('child_process');
const path = require('path');

// Vérification des variables d'environnement
// Vérification des bots existants
function checkExistingBots() {
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
          const match = line.match(/"([^"]+)".*$/);
          return match ? match[1] : line.trim();
        });

      if (bots.length > 0) {
        console.log('⚠️ Bots détectés:', bots.length);
        console.log('⚠️ Arrêt des bots existants...');

        // Arrêter tous les node.exe
        bots.forEach(bot => {
          try {
            execSync(`taskkill /F "${bot}" /IM "${bot}"`, { timeout: 5000 });
            console.log(`✅ Bot arrêté: ${bot}`);
          } catch (error) {
            console.error(`❌ Erreur arrêt de ${bot}:`, error.message);
          }
        });

        // Attendre un peu pour que l'arrêt soit effectif
        setTimeout(() => {
          console.log('✅ Arrêt des bots terminé');
        }, 2000); // 2 secondes
      }
    }
    }
  }

  return bots.length > 0;
  } catch (error) {
    console.error('❌ Erreur vérification bots:', error.message);
    return 0;
  }
}
      const bots = result.stdout
        .split('\n')
        .filter(line => line.includes('node.exe'))
        .map(line => {
          const match = line.match(/"([^"]+).*$/);
          return match ? match[1] : line;
        });

      if (bots.length > 0) {
        console.log('⚠️ Bots détectés:', bots.length);
        console.log('⚠️ Arrêt des bots existants...');

        // Arrêter tous les node.exe
        bots.forEach(bot => {
          try {
            execSync(`taskkill /F "${bot}" /IM "${bot}"`, { timeout: 5000 });
          } catch (e) {
            console.error(`❌ Erreur arrêt de ${bot}:`, e.message);
          }
        });

        // Attendre un peu pour que l'arrêt soit effectif
        setTimeout(() => {
          console.log('✅ Arrêt des bots terminé');
        }, 2000);

        return true; // Indique que des bots ont été arrêtés
      } else {
        console.log('✅ Aucun bot node.exe détecté');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur vérification bots:', error.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur vérification bots:', error.message);
    return false;
  }
}

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
    const helpText = formatHelpMessage();
    await message.reply(helpText);
    return;
  }

  // ===== COMMANDES POUR LANCER LES SCRIPTS =====

  const executeScript = async (message, scriptName, description, emoji, isLong = false) => {
    console.log(`${emoji} Lancement de ${scriptName}...`);

    const startMessage = isLong ?
      `${emoji} **${scriptName} en cours...**\\n\\n⏳ *Cette opération peut prendre plusieurs minutes*` :
      `${emoji} **${scriptName} en cours...**`;

    const replyMessage = await message.reply(startMessage);

    try {
      const startTime = Date.now();

      // Utiliser ts-node avec le projet comme working directory
      const command = `cd "${process.cwd()}" && npx ts-node "${scriptName}"`;

      console.log(`🚀 Exécution: ${command}`);

      // Exécution avec timeout et sortie bufferisée
      const result = execSync(command, {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: isLong ? 300000 : 120000, // 5 min pour long, 2 min pour normal
        maxBuffer: 1024 * 1024, // 10MB buffer
        stdio: 'pipe'
      });

      const duration = Math.round((Date.now() - startTime) / 1000);

      if (result.stdout.includes('error') || result.stderr) {
        console.error(`❌ Erreur ${scriptName}:`, result.stderr || result.stdout);
        await replyMessage.edit(
          `${emoji} **❌ Erreur lors de l'exécution de ${scriptName}**\\n\\n` +
          `**Durée:** ${duration}s\\n` +
          `**Fichier:** ${scriptName}\\n` +
          `**Erreurs:** ${result.stderr || result.stdout}\\n` +
          `*Vérifiez les logs pour plus de détails*`
        );
      } else {
        console.log(`✅ ${scriptName} terminé avec succès`);
        await replyMessage.edit(
          `${emoji} **✅ ${scriptName} terminé avec succès**\\n\\n` +
          `**Durée:** ${duration}s\\n` +
          `**Fichier:** ${scriptName}\\n` +
          `*Résultats sauvegardés dans la base de données*`
        );
      }

    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.error(`❌ Exception dans ${scriptName}:`, error.message);
      await replyMessage.edit(
        `${emoji} **❌ Exception lors de l'exécution de ${scriptName}**\\n\\n` +
          `**Durée:** ${duration}s\\n` +
          `**Fichier:** ${scriptName}\\n` +
          `**Erreur:** ${error.message}\\n` +
          `*Le script a rencontré une erreur inattendue*`
      );
    }
  };

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

  // Vérifier chaque commande
  for (const cmd of commands) {
    if (message.content.trim().toLowerCase() === cmd.trigger) {
      await executeScript(message, cmd.name, cmd.description, cmd.emoji, cmd.long);
      break;
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
• \`!run-newsaggregator\` - Agréger les news financières (long)
• \`!run-vixplaywright\` - Scraper les données VIX en temps réel

⚡ **Fonctionnalités :**
• Les scripts sont exécutés directement avec \`ts-node\`
• Les opérations longues affichent un avertissement
• Les résultats sont sauvegardés automatiquement
• Compatible avec votre refactorisation des scripts

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