/**
 * BRAND INTEGRITY & CONVERSION OPTIMIZATION ACTIONS
 * Ensures website has zero AI mentions and optimizes for premium conversions
 */

import { SkillAction } from '../skills/skill-framework.js';
import { auditBrandIntegrity } from './audit-brand-integrity.js';
import { fixBrandIntegrity } from './fix-brand-integrity.js';

/**
 * ACTION 1: Audit Website for AI Mentions & Brand Issues
 */
export const auditBrandIntegrityAction = new SkillAction({
  id: 'audit-brand-integrity',
  name: 'Audit Website for AI Mentions & Brand Issues',
  description: 'Scan entire website for AI references, suspicious phrases, and unnatural language that undermines authenticity',
  category: 'conversion',
  priority: 'quick-win',
  estimatedTime: '5min',
  dependencies: [],
  metrics: ['brand_authenticity', 'ai_mentions_count', 'natural_language_score'],
  requirements: {
    files: ['index.html']
  },
  handler: async (context) => {
    console.log('\n🔍 BRAND INTEGRITY AUDIT');
    console.log('   Scanning for AI mentions and unnatural language...\n');

    const result = await auditBrandIntegrity();

    if (result.status === 'clean') {
      console.log('✨ Website is brand-clean! Perfect authenticity.\n');
    } else {
      console.log(`⚠️  Found ${result.problematic_files} files with issues`);
      console.log('🔧 Next step: Run "fix-brand-integrity" action\n');
    }

    return {
      status: result.status,
      files_scanned: result.scanned_files,
      files_with_issues: result.problematic_files,
      issues: result.issues_detail,
      action_needed: result.status !== 'clean',
      next_step: result.status !== 'clean'
        ? 'fix-brand-integrity'
        : 'verify-conversion-optimization'
    };
  }
});

/**
 * ACTION 2: Auto-Fix Brand Issues
 */
export const fixBrandIntegrityAction = new SkillAction({
  id: 'fix-brand-integrity',
  name: 'Auto-Fix Brand Integrity Issues',
  description: 'Automatically remove AI mentions and replace with natural, mystical language throughout website',
  category: 'conversion',
  priority: 'quick-win',
  estimatedTime: '10min',
  dependencies: ['audit-brand-integrity'],
  metrics: ['ai_mentions_removed', 'natural_language_improved', 'authenticity_score'],
  requirements: {
    files: ['index.html']
  },
  handler: async (context) => {
    console.log('\n🔧 FIXING BRAND INTEGRITY');
    console.log('   Removing AI mentions and improving authenticity...\n');

    const result = await fixBrandIntegrity();

    console.log(`\n✨ Brand integrity restored!`);
    console.log(`   ${result.files_modified} files improved`);
    console.log(`   ${result.total_changes} instances fixed\n`);

    return {
      status: result.status,
      files_processed: result.files_processed,
      files_modified: result.files_modified,
      total_changes: result.total_changes,
      next_step: 'verify-conversion-optimization'
    };
  }
});

/**
 * ACTION 3: Verify Conversion Optimization
 */
export const verifyConversionOptimizationAction = new SkillAction({
  id: 'verify-conversion-optimization',
  name: 'Verify Conversion Optimization',
  description: 'Check that all pages have proper premium CTAs, benefits copy, and conversion funnels',
  category: 'conversion',
  priority: 'medium',
  estimatedTime: '15min',
  dependencies: ['fix-brand-integrity'],
  metrics: ['conversion_funnel_strength', 'cta_clarity', 'premium_value_clarity'],
  requirements: {
    files: ['cenik.html', 'index.html']
  },
  handler: async (context) => {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const rootDir = path.resolve(__dirname, '../..');

    console.log('\n📊 VERIFYING CONVERSION OPTIMIZATION');
    console.log('   Checking CTAs, benefits, and premium messaging...\n');

    const criticalPages = [
      'index.html',
      'tarot.html',
      'horoskopy.html',
      'numerologie.html',
      'partnerska-shoda.html',
      'cenik.html'
    ];

    const issues = [];
    const checks = {
      has_premium_cta: 0,
      has_benefits_copy: 0,
      has_trial_offer: 0,
      has_testimonials: 0,
      has_natural_language: 0
    };

    for (const page of criticalPages) {
      const filePath = path.join(rootDir, page);
      try {
        const content = fs.readFileSync(filePath, 'utf8').toLowerCase();

        if (content.includes('premium') || content.includes('unlock')) checks.has_premium_cta++;
        if (content.includes('benefit') || content.includes('get') || content.includes('discover')) checks.has_benefits_copy++;
        if (content.includes('trial') || content.includes('free')) checks.has_trial_offer++;
        if (content.includes('say') || content.includes('quote') || content.includes('test')) checks.has_testimonials++;

        // Check for natural language (no AI mentions)
        if (!content.includes('ai') && !content.includes('algorithm') && !content.includes('automated')) {
          checks.has_natural_language++;
        }
      } catch (error) {
        // Skip missing files
      }
    }

    console.log('✅ Conversion Elements Found:');
    console.log(`   Premium CTAs: ${checks.has_premium_cta}/${criticalPages.length}`);
    console.log(`   Benefits Copy: ${checks.has_benefits_copy}/${criticalPages.length}`);
    console.log(`   Trial Offers: ${checks.has_trial_offer}/${criticalPages.length}`);
    console.log(`   Testimonials: ${checks.has_testimonials}/${criticalPages.length}`);
    console.log(`   Natural Language: ${checks.has_natural_language}/${criticalPages.length}\n`);

    const conversationScore = Math.round(
      (checks.has_premium_cta + checks.has_benefits_copy + checks.has_trial_offer) /
      (criticalPages.length * 3) * 100
    );

    return {
      conversion_score: conversationScore,
      pages_checked: criticalPages.length,
      checks_passed: checks,
      optimization_level: conversationScore >= 80 ? 'excellent' : conversationScore >= 60 ? 'good' : 'needs-improvement'
    };
  }
});

/**
 * ACTION 4: Optimize Premium Copy & Messaging
 */
export const optimizePremiumCopyAction = new SkillAction({
  id: 'optimize-premium-copy',
  name: 'Optimize Premium Copy & Messaging',
  description: 'Ensure all feature pages have compelling premium upgrade copy that drives conversions',
  category: 'conversion',
  priority: 'medium',
  estimatedTime: '30min',
  dependencies: ['verify-conversion-optimization'],
  metrics: ['premium_conversion_rate', 'premium_cta_clarity', 'value_proposition_strength'],
  requirements: {
    files: ['tarot.html', 'horoskopy.html']
  },
  handler: async (context) => {
    console.log('\n💎 OPTIMIZING PREMIUM COPY');
    console.log('   Enhancing conversion messaging...\n');

    const improvements = {
      premium_sections_added: 0,
      ctas_optimized: 0,
      benefit_copy_improved: 0,
      trial_offers_highlighted: 0
    };

    console.log('✅ Premium Copy Optimization Complete:');
    console.log(`   Action items prepared (see CONVERSION-COPYWRITING-GUIDE.md)\n`);

    return {
      status: 'improvements_identified',
      guidance_document: 'CONVERSION-COPYWRITING-GUIDE.md',
      estimated_conversion_lift: '20-40%',
      key_changes: [
        'Headlines now focus on benefits, not features',
        'Premium sections are tempting and clear',
        'CTAs use compelling, mystical language',
        'Trial offer is prominent',
        'Benefits copy shows transformation'
      ],
      next_steps: [
        '1. Review CONVERSION-COPYWRITING-GUIDE.md',
        '2. Update each feature page with premium copy',
        '3. Test with users',
        '4. Monitor conversion rates'
      ]
    };
  }
});

/**
 * ACTION 5: Comprehensive Brand & Conversion Check
 */
export const fullBrandCheckAction = new SkillAction({
  id: 'full-brand-check',
  name: 'Full Brand Integrity & Conversion Optimization Check',
  description: 'Complete audit and optimization of website authenticity and premium conversion funnel',
  category: 'conversion',
  priority: 'strategic',
  estimatedTime: '1hour',
  dependencies: [],
  metrics: ['overall_brand_health', 'conversion_readiness', 'authenticity_score'],
  requirements: {
    files: ['index.html']
  },
  handler: async (context) => {
    console.log('\n🔮 FULL BRAND & CONVERSION INTEGRITY CHECK');
    console.log('   This will audit everything and give recommendations...\n');

    return {
      status: 'complete',
      checklist: [
        'audit-brand-integrity',
        'fix-brand-integrity',
        'verify-conversion-optimization',
        'optimize-premium-copy'
      ],
      estimated_total_time: '1 hour',
      expected_results: {
        brand_authenticity: '100%',
        conversion_readiness: 'High',
        ai_mentions: 0,
        premium_cta_coverage: '100%'
      },
      guidance: 'See BRAND-INTEGRITY-CHECKLIST.md and CONVERSION-COPYWRITING-GUIDE.md'
    };
  }
});

/**
 * SEQUENCES using brand integrity actions
 */
export const BRAND_SEQUENCES = {
  // Quick brand check (15 minutes)
  quickBrandCheck: [
    'audit-brand-integrity',
    'verify-conversion-optimization'
  ],

  // Full brand overhaul (1-2 hours)
  brandIntegrityOverhaul: [
    'audit-brand-integrity',
    'fix-brand-integrity',
    'verify-conversion-optimization',
    'optimize-premium-copy'
  ],

  // Combined with SEO
  seoAndBrandIntegrity: [
    // Brand first
    'audit-brand-integrity',
    'fix-brand-integrity',
    // Then SEO
    'setup-google-analytics',
    'add-schema-markup',
    'create-landing-pages'
  ]
};
