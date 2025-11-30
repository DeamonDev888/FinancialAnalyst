#!/usr/bin/env node

/**
 * Test simple de la fonction RSS
 */

import * as fs from 'fs';
import * as path from 'path';

// Fonction RSS simplifiée pour test
async function fetchRssFeed(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? require('https') : require('http');
    protocol
      .get(url, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          const xml2js = require('xml2js');
          xml2js.parseString(data, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .on('error', err => {
        reject(err);
      });
  });
}

function extractRssItems(rssData, maxItems = 5) {
  try {
    const items = rssData.rss?.channel?.[0]?.item || rssData.feed?.entry || [];
    return items.slice(0, maxItems).map(item => {
      const title = item.title?.[0] || item.title || 'Titre non disponible';
      const link = item.link?.[0]?._?.href || item.link?.[0] || 'Lien non disponible';
      const description =
        item.description?.[0] || item.summary?.[0] || 'Description non disponible';
      const pubDate = item.pubDate?.[0] || item.published?.[0] || 'Date non disponible';
      return {
        title,
        link,
        description: description.length > 150 ? description.substring(0, 150) + '...' : description,
        pubDate: new Date(pubDate).toLocaleDateString('fr-FR'),
      };
    });
  } catch (error) {
    console.error('Error extracting RSS items:', error);
    return [];
  }
}

async function testRssFromOpml(opmlPath) {
  try {
    console.log(`🔍 Test RSS depuis: ${opmlPath}`);

    if (!fs.existsSync(opmlPath)) {
      console.error(`❌ Fichier non trouvé: ${opmlPath}`);
      return null;
    }

    const xml = fs.readFileSync(opmlPath, 'utf8');
    const regex = /<outline[^>]*text="([^"]*)"[^>]*xmlUrl="([^"]*)"[^>]*htmlUrl="([^"]*)"[^>]*\/>/g;
    const feeds = [];
    let match;

    while ((match = regex.exec(xml)) !== null) {
      feeds.push({
        title: match[1],
        xmlUrl: match[2],
        htmlUrl: match[3],
      });
    }

    console.log(`✅ ${feeds.length} flux trouvés dans l'OPML`);

    if (feeds.length === 0) {
      console.log('❌ Aucun flux à traiter');
      return [];
    }

    const results = [];
    let totalNewArticles = 0;

    // Tester avec les 3 premiers flux
    const testFeeds = feeds.slice(0, 3);

    for (const feed of testFeeds) {
      try {
        console.log(`🔄 Test flux: ${feed.title} - ${feed.xmlUrl}`);
        const rssData = await fetchRssFeed(feed.xmlUrl);
        const items = extractRssItems(rssData, 2);

        console.log(`   📄 ${items.length} articles trouvés`);

        if (items.length > 0) {
          results.push({
            title: feed.title,
            items: items,
            htmlUrl: feed.htmlUrl,
            newItemsCount: items.length,
          });
          totalNewArticles += items.length;
        }

        // Petit délai
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Erreur pour ${feed.title}:`, error.message);
      }
    }

    console.log(`✅ Test RSS terminé: ${totalNewArticles} articles trouvés`);
    return results;
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    return null;
  }
}

// Fonction principale
async function main() {
  console.log('🧪 Test de la fonction RSS...\n');

  const opmlPaths = [
    path.resolve(process.cwd(), 'ia.opml'),
    path.resolve(process.cwd(), 'mes-comptes-x.opml'),
  ];

  for (const opmlPath of opmlPaths) {
    console.log(`\n📂 Test avec: ${opmlPath}`);
    const result = await testRssFromOpml(opmlPath);

    if (result && result.length > 0) {
      console.log('🎉 SUCCÈS ! Articles RSS récupérés:\n');
      result.forEach((feed, index) => {
        console.log(`\n--- Flux ${index + 1}: ${feed.title} ---`);
        console.log(`Articles trouvés: ${feed.newItemsCount}`);
        feed.items.forEach((item, itemIndex) => {
          console.log(`  ${itemIndex + 1}. ${item.title}`);
          console.log(`     📅 ${item.pubDate}`);
          console.log(`     🔗 ${item.link}`);
        });
      });
    } else {
      console.log('❌ ÉCHEC du test RSS');
    }
  }
}

main().catch(console.error);