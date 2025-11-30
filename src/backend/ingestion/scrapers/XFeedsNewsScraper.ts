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
      const opmlPath = path.join(process.cwd(), 'ia.opml');

      if (!fs.existsSync(opmlPath)) {
        console.warn('OPML file not found at:', opmlPath);
        return [];
      }

      const feeds = parseOpml(opmlPath);
      console.log(`Found ${feeds.length} X feeds in OPML.`);

      // Prioritize feeds with lightbrd.com (more reliable) and take 15 feeds
      const lightbrdFeeds = feeds.filter(feed => feed.xmlUrl.includes('lightbrd.com'));
      const xcancelFeeds = feeds.filter(feed => feed.xmlUrl.includes('xcancel.com'));

      const selectedFeeds = [
        ...lightbrdFeeds.slice(0, 8), // Take up to 8 lightbrd feeds
        ...xcancelFeeds.slice(0, 7)   // Take up to 7 xcancel feeds
      ];

      console.log(`Selected ${selectedFeeds.length} feeds: ${lightbrdFeeds.length} from lightbrd.com, ${xcancelFeeds.length} from xcancel.com`);

      let allNews: NewsItem[] = [];

      for (const feed of selectedFeeds) {
        console.log(`Fetching X feed: ${feed.title} (${feed.xmlUrl})`);
        try {
          // Use Playwright to bypass bot protection
          const pageContent = await this.newsScraper.fetchPageContent(feed.xmlUrl);

          if (!pageContent || pageContent.trim().length === 0) {
            console.warn(`Empty content from feed: ${feed.title}`);
            continue;
          }

          // Check if we got redirected or got an error page
          if (pageContent.includes('302 Found') || pageContent.includes('<title>302')) {
            console.warn(`Feed ${feed.title} redirected, skipping...`);
            continue;
          }

          let entries: any[] = [];
          let $: any;

          // Try XML parsing first
          try {
            $ = cheerio.load(pageContent, { xmlMode: true });
            entries = $('item').toArray();
          } catch (e) {
            console.warn(`XML parsing failed for ${feed.title}, trying HTML...`);
          }

          // If no entries in XML mode, try HTML parsing
          if (entries.length === 0) {
            $ = cheerio.load(pageContent);
            entries = $('item').toArray();

            // If still no entries, maybe content is in <pre> tag
            if (entries.length === 0) {
              const preText = $('pre').text();
              if (preText) {
                try {
                  const $xml = cheerio.load(preText, { xmlMode: true });
                  entries = $xml('item').toArray();
                } catch (e) {
                  console.warn(`Failed to parse <pre> content for ${feed.title}`);
                }
              }
            }
          }

          if (entries.length === 0) {
            console.warn(`No entries found in feed: ${feed.title}`);
            continue;
          }

          console.log(`Found ${entries.length} entries in ${feed.title}`);

          entries = entries.slice(0, 5); // Top 5 per feed

          const feedItems = entries.map(element => {
            const title = $(element).find('title').text().trim();
            const link = $(element).find('link').text().trim();
            const pubDate = $(element).find('pubDate').text().trim();
            const description = $(element).find('description').text().trim();

            // Skip if missing essential fields
            if (!title && !description) {
              return null;
            }

            // For X/Twitter RSS, the description is usually the tweet content.
            const content = description || title;

            return {
              title: (title || description).substring(0, 200),
              source: `X - ${feed.title}`,
              url: link,
              published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
              content: content,
              sentiment: 'neutral',
              timestamp: pubDate ? new Date(pubDate) : new Date(),
            } as NewsItem;
          }).filter(item => item !== null) as NewsItem[];

          allNews = [...allNews, ...feedItems];
          console.log(`Added ${feedItems.length} items from ${feed.title}`);
        } catch (err) {
          console.error(
            `Failed to fetch X feed ${feed.title}:`,
            err instanceof Error ? err.message : String(err)
          );
        }
      }

      console.log(`Total news items collected: ${allNews.length}`);
      return allNews;
    } catch (error) {
      console.error('Error processing OPML feeds:', error);
      return [];
    }
  }
}