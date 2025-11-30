#!/usr/bin/env node

/**
 * Final launcher for the refactored NovaQuote Discord Bot
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

  // Use exec instead of spawn for simpler command execution
  const { exec } = require('child_process');

  const cmd = `cd "${__dirname}" && npx ts-node --project tsconfig.bot.json --transpile-only -O "module=commonjs" src/discord_bot/index.ts`;

  const botProcess = exec(cmd, {
    stdio: 'inherit',
    cwd: __dirname,
    env: { ...process.env }
  });

  botProcess.on('exit', (code) => {
    if (code !== 0) {
      console.log(`❌ Bot exited with code ${code}`);
      process.exit(code);
    } else {
      console.log('✅ Bot stopped successfully');
    }
  });

  botProcess.on('error', (error) => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
}