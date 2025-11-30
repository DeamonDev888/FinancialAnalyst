const { ZeroHedgeNewsScraper } = require('./src/backend/ingestion/scrapers/ZeroHedgeNewsScraper');

async function testZeroHedge() {
  console.log('🧪 Testing ZeroHedge scraper...');

  const scraper = new ZeroHedgeNewsScraper();

  try {
    await scraper.init();
    console.log('✅ Scraper initialized');

    const news = await scraper.fetchNews();
    console.log(`📰 Found ${news.length} news items`);

    if (news.length > 0) {
      console.log('\n📋 First news item:');
      console.log(`Title: ${news[0].title}`);
      console.log(`URL: ${news[0].url}`);
      console.log(`Content length: ${news[0].content?.length || 0}`);
      console.log(`Date: ${news[0].timestamp}`);
    } else {
      console.log('❌ No news found');
    }

    await scraper.close();
    console.log('✅ Scraper closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testZeroHedge().catch(console.error);