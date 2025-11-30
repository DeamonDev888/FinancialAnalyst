import { BaseAgentSimple } from './BaseAgentSimple';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
dotenv.config();
export class NewsFilterAgent extends BaseAgentSimple {
    pool;
    constructor() {
        super('NewsFilterAgent');
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'financial_analyst',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '9022',
        });
    }
    async runFilterCycle() {
        console.log(`[${this.agentName}] Starting filter cycle...`);
        try {
            const pendingItems = await this.fetchPendingItems();
            if (pendingItems.length === 0) {
                console.log(`[${this.agentName}] No pending items to filter.`);
                return;
            }
            console.log(`[${this.agentName}] Found ${pendingItems.length} pending items.`);
            // Process in batches of 5
            const batchSize = 5;
            for (let i = 0; i < pendingItems.length; i += batchSize) {
                const batch = pendingItems.slice(i, i + batchSize);
                await this.processBatch(batch);
            }
        }
        catch (error) {
            console.error(`[${this.agentName}] Error in filter cycle:`, error);
        }
    }
    async fetchPendingItems() {
        const client = await this.pool.connect();
        try {
            const res = await client.query(`
        SELECT id, title, content, source 
        FROM news_items 
        WHERE processing_status = 'PENDING' 
        ORDER BY created_at DESC 
        LIMIT 50
      `);
            return res.rows;
        }
        finally {
            client.release();
        }
    }
    async processBatch(batch) {
        const prompt = this.buildPrompt(batch);
        const req = {
            prompt,
            outputFile: `data/agent-data/${this.agentName}/last_batch.json`,
        };
        try {
            // We override the default parsing logic by handling the raw output here if needed, 
            // but BaseAgentSimple calls parseKiloCodeOutput. 
            // We need to override parseKiloCodeOutput to handle our specific list format.
            // However, BaseAgentSimple.parseKiloCodeOutput is private. 
            // We will just use callKiloCode and expect it to return something, 
            // but since the base class implementation is strict about "sentiment" fields, 
            // we might need to copy the execution logic or make the base class more flexible.
            // 
            // Actually, looking at BaseAgentSimple, it enforces 'sentiment', 'score', etc.
            // This is too restrictive for us.
            // I will implement a custom execute method here that reuses the shell execution but parses differently.
            const results = await this.executeAndParse(req);
            await this.updateDatabase(results);
        }
        catch (error) {
            console.error(`[${this.agentName}] Failed to process batch:`, error);
        }
    }
    buildPrompt(batch) {
        const itemsJson = JSON.stringify(batch.map(b => ({ id: b.id, title: b.title, content: b.content?.substring(0, 500) || b.title })), null, 2);
        return `
You are an expert content curator for a Financial & Tech community.
Your task is to filter the following news items based on their relevance to:
1. CODE / DEVELOPMENT (Web, Software, Tools)
2. ARTIFICIAL INTELLIGENCE (LLMs, ML, Research)
3. FINANCE / STOCK MARKET (Trading, Economy, Crypto)

Items unrelated to these topics (e.g. politics, sports, general news) should be marked as OTHER and IRRELEVANT.

Input Items:
${itemsJson}

Return a JSON object with a "results" array containing an object for EACH input item with:
- "id": (same as input)
- "relevance_score": (0-10, where 10 is highly relevant)
- "category": "CODE", "AI", "FINANCE", or "OTHER"
- "processing_status": "RELEVANT" (if score >= 6) or "IRRELEVANT"
- "summary": (1 sentence summary)

IMPORTANT: Return ONLY valid JSON. No markdown formatting.
`;
    }
    // Re-implementing execution logic because BaseAgentSimple is too strict
    async executeAndParse(req) {
        const execAsync = promisify(exec);
        const tempPromptPath = path.join(process.cwd(), `temp_prompt_${Date.now()}.txt`);
        await fs.writeFile(tempPromptPath, req.prompt, 'utf-8');
        // Use 'ask' mode with --json
        const command = `cat "${tempPromptPath}" | kilocode -m ask --auto --json`;
        try {
            const { stdout } = await execAsync(command, { timeout: 120000 });
            // Try to find the JSON array in the output
            const jsonMatch = stdout.match(/\{[\s\S]*"results"[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed.results)) {
                    return parsed.results;
                }
            }
            // Fallback: try to find just an array
            const arrayMatch = stdout.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                const parsed = JSON.parse(arrayMatch[0]);
                return parsed;
            }
            throw new Error('Could not parse JSON results from LLM output');
        }
        finally {
            try {
                await fs.unlink(tempPromptPath);
            }
            catch { }
        }
    }
    async updateDatabase(results) {
        const client = await this.pool.connect();
        try {
            for (const res of results) {
                await client.query(`
          UPDATE news_items 
          SET 
            relevance_score = $1,
            category = $2,
            processing_status = $3,
            content = CASE WHEN content IS NULL THEN $4 ELSE content END -- Update content with summary if empty? No, maybe just keep it.
          WHERE id = $5
        `, [res.relevance_score, res.category, res.processing_status, res.summary, res.id]);
                console.log(`[${this.agentName}] Updated item ${res.id}: ${res.category} (${res.relevance_score}/10) -> ${res.processing_status}`);
            }
        }
        finally {
            client.release();
        }
    }
    async close() {
        await this.pool.end();
    }
}
// Standalone execution
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
    const agent = new NewsFilterAgent();
    agent.runFilterCycle().then(() => agent.close());
}
//# sourceMappingURL=NewsFilterAgent.js.map