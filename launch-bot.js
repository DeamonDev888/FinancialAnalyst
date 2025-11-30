#!/usr/bin/env node

/**
 * Launcher script for the refactored NovaQuote Discord Bot
 * Handles path resolution issues on Windows
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
require('dotenv').config({ path: join(__dirname, '.env') });

console.log('🤖 NovaQuote Financial Analyst Bot');
console.log('🏗️ Refactored Architecture - Production Ready');
console.log('');

// Test basic configuration
const requiredEnvVars = ['DISCORD_TOKEN', 'DISCORD_CHANNEL_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n💡 Please add them to your .env file');
  process.exit(1);
}

console.log('✅ Environment variables configured');
console.log('🔑 Discord Token: ***configured***');
console.log('📢 Channel ID:', process.env.DISCORD_CHANNEL_ID);
console.log('');

try {
  console.log('🚀 Starting refactored bot...');

  // Dynamic import to handle path resolution
  const botPath = join(__dirname, 'src', 'discord_bot', 'index.js');

  // Check if compiled version exists
  const fs = require('fs');
  if (fs.existsSync(botPath)) {
    console.log('📦 Using compiled version');
    const { NovaQuoteBot } = require(botPath);
    const bot = new NovaQuoteBot();
    await bot.start();
  } else {
    console.log('🔧 Using TypeScript version');
    // Use ts-node for TypeScript execution
    const { spawn } = require('child_process');

    const botProcess = spawn('npx', ['ts-node', '--project', 'tsconfig.bot.json', '--transpile-only', '-O', '"module":"commonjs"', 'src/discord_bot/index.ts'], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname,
      env: { ...process.env }
    });

    botProcess.on('exit', (code) => {
      if (code !== 0) {
        console.log(`❌ Bot exited with code ${code}`);
        process.exit(code);
      }
    });

    botProcess.on('error', (error) => {
      console.error('❌ Failed to start bot:', error);
      process.exit(1);
    });
  }

} catch (error) {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
}