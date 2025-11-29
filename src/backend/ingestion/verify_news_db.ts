
import { NewsAggregator } from './NewsAggregator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function verifyNewsDatabase() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'financial_analyst',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '9022',
  });

  try {
    console.log('🚀 Starting News Aggregation to populate DB...');
    const aggregator = new NewsAggregator();
    await aggregator.fetchAndSaveAllNews();
    
    console.log('\n🔍 Verifying Database Content...');
    const client = await pool.connect();
    try {
      // Get the 3 most recent news items with content
      const res = await client.query(`
        SELECT title, source, url, content, published_at 
        FROM news_items 
        WHERE content IS NOT NULL AND length(content) > 50
        ORDER BY created_at DESC 
        LIMIT 3
      `);

      console.log(`Found ${res.rows.length} recent items with substantial content.`);

      for (const row of res.rows) {
        console.log('\n---------------------------------------------------');
        console.log(`📌 Title: ${row.title}`);
        console.log(`SOURCE: ${row.source}`);
        console.log(`URL: ${row.url}`);
        console.log(`TIME: ${row.published_at}`);
        console.log('📝 CONTENT PREVIEW (First 500 chars):');
        console.log(row.content.substring(0, 500));
        console.log('---------------------------------------------------\n');
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await pool.end();
  }
}

verifyNewsDatabase();
