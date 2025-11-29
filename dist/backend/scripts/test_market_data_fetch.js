"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NewsAggregator_1 = require("../ingestion/NewsAggregator");
async function testMarketDataFetch() {
    console.log('Testing fetchAndSaveMarketData...');
    const aggregator = new NewsAggregator_1.NewsAggregator();
    await aggregator.fetchAndSaveMarketData();
    console.log('Done.');
}
testMarketDataFetch();
