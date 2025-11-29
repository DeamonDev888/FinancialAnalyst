"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const BlsScraper_1 = require("../ingestion/BlsScraper");
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
async function main() {
    console.log('Starting BLS Scraper...');
    const scraper = new BlsScraper_1.BlsScraper();
    try {
        console.log('Calling scrapeLatestNumbers...');
        const data = await scraper.scrapeLatestNumbers();
        console.log('Scrape finished. Data length:', data.length);
        console.log('Scraped Data:', JSON.stringify(data, null, 2));
        if (data.length > 0) {
            console.log('Saving to database...');
            await scraper.saveToDatabase(data);
            console.log('Successfully saved data to database.');
        }
        else {
            console.log('No data found to save.');
        }
    }
    catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
    finally {
        console.log('Closing scraper...');
        await scraper.close();
        console.log('Scraper closed.');
    }
}
main();
//# sourceMappingURL=scrape_bls.js.map