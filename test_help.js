#!/usr/bin/env node

// Test simple de la commande help
require('dotenv').config();

console.log('🧪 TEST DE LA COMMANDE HELP');

// Simuler un message Discord
const testMessage = {
  content: '!help',
  author: { tag: 'TestUser#1234' },
  reply: async (text) => console.log('💬 Réponse bot:', text)
};

// Simuler la logique du bot
const { formatHelpMessage } = require('./start_discord_bot.cjs');

console.log('🔍 Appel de formatHelpMessage():');
try {
  const helpText = formatHelpMessage();
  console.log('✅ formatHelpMessage() fonctionne');
  console.log('📝 Contenu de l\'aide:');
  console.log(helpText.substring(0, 200) + '...');
} catch (error) {
  console.error('❌ Erreur dans formatHelpMessage():', error.message);
}