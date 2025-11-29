"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FinnhubClient_1 = require("../ingestion/FinnhubClient");
async function testFinnhub() {
    console.log('Testing FinnhubClient...');
    const client = new FinnhubClient_1.FinnhubClient();
    try {
        console.log('Fetching SP500 Data...');
        const data = await client.fetchSP500Data();
        console.log('Result:', data);
    }
    catch (error) {
        console.error('Error:', error);
    }
}
testFinnhub();
