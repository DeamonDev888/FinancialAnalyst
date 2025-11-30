import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsScraper } from '../NewsScraper';
import { NewsItem } from '../NewsAggregator';
import { parseOpml } from '../opml_parser';
import * as path from 'path';
import * as fs from 'fs';

export class XFeedsNewsScraper {
  private newsScraper: NewsScraper;

  constructor() {
    this.newsScraper = new NewsScraper();
  }

  async init(): Promise<void> {
    await this.newsScraper.init();
  }

  async close(): Promise<void> {
    await this.newsScraper.close();
  }

  async fetchNews(): Promise<NewsItem[]> {
    try {
      const opmlPath = path.join(process.cwd(), 'mes-comptes-x.opml');

      if (!fs.existsSync(opmlPath)) {
        console.warn('OPML file not found at:', opmlPath);
        return [];
      }

      const feeds = parseOpml(opmlPath);
      console.log(`Found ${feeds.length} X feeds in OPML.`);

      // Randomly select 3 feeds to scrape to avoid rate limits and long execution times
      const shuffled = feeds.sort(() => 0.5 - Math.random());
      const selectedFeeds = shuffled.slice(0, 3);

      let allNews: NewsItem[] = [];

      for (const feed of selectedFeeds) {
        console.log(`Fetching X feed: ${feed.title} (${feed.xmlUrl})`);
        try {
          // Use Playwright to bypass bot protection on xcancel.com
          const pageContent = await this.newsScraper.fetchPageContent(feed.xmlUrl);

          const $ = cheerio.load(pageContent, { xmlMode: true });

          let entries = $('item').toArray();

          // If 0 entries found, maybe it's wrapped in HTML and cheerio didn't parse it as XML root
          if (entries.length === 0) {
            // Try loading as HTML and find 'item'
            const $html = cheerio.load(pageContent);
            entries = $html('item').toArray();

            // If still 0, maybe extract text from 'pre' and parse that
            if (entries.length === 0) {
              const preText = $html('pre').text();
              if (preText) {
                const $xml = cheerio.load(preText, { xmlMode: true });
                entries = $xml('item').toArray();
              }
            }
          }

          entries = entries.slice(0, 5); // Top 5 per feed

          const feedItems = await Promise.all(
            entries.map(async element => {
              const title = $(element).find('title').text();
              const link = $(element).find('link').text();
              const pubDate = $(element).find('pubDate').text();
              const description = $(element).find('description').text();

              // For X/Twitter RSS, the description is usually the tweet content.
              const content = description;

              return {
                title: title.substring(0, 200), // Titles can be long tweets
                source: `X - ${feed.title}`,
                url: link,
                published_at: new Date(pubDate).toISOString(),
                content: content,
                sentiment: 'neutral',
                timestamp: new Date(pubDate),
              } as NewsItem;
            })
          );

          allNews = [...allNews, ...feedItems];
        } catch (err) {
          console.error(
            `Failed to fetch X feed ${feed.title}:`,
            err instanceof Error ? err.message : String(err)
          );
        }
      }

      return allNews;
    } catch (error) {
      console.error('Error processing OPML feeds:', error);
      return [];
    }
  }
}