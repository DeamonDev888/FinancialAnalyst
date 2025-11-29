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
async function checkSymbols() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT DISTINCT symbol, COUNT(*) FROM market_data GROUP BY symbol');
        console.table(res.rows);
        const recent = await client.query('SELECT symbol, price, timestamp FROM market_data ORDER BY timestamp DESC LIMIT 10');
        console.log('\nRecent entries:');
        console.table(recent.rows);
    }
    catch (e) {
        console.error(e);
    }
    finally {
        client.release();
        pool.end();
    }
}
checkSymbols();
