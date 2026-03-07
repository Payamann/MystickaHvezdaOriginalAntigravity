/**
 * Add JSON-LD Schema Markup to HTML Pages
 * Improves SEO with rich snippets and structured data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Schema markup generators
const schemas = {
  // Organization schema - for homepage
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
    "contact": {
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

  // BreadcrumbList schema - for navigation hierarchy
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

  // Article schema - for blog posts
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

  // FAQPage schema - for FAQ sections
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

  // Service schema - for premium services
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
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock"
    }
  }),

  // Review schema - for testimonials
  review: (reviews) => ({
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "ratingValue": reviews.averageRating || 4.8,
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": reviews.count || 0,
    "reviewCount": reviews.count || 0
  }),

  // WebApplication schema - for PWA
  webApplication: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Mystická Hvězda",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    }
  },

  // SoftwareApplication schema - for app features
  features: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Mystická Hvězda",
    "description": "Kompletní průvodce astrologií, tarotem, numerologií a více",
    "operatingSystem": "Web",
    "applicationCategory": "LifestyleApplication",
    "featureList": [
      "Denní horoskopy",
      "Čtení tarot",
      "Numerologická kalkulačka",
      "Natalitní mapa",
      "Sladěnost partnerů",
      "Andělská čísla",
      "Astrální mapy",
      "Runy"
    ]
  }
};

// Function to inject schema into HTML
function injectSchemaIntoHTML(filePath, schemaMarkup, schemaType) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if schema already exists
    const schemaId = `data-schema-type="${schemaType}"`;
    if (content.includes(schemaId)) {
      console.log(`⏭️  ${path.basename(filePath)} - Schema already exists`);
      return;
    }

    // Create schema script tag
    const schemaScript = `<script type="application/ld+json" ${schemaId}>
${JSON.stringify(schemaMarkup, null, 2)}
</script>`;

    // Inject before closing </head> tag
    if (content.includes('</head>')) {
      content = content.replace('</head>', schemaScript + '\n</head>');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.basename(filePath)} - Added ${schemaType} schema`);
    } else {
      console.log(`⚠️  ${path.basename(filePath)} - No </head> tag found`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🔍 Adding JSON-LD Schema Markup to pages...\n');

try {
  // Add Organization schema to homepage
  const indexPath = path.join(rootDir, 'index.html');
  injectSchemaIntoHTML(indexPath, schemas.organization, 'organization');

  // Add WebApplication schema to homepage
  injectSchemaIntoHTML(indexPath, schemas.webApplication, 'webApplication');

  // Add schema to key pages
  const pagesToOptimize = [
    { file: 'tarot.html', type: 'service', schema: schemas.service({
      name: 'Čtení tarotu',
      description: 'Online čtení tarotu s interpetací',
      price: '0'
    })},
    { file: 'horoskopy.html', type: 'service', schema: schemas.service({
      name: 'Denní horoskop',
      description: 'Personalizovaný denní horoskop pro vaše znamení',
      price: '0'
    })},
    { file: 'numerologie.html', type: 'service', schema: schemas.service({
      name: 'Numerologická analýza',
      description: 'Kalkulačka čísel osudu a životního čísla',
      price: '99'
    })},
    { file: 'natalni-karta.html', type: 'service', schema: schemas.service({
      name: 'Natalitní mapa',
      description: 'Přesná analýza vaší natalitní mapy',
      price: '199'
    })},
    { file: 'partnerska-shoda.html', type: 'service', schema: schemas.service({
      name: 'Sladěnost partnerů',
      description: 'Astrologická analýza kompatibility',
      price: '149'
    })}
  ];

  pagesToOptimize.forEach(page => {
    const filePath = path.join(rootDir, page.file);
    if (fs.existsSync(filePath)) {
      injectSchemaIntoHTML(filePath, page.schema, page.type);
    }
  });

  // Add BreadcrumbList to navigation pages
  const navBreadcrumbs = [
    { name: 'Domů', url: '/' },
    { name: 'Astrologie', url: '/horoskopy.html' },
    { name: 'Tarot', url: '/tarot.html' },
    { name: 'Numerologie', url: '/numerologie.html' }
  ];

  const breadcrumbSchema = schemas.breadcrumbs(navBreadcrumbs);
  injectSchemaIntoHTML(path.join(rootDir, 'index.html'), breadcrumbSchema, 'breadcrumbs');

  console.log('\n✨ Schema markup configuration:');
  console.log('   - Organization: Identifies your business');
  console.log('   - WebApplication: Describes PWA capabilities');
  console.log('   - Service: Shows services in search results');
  console.log('   - BreadcrumbList: Improves navigation in search');

  console.log('\n📊 Expected improvements:');
  console.log('   - Rich snippets in search results');
  console.log('   - Better CTR (click-through rate)');
  console.log('   - Improved SERP appearance');
  console.log('   - Enhanced schema.org validation');

  console.log('\n🔗 Validate schemas at: https://schema.org/validator');

} catch (error) {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}

console.log('\n✅ Schema markup setup complete!\n');
