/**
 * Add JSON-LD Schema Markup to HTML Pages
 * Improves SEO with rich snippets and structured data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SkillAction } from '../skills/skill-framework.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Schema markup generators
const schemas = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Mystická Hvězda",
    "description": "Váš osobní průvodce astrologií, tarotem a numerologií",
    "url": "https://mystickahvezda.cz",
    "logo": "https://mystickahvezda.cz/img/logo.webp",
    "sameAs": [
      "https://facebook.com/mystickahvezda",
      "https://instagram.com/mystickahvezda"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "info@mystickahvezda.cz"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CZ",
      "addressLocality": "Česká Republika"
    }
  },

  breadcrumbs: (items) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://mystickahvezda.cz${item.url}`
    }))
  }),

  article: (article) => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.description,
    "image": article.image || "https://mystickahvezda.cz/img/default-featured.webp",
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "author": {
      "@type": "Person",
      "name": article.author || "Mystická Hvězda"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Mystická Hvězda",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mystickahvezda.cz/img/logo.webp"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": article.url
    }
  }),

  faqPage: (faqs) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }),

  service: (service) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.description,
    "provider": {
      "@type": "Organization",
      "name": "Mystická Hvězda"
    },
    "offers": {
      "@type": "Offer",
      "price": service.price,
      "priceCurrency": "CZK",
      "availability": "https://schema.org/InStock"
    }
  }),

  webApplication: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Mystická Hvězda",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CZK"
    }
  }
};

// Inject schema JSON-LD into HTML <head>
function injectSchemaIntoHTML(filePath, schemaMarkup, schemaType) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    const schemaId = `data-schema-type="${schemaType}"`;
    if (content.includes(schemaId)) {
      console.log(`⏭️  ${path.basename(filePath)} - ${schemaType} already exists`);
      return false;
    }

    const schemaScript = `<script type="application/ld+json" ${schemaId}>\n${JSON.stringify(schemaMarkup, null, 2)}\n</script>`;

    if (content.includes('</head>')) {
      content = content.replace('</head>', schemaScript + '\n</head>');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.basename(filePath)} — ${schemaType}`);
      return true;
    }

    console.log(`⚠️  ${path.basename(filePath)} — no </head> found`);
    return false;
  } catch (error) {
    console.error(`❌ ${filePath}: ${error.message}`);
    return false;
  }
}

// Main logic extracted into a reusable function
function runSchemaMarkup() {
  let added = 0;

  const indexPath = path.join(rootDir, 'index.html');
  if (injectSchemaIntoHTML(indexPath, schemas.organization, 'organization')) added++;
  if (injectSchemaIntoHTML(indexPath, schemas.webApplication, 'webApplication')) added++;

  const breadcrumbSchema = schemas.breadcrumbs([
    { name: 'Domů', url: '/' },
    { name: 'Horoskop', url: '/horoskopy.html' },
    { name: 'Tarot', url: '/tarot.html' },
    { name: 'Numerologie', url: '/numerologie.html' }
  ]);
  if (injectSchemaIntoHTML(indexPath, breadcrumbSchema, 'breadcrumbs')) added++;

  const pages = [
    { file: 'tarot.html', name: 'Čtení tarotu', desc: 'Online čtení tarotu s hlubokou interpretací', price: '0' },
    { file: 'horoskopy.html', name: 'Denní horoskop', desc: 'Personalizovaný denní horoskop pro vaše znamení', price: '0' },
    { file: 'numerologie.html', name: 'Numerologická analýza', desc: 'Kalkulačka čísel osudu a životního čísla', price: '99' },
    { file: 'natalni-karta.html', name: 'Natalitní mapa', desc: 'Přesná analýza vaší natalitní mapy', price: '199' },
    { file: 'partnerska-shoda.html', name: 'Sladěnost partnerů', desc: 'Astrologická analýza kompatibility', price: '149' }
  ];

  for (const p of pages) {
    const fp = path.join(rootDir, p.file);
    if (fs.existsSync(fp)) {
      if (injectSchemaIntoHTML(fp, schemas.service({ name: p.name, description: p.desc, price: p.price }), 'service')) added++;
    }
  }

  return added;
}

/**
 * SKILL ACTION export
 */
export const addSchemaMarkupAction = new SkillAction({
  id: 'add-schema-markup',
  name: 'Add JSON-LD Schema Markup',
  description: 'Inject Organization, Service, WebApplication and BreadcrumbList schemas into HTML pages for rich search snippets',
  category: 'seo',
  priority: 'quick-win',
  estimatedTime: '15min',
  dependencies: [],
  metrics: ['search_ctr', 'rich_snippets', 'serp_appearance'],
  requirements: {
    files: ['index.html']
  },
  handler: async () => {
    console.log('\n📐 Adding JSON-LD Schema Markup\n');
    const added = runSchemaMarkup();
    console.log(`\n✅ ${added} schemas added`);
    console.log('   Validate at: https://schema.org/validator\n');
    return {
      schemas_added: added,
      pages_targeted: ['index.html', 'tarot.html', 'horoskopy.html', 'numerologie.html', 'natalni-karta.html', 'partnerska-shoda.html'],
      expected_impact: '20-30% CTR improvement via rich snippets'
    };
  }
});

export default addSchemaMarkupAction;
