#!/usr/bin/env node

/**
 * CommonJS launcher for the refactored NovaQuote Discord Bot
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

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

  // Check if compiled version exists
  const compiledBotPath = path.join(__dirname, 'dist', 'discord_bot', 'index.js');
  const sourceBotPath = path.join(__dirname, 'src', 'discord_bot', 'index.ts');
  const tsconfigPath = path.join(__dirname, 'tsconfig.bot.json');

  let command, args;

  if (fs.existsSync(compiledBotPath)) {
    console.log('📦 Using compiled version');
    command = 'node';
    args = [compiledBotPath];
  } else if (fs.existsSync(sourceBotPath) && fs.existsSync(tsconfigPath)) {
    console.log('🔧 Using TypeScript version');
    command = 'npx';
    args = [
      'ts-node',
      '--project', 'tsconfig.bot.json',
      '--transpile-only',
      '-O', 'module=commonjs',
      sourceBotPath
    ];
  } else {
    console.log('❌ No bot source files found');
    process.exit(1);
  }

  const botProcess = spawn(command, args, {
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