#!/usr/bin/env node

// Test final du bot fonctionnel
require('dotenv').config();

console.log('🧪 TEST FINAL DU BOT FONCTIONNEL');

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let messageCount = 0;

client.once('ready', () => {
  console.log('✅ Bot connecté et prêt pour les tests');
  console.log('Envoi d\'un message de test...');

  // Simuler un message de test après 2 secondes
  setTimeout(async () => {
    const testChannel = client.channels.cache.get('1442317829998383236235'); // Remplacez par votre ID de channel
    if (testChannel && testChannel.isTextBased()) {
      try {
        await testChannel.send('!ping');
        console.log('✅ Message de test envoyé');
      } catch (error) {
        console.error('❌ Erreur envoi message test:', error);
      }
    }
  }, 2000);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  messageCount++;
  console.log(`📩 Message ${messageCount}: "${message.content}" de ${message.author.tag}`);

  if (message.content.trim().toLowerCase() === '!ping') {
    console.log('🏓 Commande !ping reçue');
    await message.reply('🏓 Pong!');
  }
});

client.login(process.env.DISCORD_TOKEN);