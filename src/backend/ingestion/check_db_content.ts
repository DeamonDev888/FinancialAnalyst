
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

async function checkDbContent() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'financial_analyst',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '9022',
  });

  const client = await pool.connect();
  try {
    // Get the 5 most recent news items with content
    const res = await client.query(`
      SELECT title, source, url, content, published_at 
      FROM news_items 
      WHERE content IS NOT NULL AND length(content) > 100
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    let output = `Found ${res.rows.length} recent items with substantial content.\n\n`;

    for (const row of res.rows) {
      output += '---------------------------------------------------\n';
      output += `📌 Title: ${row.title}\n`;
      output += `SOURCE: ${row.source}\n`;
      output += `URL: ${row.url}\n`;
      output += `TIME: ${row.published_at}\n`;
      output += '📝 CONTENT PREVIEW (First 500 chars):\n';
      output += row.content.substring(0, 500) + '\n';
      output += '---------------------------------------------------\n\n';
    }

    fs.writeFileSync('db_content_check.txt', output);
    console.log('Verification complete. Check db_content_check.txt');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDbContent();
