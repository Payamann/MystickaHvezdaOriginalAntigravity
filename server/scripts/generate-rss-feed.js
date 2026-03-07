/**
 * Generate RSS and JSON Feeds for Blog Posts
 * Boosts discoverability and syndication for organic traffic
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SkillAction } from '../skills/skill-framework.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Sample blog posts — in production this would be read from actual blog HTML files
const blogPosts = [
  {
    id: 'angel-numbers-1111',
    title: 'Andělská čísla 1111: Znamení Synchronicity a Duchovního Probuzení',
    description: 'Pochopte hluboký výnam andělského čísla 1111 a jak vás vaši strážní andělé provázejí.',
    author: 'Mystická Hvězda',
    pubDate: new Date('2024-03-01'),
    link: '/blog/angel-numbers-1111.html',
    category: 'Andělé'
  },
  {
    id: 'mercury-retrograde-guide',
    title: 'Merkur v Retrográdě: Kompletní Průvodce',
    description: 'Zjistěte, jak klidně přeplout bouře Merkura v retrográdě a využít jeho energii pro hlubší sebepoznání.',
    author: 'Mystická Hvězda',
    pubDate: new Date('2024-02-28'),
    link: '/blog/mercury-retrograde.html',
    category: 'Astrologie'
  },
  {
    id: 'tarot-spreads-guide',
    title: 'Průvodce Tarotovými Rozloženími: Od Jednokarta po Keltský Kříž',
    description: 'Naučte se nejpopulárnější tarotová rozložení a jak rozluštit jejich poselství.',
    author: 'Mystická Hvězda',
    pubDate: new Date('2024-02-25'),
    link: '/blog/tarot-spreads.html',
    category: 'Tarot'
  }
];

function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateRSSXML(posts) {
  const items = posts.map(post => `  <item>
    <title>${escapeXML(post.title)}</title>
    <link>https://mystickahvezda.cz${post.link}</link>
    <guid isPermaLink="true">https://mystickahvezda.cz${post.link}</guid>
    <description>${escapeXML(post.description)}</description>
    <author>redakce@mystickahvezda.cz (${escapeXML(post.author)})</author>
    <category>${escapeXML(post.category)}</category>
    <pubDate>${post.pubDate.toUTCString()}</pubDate>
  </item>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mystická Hvězda – Blog</title>
    <link>https://mystickahvezda.cz</link>
    <description>Váš průvodce astrologií, tarotem a numerologií</description>
    <language>cs</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://mystickahvezda.cz/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://mystickahvezda.cz/img/logo.webp</url>
      <title>Mystická Hvězda</title>
      <link>https://mystickahvezda.cz</link>
    </image>
${items}
  </channel>
</rss>`;
}

function generateJSONFeed(posts) {
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Mystická Hvězda – Blog',
    description: 'Váš průvodce astrologií, tarotem a numerologií',
    home_page_url: 'https://mystickahvezda.cz',
    feed_url: 'https://mystickahvezda.cz/feed.json',
    icon: 'https://mystickahvezda.cz/img/logo.webp',
    language: 'cs',
    items: posts.map(post => ({
      id: `https://mystickahvezda.cz${post.link}`,
      url: `https://mystickahvezda.cz${post.link}`,
      title: post.title,
      summary: post.description,
      image: 'https://mystickahvezda.cz/img/og-default.webp',
      date_published: post.pubDate.toISOString(),
      author: { name: post.author },
      tags: [post.category]
    }))
  }, null, 2);
}

function addRSSLinksToHTML(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('application/rss+xml')) return false; // already added

    const links = [
      '  <link rel="alternate" type="application/rss+xml" title="Mystická Hvězda RSS" href="/rss.xml">',
      '  <link rel="alternate" type="application/feed+json" title="Mystická Hvězda JSON Feed" href="/feed.json">'
    ].join('\n');

    if (content.includes('</head>')) {
      content = content.replace('</head>', links + '\n</head>');
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function runGenerateFeeds() {
  // Write RSS
  fs.writeFileSync(path.join(rootDir, 'rss.xml'), generateRSSXML(blogPosts), 'utf8');
  console.log('✅ rss.xml');

  // Write JSON Feed
  fs.writeFileSync(path.join(rootDir, 'feed.json'), generateJSONFeed(blogPosts), 'utf8');
  console.log('✅ feed.json');

  // Add <link> tags to index + blog pages
  let linked = 0;
  for (const page of ['index.html', 'blog.html']) {
    const fp = path.join(rootDir, page);
    if (fs.existsSync(fp) && addRSSLinksToHTML(fp)) {
      console.log(`✅ RSS links → ${page}`);
      linked++;
    }
  }

  return { feeds: 2, pages_linked: linked };
}

/**
 * SKILL ACTION export
 */
export const generateRSSFeedAction = new SkillAction({
  id: 'generate-rss-feed',
  name: 'Generate RSS & JSON Feed',
  description: 'Create RSS 2.0 and JSON Feed for blog syndication and discovery via RSS readers',
  category: 'seo',
  priority: 'quick-win',
  estimatedTime: '5min',
  dependencies: [],
  metrics: ['rss_subscribers', 'syndication_reach', 'referral_traffic'],
  requirements: {},
  handler: async () => {
    console.log('\n📡 Generating RSS & JSON Feeds\n');
    const result = runGenerateFeeds();
    console.log(`\n✅ ${result.feeds} feeds generated, ${result.pages_linked} pages updated`);
    console.log('   Submit rss.xml to Feedly to start building subscribers\n');
    return {
      feeds_created: ['rss.xml', 'feed.json'],
      pages_linked: result.pages_linked,
      feed_urls: {
        rss: 'https://mystickahvezda.cz/rss.xml',
        json: 'https://mystickahvezda.cz/feed.json'
      },
      next_steps: [
        'Submit to Feedly (feedly.com)',
        'Add RSS link to newsletter sign-up form',
        'Include in social media profiles'
      ]
    };
  }
});

export default generateRSSFeedAction;
