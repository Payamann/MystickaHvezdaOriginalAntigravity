/**
 * CENTRAL ACTION REGISTRATION
 * Single point to register all skill actions with the framework
 */

import { ActionRegistry, SEQUENCES } from './skill-framework.js';

// Import all actions
import { setupAnalyticsAction } from '../scripts/setup-analytics-action.js';
import {
  auditBrandIntegrityAction,
  fixBrandIntegrityAction,
  verifyConversionOptimizationAction,
  optimizePremiumCopyAction
} from '../scripts/brand-integrity-actions.js';

/**
 * Initialize and register all actions
 * Call this once on app startup
 */
export function initializeSkillRegistry() {
  const registry = new ActionRegistry();

  console.log('\n📋 Registering SEO & Growth Skill Actions...\n');

  // Analytics Actions
  registry.register(setupAnalyticsAction);
  console.log('✓ setup-google-analytics');

  // Brand Integrity Actions
  registry.register(auditBrandIntegrityAction);
  console.log('✓ audit-brand-integrity');

  registry.register(fixBrandIntegrityAction);
  console.log('✓ fix-brand-integrity');

  registry.register(verifyConversionOptimizationAction);
  console.log('✓ verify-conversion-optimization');

  registry.register(optimizePremiumCopyAction);
  console.log('✓ optimize-premium-copy');

  console.log('\n✅ All actions registered successfully!\n');

  return registry;
}

/**
 * Get action by ID
 */
export function getAction(registry, actionId) {
  return registry.actions.get(actionId);
}

/**
 * Execute a sequence by name
 */
export async function executeSequence(registry, sequenceName) {
  if (!SEQUENCES[sequenceName]) {
    throw new Error(`Unknown sequence: ${sequenceName}`);
  }

  const actionIds = SEQUENCES[sequenceName];
  console.log(`\n🚀 Executing sequence: ${sequenceName}`);
  console.log(`   Actions: ${actionIds.join(' → ')}\n`);

  return registry.executeSequence(actionIds);
}

/**
 * List all available actions
 */
export function listActions(registry) {
  console.log('\n📊 Available Actions:\n');

  const actions = Array.from(registry.actions.values());
  const byCategory = {};

  for (const action of actions) {
    if (!byCategory[action.category]) {
      byCategory[action.category] = [];
    }
    byCategory[action.category].push(action);
  }

  for (const [category, categoryActions] of Object.entries(byCategory)) {
    console.log(`${category.toUpperCase()}:`);
    for (const action of categoryActions) {
      console.log(`  • ${action.id}`);
      console.log(`    ${action.name}`);
      console.log(`    Time: ${action.estimatedTime}`);
    }
    console.log();
  }
}

/**
 * List all available sequences
 */
export function listSequences() {
  console.log('\n🔄 Available Sequences:\n');

  for (const [name, actions] of Object.entries(SEQUENCES)) {
    console.log(`• ${name}`);
    console.log(`  Actions: ${actions.length}`);
    console.log(`  ${actions.join(' → ')}`);
    console.log();
  }
}

/**
 * Usage Examples
 */
export const EXAMPLES = {
  initializeAndExecute: `
    import { initializeSkillRegistry, executeSequence } from './register-actions.js';

    const registry = initializeSkillRegistry();
    const result = await executeSequence(registry, 'quickBrandCheck');
  `,

  listAvailable: `
    import { initializeSkillRegistry, listActions, listSequences } from './register-actions.js';

    const registry = initializeSkillRegistry();
    listActions(registry);
    listSequences();
  `,

  runSingleAction: `
    import { initializeSkillRegistry, getAction } from './register-actions.js';

    const registry = initializeSkillRegistry();
    const action = getAction(registry, 'audit-brand-integrity');
    const result = await action.execute({});
  `
};

export { SEQUENCES } from './skill-framework.js';
export { ActionRegistry } from './skill-framework.js';
