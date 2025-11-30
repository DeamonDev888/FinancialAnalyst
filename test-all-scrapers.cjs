const axios = require('axios');

const scrapers = [
  {
    name: 'X/Twitter Feeds',
    urls: ['https://lightbrd.com/dan_abramov/rss', 'https://xcancel.com/katecrawford/rss']
  },
  {
    name: 'Zero Hedge',
    urls: ['https://www.zerohedge.com/rss.xml', 'https://www.zerohedge.com/rss/']
  },
  {
    name: 'CNBC',
    urls: ['https://www.cnbc.com/id/100003114/device/rss/rss.html']
  },
  {
    name: 'Financial Juice',
    urls: ['https://www.financialjuice.com/rss.xml']
  },
  {
    name: 'CBOE',
    urls: ['https://www.cboe.com/us/options/trading_tools/resources/options_feed.rss']
  },
  {
    name: 'BLS',
    urls: ['https://www.bls.gov/opub/tsp/rss.htm']
  }
];

async function testScraper(name, urls) {
  console.log(`\n🧪 Testing ${name}...`);

  for (const url of urls) {
    try {
      console.log(`  Testing: ${url}`);

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        }
      });

      const content = response.data;
      const hasXmlDeclaration = content.includes('<?xml');
      const hasRssTag = content.includes('<rss') || content.includes('<RSS');
      const hasItemTag = content.includes('<item>') || content.includes('<item ');
      const hasCloudflare = content.includes('Just a moment') || content.includes('Cloudflare');

      console.log(`    ✅ Status: ${response.status} - Length: ${content.length}`);
      console.log(`    📄 XML declaration: ${hasXmlDeclaration ? 'Yes' : 'No'}`);
      console.log(`    📡 RSS tag: ${hasRssTag ? 'Yes' : 'No'}`);
      console.log(`    📰 Items found: ${hasItemTag ? 'Yes' : 'No'}`);

      if (hasCloudflare) {
        console.log(`    🛡️  Cloudflare protection: Yes`);
      }

      if (response.status === 200 && (hasRssTag || hasItemTag)) {
        console.log(`    ✅ ${name} looks functional!`);
        return true;
      } else {
        console.log(`    ❌ ${name} not working properly`);
        return false;
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      return false;
    }
  }

  return false;
}

async function testAPIs() {
  console.log('\n🔗 Testing APIs...');

  // Test Finnhub API
  try {
    console.log('  Testing Finnhub...');
    const finnhubResponse = await axios.get('https://finnhub.io/api/v1/news?category=general&token=demo', { timeout: 5000 });
    console.log(`    ✅ Finnhub: ${finnhubResponse.status} - Found ${finnhubResponse.data.length} items`);
  } catch (error) {
    console.log(`    ❌ Finnhub error: ${error.message}`);
  }

  // Test FMP API
  try {
    console.log('  Testing Financial Modeling Prep...');
    const fmpResponse = await axios.get('https://financialmodelingprep.com/api/v3/fmp/articles?page=0&size=5&apikey=demo', { timeout: 5000 });
    console.log(`    ✅ FMP: ${fmpResponse.status} - Found articles`);
  } catch (error) {
    console.log(`    ❌ FMP error: ${error.message}`);
  }

  // Test NewsAPI
  try {
    console.log('  Testing NewsAPI...');
    const newsResponse = await axios.get('https://newsapi.org/v2/everything?q=finance&pageSize=5&apiKey=demo', { timeout: 5000 });
    console.log(`    ✅ NewsAPI: ${newsResponse.status} - Found ${newsResponse.data.articles?.length || 0} articles`);
  } catch (error) {
    console.log(`    ❌ NewsAPI error: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 Testing all news sources...\n');

  const results = [];

  for (const scraper of scrapers) {
    const working = await testScraper(scraper.name, scraper.urls);
    results.push({ name: scraper.name, working });
  }

  await testAPIs();

  console.log('\n📊 SUMMARY:');
  console.log('='.repeat(50));

  const working = results.filter(r => r.working);
  const notWorking = results.filter(r => !r.working);

  console.log(`\n✅ Working sources (${working.length}):`);
  working.forEach(r => console.log(`  - ${r.name}`));

  console.log(`\n❌ Not working sources (${notWorking.length}):`);
  notWorking.forEach(r => console.log(`  - ${r.name}`));

  console.log('\n💡 RECOMMENDATIONS:');
  if (working.length === 0) {
    console.log('  - Focus on APIs instead of RSS scraping');
    console.log('  - Consider premium news sources');
    console.log('  - Use institutional RSS feeds (FRED, BLS)');
  } else {
    console.log('  - Prioritize working RSS sources');
    console.log('  - Combine with API sources for diversity');
  }
}

main().catch(console.error);