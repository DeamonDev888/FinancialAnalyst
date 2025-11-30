#!/usr/bin/env node

/**
 * Script de démarrage simple pour le bot Discord NovaQuote Financial Analyst
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Démarrage du bot NovaQuote Financial Analyst...\n');

// Lancer le bot TypeScript avec ts-node
const botProcess = spawn('npx', ['ts-node', 'src/discord_bot/index.ts'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

botProcess.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage du bot:', error);
  process.exit(1);
});

botProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Le bot s'est arrêté avec le code de sortie: ${code}`);
    process.exit(code);
  } else {
    console.log('✅ Le bot s\'est arrêté correctement');
  }
});

// Gérer l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du bot...');
  botProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du bot...');
  botProcess.kill('SIGTERM');
});

console.log('✅ Bot démarré. Utilisez !help dans Discord pour voir les commandes disponibles.');