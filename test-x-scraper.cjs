const { XFeedsNewsScraper } = require('./src/backend/ingestion/scrapers/XFeedsNewsScraper.js');

async function testXScraper() {
  console.log('🧪 Testing XFeedsNewsScraper...');

  const scraper = new XFeedsNewsScraper();

  try {
    await scraper.init();
    console.log('✅ Scraper initialized');

    const news = await scraper.fetchNews();
    console.log(`📰 Found ${news.length} news items`);

    if (news.length > 0) {
      console.log('\n📋 First few news items:');
      news.slice(0, 5).forEach((item, i) => {
        console.log(`\n${i + 1}. ${item.title}`);
        console.log(`   Source: ${item.source}`);
        console.log(`   Date: ${item.published_at}`);
        console.log(`   Content: ${item.content?.substring(0, 100)}...`);
      });
    } else {
      console.log('❌ No news found');
    }

    await scraper.close();
    console.log('✅ Scraper closed');
  } catch (error) {
    console.error('❌ Error testing scraper:', error);
  }
}

testXScraper().catch(console.error);