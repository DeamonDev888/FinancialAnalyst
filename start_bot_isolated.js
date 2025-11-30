#!/usr/bin/env node

/**
 * Bot Discord Isolé - Permet de lancer le bot Discord sans interférence
 * avec les autres processus de l'application principale
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

console.log('🤖 Démarrage du Bot Discord en mode isolé...');
console.log('=' .repeat(60));

// Vérifier que le fichier .env existe
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Fichier .env non trouvé. Créez un fichier .env avec les variables requises:');
  console.error('   - DISCORD_TOKEN');
  console.error('   - DISCORD_CHANNEL_ID');
  console.error('   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
  process.exit(1);
}

// Tuer les autres processus Node.js qui pourraient interférer
console.log('🔍 Recherche des autres processus Node.js...');
const { exec } = require('child_process');

exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error: any, stdout: string) => {
  if (error) {
    console.log('⚠️ Impossible de lister les processus Node.js:', error.message);
  } else {
    const lines = stdout.split('\n').filter((line: string) => line.includes('node.exe'));
    console.log(`📊 ${lines.length - 1} processus Node.js trouvés (hors ce script)`);
  }
});

// Démarrer le bot Discord dans un processus isolé
const botProcess = spawn('pnpm', ['run', 'bot'], {
  stdio: 'inherit',
  detached: false,
  shell: true,
  env: {
    ...process.env,
    // Variables pour isoler le bot
    BOT_ISOLATED: 'true',
    NO_SIGNAL_HANDLERS: 'true'
  }
});

// Gestionnaire d'erreurs
botProcess.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage du bot:', error.message);
  process.exit(1);
});

// Gestionnaire de sortie du bot
botProcess.on('close', (code) => {
  console.log(`🤖 Bot Discord arrêté avec le code: ${code}`);
  if (code !== 0) {
    console.error('❌ Le bot s est arrêté avec une erreur');
  }
  process.exit(code);
});

// Intercepter les signaux pour les rediriger proprement vers le bot
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    console.log(`\n📡 Signal ${signal} reçu, arrêt propre du bot...`);
    botProcess.kill('SIGTERM');
    // Attendre un peu que le bot s'arrête proprement
    setTimeout(() => {
      botProcess.kill('SIGKILL');
      process.exit(1);
    }, 5000);
  });
});

console.log('✅ Bot Discord démarré en mode isolé');
console.log('🔗 Utilisez Ctrl+C pour arrêter proprement le bot');
console.log('=' .repeat(60));