#!/usr/bin/env node

/**
 * Script de démarrage propre pour le bot Discord
 * Tue les autres instances du bot avant de démarrer
 */

import { spawn, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

console.log('🤖 Démarrage propre du Bot Discord...');
console.log('=' .repeat(50));

// Fonction pour tuer les autres instances du bot
function killOtherBotInstances() {
  return new Promise((resolve) => {
    console.log('🔍 Recherche des autres instances du bot...');

    exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout) => {
      if (error) {
        console.log('⚠️ Impossible de lister les processus:', error.message);
        resolve(0);
        return;
      }

      const currentPid = process.pid;
      const lines = stdout.split('\n');
      let killedCount = 0;

      lines.forEach(line => {
        if (line.includes('node.exe') && line.includes('discord_bot')) {
          const parts = line.split(',');
          const pid = parseInt(parts[1]?.replace(/"/g, '').trim());

          if (pid && pid !== currentPid && !isNaN(pid)) {
            try {
              process.kill(pid);
              console.log(`🔫 Instance du bot tuée: PID ${pid}`);
              killedCount++;
            } catch (killError) {
              // Forcer si nécessaire
              exec(`taskkill /F /PID ${pid}`, (forceError) => {
                if (!forceError) {
                  console.log(`🔫 Instance forcée: PID ${pid}`);
                  killedCount++;
                }
              });
            }
          }
        }
      });

      console.log(`✅ ${killedCount} autre(s) instance(s) du bot tuée(s)`);
      resolve(killedCount);
    });
  });
}

// Fonction pour vérifier le fichier .env
function checkEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Fichier .env non trouvé!');
    console.error('Créez un fichier .env avec:');
    console.error('   DISCORD_TOKEN=votre_token');
    console.error('   DISCORD_CHANNEL_ID=votre_channel_id');
    process.exit(1);
  }

  // Charger et vérifier les variables essentielles
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasToken = envContent.includes('DISCORD_TOKEN');
  const hasChannel = envContent.includes('DISCORD_CHANNEL_ID');

  if (!hasToken || !hasChannel) {
    console.error('❌ Variables manquantes dans .env:');
    if (!hasToken) console.error('   - DISCORD_TOKEN');
    if (!hasChannel) console.error('   - DISCORD_CHANNEL_ID');
    process.exit(1);
  }

  console.log('✅ Fichier .env vérifié');
}

// Fonction principale
async function main() {
  try {
    // Vérifier l'environnement
    checkEnvFile();

    // Tuer les autres instances
    await killOtherBotInstances();

    // Attendre un peu pour la stabilisation
    console.log('⏳ Stabilisation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Démarrer le bot
    console.log('🚀 Démarrage du bot Discord...');
    console.log('=' .repeat(50));

    const botProcess = spawn('pnpm', ['run', 'bot'], {
      stdio: 'inherit',
      detached: false,
      shell: true
    });

    botProcess.on('error', (error) => {
      console.error('❌ Erreur de démarrage du bot:', error.message);
      process.exit(1);
    });

    botProcess.on('close', (code) => {
      console.log(`\n🤖 Bot arrêté avec le code: ${code}`);
      process.exit(code || 0);
    });

    // Gérer Ctrl+C proprement
    process.on('SIGINT', () => {
      console.log('\n📡 Arrêt demandé...');
      botProcess.kill('SIGTERM');
      setTimeout(() => {
        botProcess.kill('SIGKILL');
        process.exit(1);
      }, 5000);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter
main();