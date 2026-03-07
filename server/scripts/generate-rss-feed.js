/**
 * Generate RSS Feed for Blog Posts
 * Boosts discoverability and syndication for organic traffic
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Blog posts data - integrate with your actual blog data
const blogPosts = [
  {
    id: 'angel-numbers-1111',
    title: 'Andělská čísla 1111: Znamení Synchronicity a Духовního Probuzení',
    description: 'Pochopte hlubý výnam andělského čísla 1111 a jak vás vaši strážní andělé komunikují.',
    author: 'Mystická Hvězda',
    pubDate: new Date('2024-03-01'),
    link: '/blog/angel-numbers-1111.html',
    category: 'Angels',
    content: 'Andělská čísla jsou spirituální zprávy od vesmíru...'
  },
  {
    id: 'mercury-retrograde-guide',
    title: 'Merkur v Retrográdě: Kompletní Průvodce Přežití',
    description: 'Zjistěte, jak se vypořádat s Merkurem v retrográdě a zbytečně se zbavit jeho energií.',
    author: 'Mystická Hvězda',
    pubDate: new Date('2024-02-28'),
    link: '/blog/mercury-retrograde.html',
    category: 'Astrology',
    content: 'Merkur v retrográdě je často chybně chápán...'
  },
  {
    id: 'tarot-spreads-guide',
    title: 'Průvodce Tarotovými Rozloženími: Od Jednokarta po Keltský Kříž',
    description: 'Naučte se nejpopulárnější tarotová rozložení a jak je interpretovat.',
    author: 'Mystická Hvězda',
    pubDate: new Date('2024-02-25'),
    link: '/blog/tarot-spreads.html',
    category: 'Tarot',
    content: 'Tarotová rozložení jsou klíčem k hlubšímu porozumění...'
  }
];

// RSS feed template
function generateRSSFeed(posts) {
  const feedXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mystická Hvězda - Blog</title>
    <link>https://mystickahvezda.cz</link>
    <description>Váš osobní průvodce astrologií, tarotem a numerologií</description>
    <language>cs</language>
    <image>
      <url>https://mystickahvezda.cz/img/logo.webp</url>
      <title>Mystická Hvězda</title>
      <link>https://mystickahvezda.cz</link>
    </image>
    <atom:link href="https://mystickahvezda.cz/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Mystická Hvězda RSS Generator</generator>
    ${posts.map(post => `
    <item>
      <title>${escapeXML(post.title)}</title>
      <link>https://mystickahvezda.cz${post.link}</link>
      <guid>https://mystickahvezda.cz${post.link}</guid>
      <description>${escapeXML(post.description)}</description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      <author>${post.author}</author>
      <category>${post.category}</category>
      <pubDate>${post.pubDate.toUTCString()}</pubDate>
    </item>
    `).join('')}
  </channel>
</rss>`;

  return feedXML;
}

// Escape XML special characters
function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// JSON Feed (modern alternative)
function generateJSONFeed(posts) {
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Mystická Hvězda - Blog',
    description: 'Váš osobní průvodce astrologií, tarotem a numerologií',
    home_page_url: 'https://mystickahvezda.cz',
    feed_url: 'https://mystickahvezda.cz/feed.json',
    icon: 'https://mystickahvezda.cz/img/logo.webp',
    language: 'cs',
    items: posts.map(post => ({
      id: `https://mystickahvezda.cz${post.link}`,
      url: `https://mystickahvezda.cz${post.link}`,
      title: post.title,
      summary: post.description,
      content_html: post.content,
      image: 'https://mystickahvezda.cz/img/default-featured.webp',
      date_published: post.pubDate.toISOString(),
      author: {
        name: post.author
      },
      tags: [post.category]
    }))
  };

  return JSON.stringify(feed, null, 2);
}

// Add RSS feed links to HTML pages
function addRSSLinkToHTML(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if RSS link already exists
    if (content.includes('rel="alternate" type="application/rss+xml"')) {
      return;
    }

    // Add RSS link to <head>
    const rssLink = '<link rel="alternate" type="application/rss+xml" title="Mystická Hvězda RSS" href="/rss.xml">';
    const jsonFeedLink = '<link rel="alternate" type="application/feed+json" title="Mystická Hvězda JSON Feed" href="/feed.json">';

    if (content.includes('</head>')) {
      content = content.replace('</head>', `  ${rssLink}\n  ${jsonFeedLink}\n</head>`);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Main execution
console.log('📡 Generating RSS and JSON feeds...\n');

try {
  // Generate RSS feed
  const rssFeed = generateRSSFeed(blogPosts);
  const rssPath = path.join(rootDir, 'rss.xml');
  fs.writeFileSync(rssPath, rssFeed, 'utf8');
  console.log('✅ Generated: rss.xml');

  // Generate JSON feed
  const jsonFeed = generateJSONFeed(blogPosts);
  const jsonPath = path.join(rootDir, 'feed.json');
  fs.writeFileSync(jsonPath, jsonFeed, 'utf8');
  console.log('✅ Generated: feed.json');

  // Add RSS links to homepage
  const indexPath = path.join(rootDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    addRSSLinkToHTML(indexPath);
    console.log('✅ Added RSS links to homepage');
  }

  const blogPath = path.join(rootDir, 'blog.html');
  if (fs.existsSync(blogPath)) {
    addRSSLinkToHTML(blogPath);
    console.log('✅ Added RSS links to blog page');
  }

  console.log('\n📊 RSS Feed Benefits:');
  console.log('   - Increases blog discoverability');
  console.log('   - Drives traffic from RSS readers (Feedly, Inoreader, etc.)');
  console.log('   - Enables content syndication');
  console.log('   - Improves SEO through backlinks from RSS aggregators');
  console.log('   - Builds loyal subscriber base\n');

  console.log('🔗 Feed URLs:');
  console.log('   - RSS: https://mystickahvezda.cz/rss.xml');
  console.log('   - JSON: https://mystickahvezda.cz/feed.json\n');

  console.log('📢 Distribution channels:');
  console.log('   - Add to Feedly (feedly.com)');
  console.log('   - Submit to blog aggregators');
  console.log('   - Include in newsletter sign-up form');
  console.log('   - Add to social media profiles');
  console.log('   - Include in email signature\n');

} catch (error) {
  console.error('❌ Error generating feeds:', error.message);
  process.exit(1);
}

console.log('✅ RSS feed setup complete!\n');
