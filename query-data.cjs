#!/usr/bin/env node

/**
 * Query specific data from the bot database
 */

const { Pool } = require('pg');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'financial_analyst',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9022',
});

async function queryDatabase(query, description) {
  console.log(`\n🔍 ${description}...`);

  try {
    const result = await pool.query(query);
    console.log(`✅ Query executed successfully`);
    console.log(`📊 Result: ${JSON.stringify(result.rows, null, 2)}`);
    return result.rows;
  } catch (error) {
    console.error(`❌ Query failed:`, error);
    return null;
  }
}

async function getLatestSentiment() {
  return await queryDatabase('SELECT * FROM sentiment_analyses ORDER BY created_at DESC LIMIT 3', 'Latest 3 Sentiment Analyses');
}

async function getLatestVix() {
  return await queryDatabase('SELECT * FROM vix_analyses ORDER BY created_at DESC LIMIT 3', 'Latest 3 VIX Analyses');
}

async function getLatestRougePulse() {
  return await queryDatabase('SELECT * FROM rouge_pulse_analyses ORDER BY created_at DESC LIMIT 3', 'Latest 3 RougePulse Analyses');
}

async function getRssHistory() {
  try {
    const fs = require('fs');
    const dataPath = path.join(__dirname, 'data', 'sent_articles.json');

    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      console.log(`📰 RSS History: ${data.articles.length} articles saved`);
      return data.articles.length;
    } else {
      console.log('❌ No RSS history file found');
      return 0;
    }
  } catch (error) {
    console.error('❌ Failed to read RSS history:', error);
    return 0;
  }
}

async function getRecentActivity() {
  const sentimentCount = await queryDatabase('SELECT COUNT(*) FROM sentiment_analyses WHERE created_at > NOW() - INTERVAL \'7 days\'', 'Recent sentiment analyses (7 days)');
  const vixCount = await queryDatabase('SELECT COUNT(*) FROM vix_analyses WHERE created_at > NOW() - INTERVAL \'7 days\'', 'Recent VIX analyses (7 days)');
  const rougePulseCount = await queryDatabase('SELECT COUNT(*) FROM rouge_pulse_analyses WHERE created_at > NOW() - INTERVAL \'7 days\'', 'Recent RougePulse analyses (7 days)');

  console.log('\n📈 Recent Activity (7 days):');
  console.log(`   📊 Sentiment: ${sentimentCount.rows[0].count} analyses`);
  console.log(`   📉 VIX: ${vixCount.rows[0].count} analyses`);
  console.log(`   🔴 RougePulse: ${rougePulseCount.rows[0].count} analyses`);
  console.log(`   📰 RSS History: ${await getRssHistory()} articles`);

  return {
    sentiment: sentimentCount.rows[0].count,
    vix: vixCount.rows[0].count,
    rougePulse: rougePulseCount.rows[0].count,
    rssHistory: await getRssHistory()
  };
}

// CLI interface
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'sentiment':
      const sentiments = await getLatestSentiment();
      if (sentiments && sentiments.length > 0) {
        console.log('\n📊 Latest Sentiment Analyses:');
        sentiments.forEach((item, index) => {
          console.log(`${index + 1}. Date: ${new Date(item.created_at).toLocaleString('fr-FR')}`);
          console.log(`   Score: ${item.score}/100`);
          console.log(`   Sentiment: ${item.overall_sentiment}`);
          console.log(`   Summary: ${item.summary?.substring(0, 100)}...`);
        });
      } else {
        console.log('❌ No sentiment analyses found');
      }
      break;

    case 'vix':
      const vixAnalyses = await getLatestVix();
      if (vixAnalyses && vixAnalyses.length > 0) {
        console.log('\n📉 Latest VIX Analyses:');
        vixAnalyses.forEach((item, index) => {
          const data = item.analysis_data;
          console.log(`${index + 1}. Date: ${new Date(item.created_at).toLocaleString('fr-FR')}`);
          console.log(`   VIX Value: ${data?.current_vix_data?.consensus_value || 'N/A'}`);
          console.log(`   Trend: ${data?.expert_volatility_analysis?.vix_trend || 'N/A'}`);
          console.log(`   Regime: ${data?.expert_volatility_analysis?.volatility_regime || 'N/A'}`);
        });
      } else {
        console.log('❌ No VIX analyses found');
      }
      break;

    case 'rougepulse':
      const rougePulses = await getLatestRougePulse();
      if (rougePulses && rougePulses.length > 0) {
        console.log('\n🔴 Latest RougePulse Analyses:');
        rougePulses.forEach((item, index) => {
          console.log(`${index + 1}. Date: ${new Date(item.created_at).toLocaleString('fr-FR')}`);
          console.log(`   Volatility Score: ${item.volatility_score}/10`);
          console.log(`   Critical Events: ${item.critical_count || 0}`);
          console.log(`   High Impact: ${item.high_count || 0}`);
          console.log(`   Summary: ${item.summary?.substring(0, 150)}...`);
        });
      } else {
        console.log('❌ No RougePulse analyses found');
      }
      break;

    case 'activity':
      await getRecentActivity();
      break;

    case 'rss':
      const rssCount = await getRssHistory();
      console.log(`\n📰 RSS History: ${rssCount} articles saved`);
      break;

    default:
      console.log('\n📋 Available Commands:');
      console.log('   node query-data.cjs sentiment    - Latest sentiment analyses');
      console.log('   node query-data.cjs vix          - Latest VIX analyses');
      console.log('   node query-data.cjs rougepulse    - Latest RougePulse analyses');
      console.log('   node query-data.cjs activity       - Recent activity summary');
      console.log('   node query-data.cjs rss           - RSS history count');
      console.log('   node query-data.cjs <command>      - Run specific query');
      break;
  }

  await pool.end();
}

main().catch(error => {
  console.error('❌ Database query failed:', error);
  process.exit(1);
});