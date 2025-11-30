const { chromium } = require('playwright');
const cheerio = require('cheerio');

async function testSimpleXFeed() {
  console.log('🧪 Testing simple X feed fetch...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Test a lightbrd.com feed first (more reliable)
    const testUrl = 'https://lightbrd.com/dan_abramov/rss';
    console.log(`Testing: ${testUrl}`);

    await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const content = await page.content();
    console.log(`Content length: ${content.length}`);

    if (content.includes('302 Found')) {
      console.log('❌ Got redirected');
    } else {
      console.log('✅ Got content');

      // Save content to inspect
      console.log('First 500 characters:');
      console.log(content.substring(0, 500));

      // Try to parse as XML
      try {
        const $ = cheerio.load(content, { xmlMode: true });
        const items = $('item').toArray();
        console.log(`Found ${items.length} items in XML mode`);

        if (items.length > 0) {
          // Display first item
          const firstItem = $(items[0]);
          const title = firstItem.find('title').text();
          const link = firstItem.find('link').text();
          const pubDate = firstItem.find('pubDate').text();
          const description = firstItem.find('description').text();

          console.log('\n📰 First item:');
          console.log(`Title: ${title}`);
          console.log(`Link: ${link}`);
          console.log(`Date: ${pubDate}`);
          console.log(`Description: ${description?.substring(0, 100)}...`);
        }
      } catch (parseError) {
        console.log('❌ XML parsing failed');
      }

      // Try HTML parsing
      try {
        console.log('\n🔍 Trying HTML parsing...');
        const $html = cheerio.load(content);
        const items = $html('item').toArray();
        console.log(`Found ${items.length} items in HTML mode`);

        // Also check for pre tags
        const preContent = $html('pre').text();
        if (preContent) {
          console.log(`Found pre tag with ${preContent.length} characters`);
          console.log('First 200 chars of pre:');
          console.log(preContent.substring(0, 200));
        }
      } catch (htmlError) {
        console.log('❌ HTML parsing failed');
      }
    }

    await context.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testSimpleXFeed().catch(console.error);