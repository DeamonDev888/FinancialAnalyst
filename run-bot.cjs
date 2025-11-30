#!/usr/bin/env node

/**
 * Direct bot runner without complex module resolution
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🤖 NovaQuote Financial Analyst Bot');
console.log('🏗️ Refactored Architecture - Production Ready');
console.log('');

// Check environment
if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CHANNEL_ID) {
  console.log('❌ Missing DISCORD_TOKEN or DISCORD_CHANNEL_ID');
  process.exit(1);
}

console.log('✅ Environment configured');

async function runCommand(command, description) {
  console.log(`\n🚀 Running: ${description}`);

  return new Promise((resolve, reject) => {
    const process = spawn(command.cmd, command.args, {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve();
      } else {
        console.log(`❌ ${description} failed with code ${code}`);
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', (error) => {
      console.log(`❌ ${description} error:`, error);
      reject(error);
    });
  });
}

// Available commands
const commands = {
  build: {
    cmd: 'npm',
    args: ['run', 'build'],
    description: 'Building TypeScript to JavaScript'
  },
  startBot: {
    cmd: 'node',
    args: ['start-refactored-bot.cjs'],
    description: 'Starting the refactored bot'
  },
  testBot: {
    cmd: 'node',
    args: ['simple-bot-test.cjs'],
    description: 'Testing the refactored architecture'
  }
};

async function main() {
  try {
    // First build
    await runCommand(commands.build, 'TypeScript compilation');

    // Then start bot
    await runCommand(commands.startBot, 'Bot startup');

    console.log('\n🎉 All operations completed successfully!');
    console.log('\n📋 To run individual commands:');
    console.log('   npm run build');
    console.log('   npm run start-bot');
    console.log('   npm run test-bot');

  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  }
}

main();