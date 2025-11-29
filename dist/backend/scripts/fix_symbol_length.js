"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    host: 'localhost',
    port: 5432,
    database: 'financial_analyst',
    user: 'postgres',
    password: '9022',
});
async function fixSymbolLength() {
    const client = await pool.connect();
    try {
        console.log('Altering symbol column length...');
        await client.query(`
      ALTER TABLE market_data 
      ALTER COLUMN symbol TYPE VARCHAR(50);
    `);
        console.log('✅ Symbol column length increased to 50.');
    }
    catch (e) {
        console.error('❌ Migration failed:', e);
    }
    finally {
        client.release();
        pool.end();
    }
}
fixSymbolLength();
