
import { NewsAggregator } from './NewsAggregator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function verifyRealNewsScraping() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'financial_analyst',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '9022',
  });

  const aggregator = new NewsAggregator();

  try {
    console.log('📰 Starting Targeted News Scraping (News Only, No Prices)...');

    // 1. Fetch from ZeroHedge
    console.log('\n--- Fetching ZeroHedge ---');
    const zhNews = await aggregator.fetchZeroHedgeHeadlines();
    console.log(`Fetched ${zhNews.length} items from ZeroHedge.`);
    await aggregator.saveNewsToDatabase(zhNews);

    // 2. Fetch from CNBC
    console.log('\n--- Fetching CNBC ---');
    const cnbcNews = await aggregator.fetchCNBCMarketNews();
    console.log(`Fetched ${cnbcNews.length} items from CNBC.`);
    await aggregator.saveNewsToDatabase(cnbcNews);

    // 3. Verify in Database
    console.log('\n🔍 Verifying Latest Database Entries...');
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT title, source, url, content, created_at 
        FROM news_items 
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      console.log(`\nFound ${res.rows.length} most recent entries in DB:`);
      
      for (const row of res.rows) {
        console.log('\n===================================================');
        console.log(`📌 TITLE:  ${row.title}`);
        console.log(`SOURCE: ${row.source}`);
        console.log(`URL:    ${row.url}`);
        console.log(`SAVED:  ${row.created_at}`);
        console.log('---------------------------------------------------');
        console.log('📝 CONTENT SAMPLE (Real Scraped Text):');
        if (row.content) {
          // Show first 300 chars and remove newlines for cleaner display
          console.log(row.content.substring(0, 300).replace(/\n/g, ' ') + '...');
        } else {
          console.log('⚠️ NO CONTENT (NULL)');
        }
        console.log('===================================================');
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await aggregator.close();
    await pool.end();
  }
}

verifyRealNewsScraping();
