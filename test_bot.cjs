#!/usr/bin/env node

// Test simple du bot
require('dotenv').config();

console.log('🔍 Test des variables d\'environnement:');
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? 'Présent' : 'Manquant');
console.log('DISCORD_CHANNEL_ID:', process.env.DISCORD_CHANNEL_ID ? 'Présent' : 'Manquant');
console.log('DB_HOST:', process.env.DB_HOST || 'Manquant');

// Test basique du bot Discord
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log('✅ Bot connecté avec succès!');
  console.log('Utilisateur:', client.user?.tag);
  console.log('Test terminé - déconnexion...');
  client.destroy();
  process.exit(0);
});

client.on('error', (error) => {
  console.error('❌ Erreur Discord:', error);
  process.exit(1);
});

// Démarrage avec timeout
setTimeout(() => {
  console.log('⏰ Timeout - déconnexion...');
  client.destroy();
  process.exit(1);
}, 10000);

// Connexion
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN non trouvé!');
  process.exit(1);
}

console.log('🚀 Connexion à Discord...');
client.login(token);