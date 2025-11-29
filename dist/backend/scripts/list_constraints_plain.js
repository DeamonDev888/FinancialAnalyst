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
async function listConstraintsPlain() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
      WHERE conrelid = 'market_data'::regclass;
    `);
        res.rows.forEach(r => console.log(`${r.conname}: ${r.def}`));
    }
    catch (e) {
        console.error(e);
    }
    finally {
        client.release();
        pool.end();
    }
}
listConstraintsPlain();
//# sourceMappingURL=list_constraints_plain.js.map