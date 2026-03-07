/**
 * TEMPLATE FOR NEW SKILL ACTIONS
 *
 * Copy this file and replace placeholders to create new actions
 * Usage: cp .action-template.js your-new-action.js
 *
 * CHECKLIST:
 * [ ] Replace [ACTION_ID] with unique kebab-case ID
 * [ ] Replace [Action Name] with readable name
 * [ ] Update description (be specific!)
 * [ ] Set correct category (seo|analytics|conversion|email|content)
 * [ ] Set priority (quick-win|medium|strategic)
 * [ ] Set estimatedTime (5min|15min|30min|1hour)
 * [ ] List dependencies (other action IDs that must run first)
 * [ ] Define metrics this action affects
 * [ ] Add env requirements (if any)
 * [ ] Implement handler function
 * [ ] Add comprehensive comments
 * [ ] Register in skill-framework.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

/**
 * Import SkillAction base class
 */
import { SkillAction } from '../skills/skill-framework.js';

/**
 * DOCUMENTATION
 * ============
 *
 * Action ID: [ACTION_ID]
 * Purpose: [What problem does this solve?]
 *
 * What it does:
 * - Point 1: [Feature/improvement]
 * - Point 2: [Feature/improvement]
 * - Point 3: [Feature/improvement]
 *
 * Files affected:
 * - file1.html
 * - file2.js
 *
 * Metrics improved:
 * - metric1: [expected improvement]
 * - metric2: [expected improvement]
 *
 * When to use:
 * - Scenario 1
 * - Scenario 2
 *
 * Dependencies:
 * - Requires: action-id-1, action-id-2
 * - Conflicts with: action-id-3
 */

export const [ACTION_ID] = new SkillAction({
  // Unique identifier (kebab-case, no spaces)
  id: '[ACTION_ID]',

  // Human-readable name
  name: '[Action Name]',

  // What this action does (one sentence)
  description: '[Description of what this action does]',

  // Category for grouping related actions
  // Options: 'analytics', 'seo', 'content', 'conversion', 'email'
  category: '[CATEGORY]',

  // Priority level (determines recommended order)
  // 'quick-win' = 1-2 weeks (must do first)
  // 'medium' = 1-3 months (build on quick wins)
  // 'strategic' = 3-12 months (long-term growth)
  priority: '[PRIORITY]',

  // How long does this take to implement?
  estimatedTime: '[5min|15min|30min|1hour]',

  // Action IDs that must complete before this one
  // Empty array [] if no dependencies
  dependencies: [
    // 'action-id-1',
    // 'action-id-2'
  ],

  // What metrics/KPIs does this action improve?
  metrics: [
    // 'organic_traffic',
    // 'trial_conversion',
    // 'email_subscribers'
  ],

  // Requirements for this action to run
  requirements: {
    // Environment variables needed
    env: [
      // 'GA4_MEASUREMENT_ID',
      // 'EMAIL_SERVICE_API'
    ],

    // Files that must exist
    files: [
      // 'index.html',
      // 'blog.html'
    ],

    // External APIs/services needed
    api: [
      // 'analytics.google.com',
      // 'stripe.com'
    ]
  },

  /**
   * Main handler function
   *
   * Parameters:
   * - context: Object containing results from dependent actions
   *   Example: context['setup-analytics'] = { result from that action }
   *
   * Returns:
   * - Object with results, what changed, etc.
   * - Must include 'status' field ('success' or 'error')
   */
  handler: async (context) => {
    console.log('\n📋 Action: [Action Name]');
    console.log('   Performing: [What is being done]...\n');

    try {
      // ============
      // YOUR CODE HERE
      // ============

      // Example structure:

      // 1. Validate inputs
      if (!process.env.REQUIRED_ENV_VAR) {
        throw new Error('Missing required environment variable');
      }

      // 2. Read files/data
      const filePath = path.join(rootDir, 'file-to-modify.html');
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // 3. Process/modify
      let content = fs.readFileSync(filePath, 'utf8');
      // ... make modifications

      // 4. Write results
      fs.writeFileSync(filePath, content, 'utf8');

      // 5. Return results
      return {
        status: 'success',
        files_modified: ['file-to-modify.html'],
        metrics_affected: ['organic_traffic'],
        summary: '[What was accomplished]'
      };

    } catch (error) {
      // Error handling is done automatically by SkillAction
      throw error;
    }
  }
});

/**
 * USAGE NOTES
 * ===========
 *
 * When to use this template:
 * 1. Adding new SEO features
 * 2. Adding analytics/tracking
 * 3. Adding email automation
 * 4. Adding conversion optimization
 * 5. Creating new utilities
 *
 * Best practices:
 * - Keep handler functions focused (one responsibility)
 * - Use descriptive logging (what's happening?)
 * - Validate all inputs and dependencies
 * - Return detailed results object
 * - Handle errors gracefully
 * - Test before registering
 *
 * Testing your action:
 *
 *   import { [ACTION_ID] } from './[ACTION_ID].js';
 *
 *   const result = await [ACTION_ID].execute({});
 *   console.log(result);
 *
 * Registering your action:
 *
 *   import { [ACTION_ID] } from './[ACTION_ID].js';
 *   registry.register([ACTION_ID]);
 */

// Export helper functions if needed
export async function [ACTION_ID]_setup() {
  // Helper function for initialization
}

export function [ACTION_ID]_validate(data) {
  // Helper function for validation
  return true;
}
