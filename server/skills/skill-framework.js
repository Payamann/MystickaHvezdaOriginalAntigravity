/**
 * Scalable SEO & Growth Skill Framework
 * Architecture for sustainable feature expansion
 */

// CURRENT STATE - Identified Issues:
// 1. ❌ Actions defined in JSON, no clear orchestration
// 2. ❌ Scripts are standalone, no unified interface
// 3. ❌ No template/pattern for new scripts
// 4. ❌ Documentation scattered across files
// 5. ❌ No error handling standardization
// 6. ❌ No progress tracking or state management
// 7. ❌ No dependency management between actions

// PROPOSED SOLUTION: Plugin Architecture with Action Registry

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RollbackManager, withRollback } from './rollback-manager.js';
import { MetricsSnapshot, withMetricsTracking } from './metrics-snapshot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

/**
 * Core Action Framework
 * Every skill action follows this standard interface
 */
class SkillAction {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.category = config.category; // 'analytics', 'seo', 'content', 'conversion', 'email'
    this.priority = config.priority || 'medium'; // 'quick-win', 'medium', 'strategic'
    this.estimatedTime = config.estimatedTime; // '5min', '15min', '1hour'
    this.dependencies = config.dependencies || []; // Other action IDs
    this.metrics = config.metrics || []; // What gets measured
    this.requirements = config.requirements || {}; // .env vars, APIs, etc
    this.handler = config.handler; // Function that runs the action
  }

  async validate() {
    // Check all dependencies are met
    if (this.requirements.env) {
      const missing = this.requirements.env.filter(
        v => !process.env[v]
      );
      if (missing.length > 0) {
        throw new Error(
          `Missing environment variables: ${missing.join(', ')}\n` +
          `Required for: ${this.name}`
        );
      }
    }
    return true;
  }

  async execute(context = {}) {
    console.log(`\n📌 Executing: ${this.name}`);
    console.log(`   Description: ${this.description}`);
    console.log(`   Priority: ${this.priority}`);
    console.log(`   Est. Time: ${this.estimatedTime}\n`);

    try {
      await this.validate();
      const result = await this.handler(context);

      console.log(`\n✅ ${this.name} completed successfully`);
      return {
        success: true,
        action: this.id,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`\n❌ ${this.name} failed:`, error.message);
      return {
        success: false,
        action: this.id,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * Action Registry - Central management of all skill actions
 */
class ActionRegistry {
  constructor(enableRollback = true, enableMetrics = true) {
    this.actions = new Map();
    this.executionLog = [];
    this.rollbackManager = enableRollback ? new RollbackManager() : null;
    this.metricsSnapshot = enableMetrics ? new MetricsSnapshot() : null;
  }

  register(action) {
    if (this.actions.has(action.id)) {
      throw new Error(`Action already registered: ${action.id}`);
    }

    // Wrap with rollback support
    if (this.rollbackManager) {
      withRollback(action, this.rollbackManager);
    }

    this.actions.set(action.id, action);
    console.log(`✓ Registered action: ${action.id}`);
  }

  async executeSequence(actionIds, context = {}) {
    console.log(`\n🚀 Starting action sequence: ${actionIds.join(' → ')}\n`);

    const results = [];
    const resolvedDeps = new Set();

    for (const actionId of actionIds) {
      if (!this.actions.has(actionId)) {
        throw new Error(`Unknown action: ${actionId}`);
      }

      const action = this.actions.get(actionId);

      // Check dependencies
      const unmet = action.dependencies.filter(dep => !resolvedDeps.has(dep));
      if (unmet.length > 0) {
        throw new Error(
          `Action '${actionId}' has unmet dependencies: ${unmet.join(', ')}`
        );
      }

      // Execute action
      const result = await action.execute(context);
      results.push(result);
      this.executionLog.push(result);

      if (result.success) {
        resolvedDeps.add(actionId);
        // Pass result to next action
        context[actionId] = result.result;
      } else {
        console.log(`\n⚠️  Stopping sequence due to failure`);
        break;
      }
    }

    return {
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }

  getActionsByCategory(category) {
    return Array.from(this.actions.values()).filter(a => a.category === category);
  }

  getQuickWins() {
    return Array.from(this.actions.values()).filter(a => a.priority === 'quick-win');
  }

  getExecutionSummary() {
    return {
      total: this.executionLog.length,
      successful: this.executionLog.filter(r => r.success).length,
      failed: this.executionLog.filter(r => !r.success).length,
      byAction: [...new Set(this.executionLog.map(r => r.action))].length
    };
  }

  /**
   * Rollback management
   */
  async rollbackLastAction() {
    if (!this.rollbackManager) {
      console.log('❌ Rollback not enabled');
      return false;
    }
    return this.rollbackManager.rollbackLast();
  }

  showRollbackHistory() {
    if (!this.rollbackManager) {
      console.log('❌ Rollback not enabled');
      return;
    }
    this.rollbackManager.listSavepoints();
  }

  /**
   * Metrics management
   */
  async captureMetricsSnapshot(label = 'manual-snapshot') {
    if (!this.metricsSnapshot) {
      console.log('❌ Metrics tracking not enabled');
      return null;
    }
    return this.metricsSnapshot.capture(label);
  }

  showMetricsReport() {
    if (!this.metricsSnapshot) {
      console.log('❌ Metrics tracking not enabled');
      return;
    }
    const report = this.metricsSnapshot.generateReport();
    console.log('\n📊 METRICS REPORT\n');
    console.log(JSON.stringify(report, null, 2));
  }
}

/**
 * EXAMPLE: New standardized action using the framework
 */
const analyticsAction = new SkillAction({
  id: 'setup-google-analytics',
  name: 'Setup Google Analytics 4',
  description: 'Initialize GA4 tracking with GDPR compliance',
  category: 'analytics',
  priority: 'quick-win',
  estimatedTime: '15min',
  dependencies: [],
  metrics: [
    'events_tracked',
    'conversion_funnel_visibility',
    'user_behavior_data'
  ],
  requirements: {
    env: ['GA4_MEASUREMENT_ID'],
    files: ['index.html'],
    api: ['analytics.google.com']
  },
  handler: async (context) => {
    // Implementation here
    return {
      script_generated: true,
      snippet_added: true,
      metrics_configured: ['view_feature', 'cta_click', 'purchase']
    };
  }
});

/**
 * TEMPLATE for adding new actions
 * Copy this when creating new skill functionality
 */
const newActionTemplate = new SkillAction({
  id: 'action-id-here',
  name: 'Human Readable Action Name',
  description: 'What this action does and what problem it solves',
  category: 'seo|analytics|content|conversion|email',
  priority: 'quick-win|medium|strategic',
  estimatedTime: '5min|15min|1hour',
  dependencies: ['other-action-id'], // Run after these
  metrics: [
    'metric_1', // What improves?
    'metric_2'
  ],
  requirements: {
    env: ['ENV_VAR_NAME'],
    files: ['required-file.html'],
    services: ['service-name']
  },
  handler: async (context) => {
    // Your implementation
    // context contains results from dependent actions
    // Return object with results
    return {
      files_created: [],
      links_added: [],
      metrics_affected: []
    };
  }
});

/**
 * PREDEFINED ACTION SEQUENCES - Quick reference for common workflows
 */
const SEQUENCES = {
  // 15-minute quick brand check
  quickBrandCheck: [
    'audit-brand-integrity',
    'verify-conversion-optimization'
  ],

  // 1 hour brand overhaul
  brandIntegrityOverhaul: [
    'audit-brand-integrity',
    'fix-brand-integrity',
    'verify-conversion-optimization',
    'optimize-premium-copy'
  ],

  // 45-minute quick wins (original)
  quickWinSetup: [
    'setup-google-analytics',
    'add-schema-markup',
    'create-landing-pages',
    'generate-rss-feed'
  ],

  // SEO foundation (2 weeks)
  seoFoundation: [
    'setup-google-analytics',
    'add-schema-markup',
    'create-landing-pages',
    'generate-rss-feed',
    'build-internal-links',
    'optimize-robots-txt',
    'create-seo-pages'
  ],

  // Brand + SEO combined (2 weeks)
  brandAndSEO: [
    'audit-brand-integrity',
    'fix-brand-integrity',
    'setup-google-analytics',
    'add-schema-markup',
    'create-landing-pages',
    'generate-rss-feed'
  ],

  // Conversion optimization (1 month)
  conversionOptimization: [
    'audit-brand-integrity',
    'fix-brand-integrity',
    'setup-google-analytics', // Prerequisite
    'create-landing-pages',
    'optimize-premium-copy',
    'setup-ab-testing',
    'track-paywall-events'
  ],

  // Email & Growth (1 month)
  emailGrowth: [
    'setup-email-service',
    'create-email-sequences',
    'optimize-newsletter-popup',
    'segment-users',
    'automate-recovery'
  ],

  // Full implementation (3 months)
  fullImplementation: [
    // Phase 0: Brand Integrity (CRITICAL FIRST)
    'audit-brand-integrity',
    'fix-brand-integrity',
    'verify-conversion-optimization',
    // Phase 1: Analytics & Data
    'setup-google-analytics',
    'track-paywall-events',
    'create-conversion-dashboard',
    // Phase 2: SEO
    'add-schema-markup',
    'create-landing-pages',
    'generate-rss-feed',
    'build-internal-links',
    // Phase 3: Engagement
    'setup-email-service',
    'create-email-sequences',
    'setup-ab-testing',
    'optimize-premium-copy',
    // Phase 4: Growth
    'optimize-keywords',
    'create-content-plan',
    'setup-affiliate-tracking'
  ]
};

/**
 * CONFIGURATION SYSTEM
 * Centralized config for all skill actions
 */
const skillConfig = {
  // Environment requirements
  requiredEnv: {
    GA4_MEASUREMENT_ID: 'Google Analytics 4 ID',
    EMAIL_SERVICE_API: 'Email service (ConvertKit, Mailchimp)',
    STRIPE_PUBLISHABLE_KEY: 'Already configured'
  },

  // Feature flags for gradual rollout
  features: {
    analyticsTracking: true,
    schemaMarkup: true,
    landingPages: true,
    rssFeed: true,
    emailAutomation: false, // Coming soon
    abTesting: false,
    affiliateTracking: false
  },

  // Default values
  defaults: {
    language: 'cs',
    currency: 'INR',
    timezone: 'Europe/Prague',
    privacyMode: true // GDPR/CCPA compliance
  },

  // Paths
  paths: {
    scripts: 'server/scripts',
    documentation: '.',
    skills: 'skills',
    public: 'public',
    config: '.env'
  },

  // Metrics definitions
  metrics: {
    organic_traffic: {
      description: 'Monthly organic visitors',
      baseline: 0,
      goal_3m: 1000,
      goal_12m: 10000
    },
    trial_conversion: {
      description: 'Free to trial conversion rate',
      baseline: 0,
      goal_3m: 0.10,
      goal_12m: 0.20
    },
    premium_conversion: {
      description: 'Trial to paid conversion rate',
      baseline: 0,
      goal_3m: 0.15,
      goal_12m: 0.25
    },
    email_subscribers: {
      description: 'Email list size',
      baseline: 0,
      goal_3m: 50,
      goal_12m: 1000
    }
  }
};

/**
 * DOCUMENTATION GENERATOR
 * Auto-generate docs from action definitions
 */
function generateActionDocs(registry) {
  const categories = [...new Set(
    Array.from(registry.actions.values()).map(a => a.category)
  )];

  let docs = '# SEO & Growth Skill - Actions Reference\n\n';

  for (const category of categories) {
    docs += `## ${category.toUpperCase()}\n\n`;

    const actions = registry.getActionsByCategory(category);
    for (const action of actions) {
      docs += `### ${action.name}\n`;
      docs += `**ID:** \`${action.id}\`\n`;
      docs += `**Description:** ${action.description}\n`;
      docs += `**Priority:** ${action.priority}\n`;
      docs += `**Time:** ${action.estimatedTime}\n`;

      if (action.dependencies.length > 0) {
        docs += `**Dependencies:** ${action.dependencies.join(', ')}\n`;
      }

      docs += `**Metrics:** ${action.metrics.join(', ')}\n\n`;
    }
  }

  return docs;
}

/**
 * USAGE EXAMPLE
 */
async function initializeSkill() {
  const registry = new ActionRegistry();

  // Register all actions
  registry.register(analyticsAction);
  // ... register more actions

  // Execute quick win sequence
  const result = await registry.executeSequence(
    SEQUENCES.quickWinSetup
  );

  // View results
  console.log(registry.getExecutionSummary());

  // Generate docs
  const docs = generateActionDocs(registry);
  console.log(docs);
}

export {
  SkillAction,
  ActionRegistry,
  SEQUENCES,
  skillConfig,
  generateActionDocs,
  RollbackManager,
  MetricsSnapshot,
  withRollback,
  withMetricsTracking
};
