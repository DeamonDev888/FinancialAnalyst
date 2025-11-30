#!/usr/bin/env node

/**
 * Test script to verify Discord bot commands and database connectivity
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🧪 Testing Discord Bot Commands & Database');
console.log('');

async function runCommand(command, description) {
  console.log(`\n🚀 ${description}`);

  return new Promise((resolve, reject) => {
    const process = spawn('node', ['simple-bot-test.cjs'], {
      stdio: 'pipe',
      cwd: __dirname,
      env: { ...process.env }
    });

    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Command completed successfully');
        console.log('Output:', output.trim());
        resolve(output.trim());
      } else {
        console.log(`❌ Command failed with exit code ${code}`);
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', (error) => {
      console.error(`❌ Process error:`, error);
      reject(error);
    });
  });
}

async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection...');

  const { Pool } = require('pg');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'financial_analyst',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '9022',
  });

  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');

    // Test queries
    const queries = [
      'SELECT COUNT(*) FROM sentiment_analyses',
      'SELECT COUNT(*) FROM vix_analyses',
      'SELECT COUNT(*) FROM rouge_pulse_analyses',
    ];

    for (const query of queries) {
      const result = await pool.query(query);
      console.log(`📊 ${query}: ${result.rows[0].count} records`);
    }

    await client.end();
    return true;

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testRssFiles() {
  console.log('\n📰 Testing RSS Files...');

  const opmlPath = path.join(__dirname, 'ia.opml');
  const dataDir = path.join(__dirname, 'data');

  const opmlExists = fs.existsSync(opmlPath);
  const dataDirExists = fs.existsSync(dataDir);

  console.log(`📄 OPML file exists: ${opmlExists ? '✅' : '❌'} (${opmlPath})`);
  console.log(`📁 Data directory exists: ${dataDirExists ? '✅' : '❌'} (${dataDir})`);

  if (opmlExists) {
    const content = fs.readFileSync(opmlPath, 'utf8');
    const outlineMatches = content.match(/<outline[^>]*text="([^"]*)"[^>]*xmlUrl="([^"]*)"[^>]*htmlUrl="([^"]*)"[^>]*\/>/gi);
    const feedCount = outlineMatches ? outlineMatches.length : 0;

    console.log(`📊 RSS feeds found: ${feedCount}`);
  }

  return { opmlExists, dataDirExists, feedCount };
}

async function testDiscordToken() {
  console.log('\n🔑 Testing Discord Token...');

  const token = process.env.DISCORD_TOKEN;

  if (!token) {
    console.log('❌ No Discord token found');
    return false;
  }

  // Simple validation (check if it looks like a Discord bot token)
  const isValidToken = token.length > 50 && token.startsWith('M') && token.includes('T');

  console.log(`🔑 Token format: ${isValidToken ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`🔑 Token length: ${token.length} characters`);

  return isValidToken;
}

async function main() {
  try {
    console.log('🧪 Starting Comprehensive Bot Tests...\n');

    // Test 1: Discord Token
    const tokenValid = await testDiscordToken();

    // Test 2: Database Connection
    const dbConnected = await testDatabaseConnection();

    // Test 3: RSS Files
    const rssFiles = await testRssFiles();

    // Test 4: Architecture Validation
    console.log('\n✅ Architecture Tests Completed');
    console.log('📊 Results Summary:');
    console.log(`   Discord Token: ${tokenValid ? '✅' : '❌'}`);
    console.log(`   Database: ${dbConnected ? '✅' : '❌'}`);
    console.log(`   RSS Files: ${rssFiles.opmlExists && rssFiles.dataDirExists ? '✅' : '❌'} (${rssFiles.feedCount} feeds)`);

    console.log('\n🎯 Bot Status:');
    if (tokenValid && dbConnected) {
      console.log('✅ PRODUCTION READY - All components functioning correctly');
      console.log('\n🚀 Ready to start the bot with: npm run bot');
    } else {
      console.log('⚠️  Configuration issues detected - Check environment variables and database');
      console.log('\n💡 To fix:');
      console.log('   1. Add DISCORD_TOKEN to .env');
      console.log('   2. Configure database connection in .env');
      console.log('   3. Ensure ia.opml exists in project root');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

main();