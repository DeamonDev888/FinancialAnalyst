#!/usr/bin/env node

/**
 * Simple launcher for the refactored NovaQuote Discord Bot
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

  // Build arguments array for ts-node
  const args = [
    'ts-node',
    '--project', 'tsconfig.bot.json',
    '--transpile-only',
    '-O', 'module=commonjs',
    'src/discord_bot/index.ts'
  ];

  // Use spawn with proper escaping
  const { spawn } = require('child_process');

  const botProcess = spawn('ts-node', args, {
    stdio: 'inherit',
    shell: false, // Disable shell to avoid escaping issues
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