/**
 * Conditional Triggers System
 * Automatically execute actions based on file changes, schedule, or metric thresholds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { watch } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

/**
 * Trigger types
 */
const TRIGGER_TYPES = {
  FILE_CHANGED: 'file_changed',
  SCHEDULED: 'scheduled',
  METRIC_THRESHOLD: 'metric_threshold',
  ACTION_COMPLETED: 'action_completed'
};

/**
 * Conditional trigger manager
 */
export class ConditionalTriggers {
  constructor(registry) {
    this.registry = registry;
    this.triggers = [];
    this.executionHistory = [];
    this.watchers = new Map();
    this.scheduledJobs = new Map();
  }

  /**
   * Register a trigger
   */
  registerTrigger(trigger) {
    // Validate trigger
    if (!trigger.event || !TRIGGER_TYPES[trigger.event]) {
      throw new Error(`Invalid trigger event: ${trigger.event}`);
    }

    if (!trigger.action || !this.registry.actions.has(trigger.action)) {
      throw new Error(`Action not found: ${trigger.action}`);
    }

    const triggerConfig = {
      id: `trigger-${Date.now()}-${Math.random()}`,
      event: trigger.event,
      action: trigger.action,
      condition: trigger.condition,
      patterns: trigger.patterns || [],
      cooldown: trigger.cooldown || 0, // Min seconds between executions
      lastExecution: null,
      enabled: true
    };

    this.triggers.push(triggerConfig);
    console.log(`✓ Registered trigger: ${triggerConfig.event} → ${triggerConfig.action}`);

    // Start watchers/schedulers based on event type
    if (trigger.event === 'FILE_CHANGED') {
      this._setupFileWatcher(triggerConfig);
    } else if (trigger.event === 'SCHEDULED') {
      this._setupScheduledJob(triggerConfig, trigger.schedule);
    }

    return triggerConfig;
  }

  /**
   * FILE_CHANGED trigger
   */
  _setupFileWatcher(trigger) {
    if (!trigger.patterns || trigger.patterns.length === 0) {
      trigger.patterns = ['**/*.html'];
    }

    for (const pattern of trigger.patterns) {
      const watchPath = path.resolve(rootDir, pattern.replace('**/', ''));

      const watcher = watch(path.dirname(watchPath), { recursive: true }, (eventType, filename) => {
        if (eventType === 'change' && this._patternMatches(filename, pattern)) {
          this._checkAndExecuteTrigger(trigger, { filename, eventType });
        }
      });

      this.watchers.set(trigger.id, watcher);
    }

    console.log(`  📁 Watching: ${trigger.patterns.join(', ')}`);
  }

  /**
   * SCHEDULED trigger (cron-like)
   */
  _setupScheduledJob(trigger, schedule) {
    // Simple cron parser: "0 0 1 * *" = 1st day of month at midnight
    // For demo, support: daily, weekly, monthly, "HH:MM", "*/5 min"

    let intervalMs = null;

    if (schedule === 'daily') {
      intervalMs = 24 * 60 * 60 * 1000;
    } else if (schedule === 'weekly') {
      intervalMs = 7 * 24 * 60 * 60 * 1000;
    } else if (schedule === 'monthly') {
      intervalMs = 30 * 24 * 60 * 60 * 1000;
    } else if (schedule.includes('min')) {
      const mins = parseInt(schedule.split(' ')[0]);
      intervalMs = mins * 60 * 1000;
    } else {
      console.warn(`Unknown schedule: ${schedule}`);
      return;
    }

    const jobId = setInterval(() => {
      this._checkAndExecuteTrigger(trigger, { reason: 'scheduled', schedule });
    }, intervalMs);

    this.scheduledJobs.set(trigger.id, jobId);
    console.log(`  ⏰ Scheduled: every ${schedule}`);
  }

  /**
   * METRIC_THRESHOLD trigger
   */
  registerMetricTrigger(action, metric, operator, value) {
    return this.registerTrigger({
      event: 'METRIC_THRESHOLD',
      action,
      condition: { metric, operator, value }
    });
  }

  /**
   * Check and execute trigger if conditions met
   */
  async _checkAndExecuteTrigger(trigger, context = {}) {
    // Check cooldown
    if (trigger.lastExecution) {
      const secondsSinceLastExec = (Date.now() - trigger.lastExecution) / 1000;
      if (secondsSinceLastExec < trigger.cooldown) {
        return; // Still in cooldown
      }
    }

    // Evaluate condition if exists
    if (trigger.condition) {
      const conditionMet = await this._evaluateCondition(trigger.condition);
      if (!conditionMet) {
        return; // Condition not met
      }
    }

    // Execute action
    console.log(`\n🔔 TRIGGER FIRED: ${trigger.event}`);
    console.log(`   Action: ${trigger.action}`);
    console.log(`   Context: ${JSON.stringify(context)}`);

    try {
      const action = this.registry.actions.get(trigger.action);
      const result = await action.execute(context);

      trigger.lastExecution = Date.now();

      this.executionHistory.push({
        triggerId: trigger.id,
        action: trigger.action,
        timestamp: new Date().toISOString(),
        success: result.success,
        context
      });

      console.log(`✅ Trigger executed successfully\n`);
    } catch (error) {
      console.error(`❌ Trigger execution failed:`, error.message);
    }
  }

  /**
   * Evaluate condition
   */
  async _evaluateCondition(condition) {
    if (condition.metric && condition.operator && condition.value) {
      // Metric threshold condition
      if (!this.registry.metricsSnapshot) {
        return false;
      }

      const metrics = await this.registry.metricsSnapshot.capture();
      const currentValue = metrics?.core?.[condition.metric];

      if (currentValue === undefined) return false;

      switch (condition.operator) {
        case '<': return currentValue < condition.value;
        case '>': return currentValue > condition.value;
        case '===': return currentValue === condition.value;
        case '!==': return currentValue !== condition.value;
        case '<=': return currentValue <= condition.value;
        case '>=': return currentValue >= condition.value;
        default: return false;
      }
    }

    return true;
  }

  /**
   * Check if filename matches pattern
   */
  _patternMatches(filename, pattern) {
    // Simple glob matching
    const regex = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    return new RegExp(`^${regex}$`).test(filename);
  }

  /**
   * Stop all triggers
   */
  stopAll() {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();

    for (const jobId of this.scheduledJobs.values()) {
      clearInterval(jobId);
    }
    this.scheduledJobs.clear();

    console.log('🛑 All triggers stopped');
  }

  /**
   * Get execution history
   */
  getHistory(limit = 10) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * List all triggers
   */
  listTriggers() {
    console.log('\n📋 Registered Triggers:\n');
    for (let i = 0; i < this.triggers.length; i++) {
      const trigger = this.triggers[i];
      console.log(`${i + 1}. ${trigger.event} → ${trigger.action}`);
      if (trigger.patterns.length > 0) {
        console.log(`   Patterns: ${trigger.patterns.join(', ')}`);
      }
      console.log(`   Status: ${trigger.enabled ? '🟢 Active' : '🔴 Disabled'}`);
      console.log();
    }
  }

  /**
   * Disable trigger
   */
  disableTrigger(triggerId) {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (trigger) {
      trigger.enabled = false;
      console.log(`Trigger ${triggerId} disabled`);
    }
  }

  /**
   * Enable trigger
   */
  enableTrigger(triggerId) {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (trigger) {
      trigger.enabled = true;
      console.log(`Trigger ${triggerId} enabled`);
    }
  }
}

/**
 * Setup standard triggers
 */
export function setupDefaultTriggers(registry) {
  const triggers = new ConditionalTriggers(registry);

  // Brand integrity check on HTML changes
  if (registry.actions.has('audit-brand-integrity')) {
    triggers.registerTrigger({
      event: 'FILE_CHANGED',
      action: 'audit-brand-integrity',
      patterns: ['**/*.html'],
      cooldown: 3600 // Once per hour max
    });
  }

  // Monthly brand overhaul
  if (registry.actions.has('audit-brand-integrity')) {
    triggers.registerTrigger({
      event: 'SCHEDULED',
      action: 'audit-brand-integrity',
      schedule: 'monthly'
    });
  }

  // Conversion optimization if conversion rate drops
  if (registry.metricsSnapshot && registry.actions.has('verify-conversion-optimization')) {
    triggers.registerMetricTrigger(
      'verify-conversion-optimization',
      'conversion_rate',
      '<',
      2.0 // If conversion drops below 2%
    );
  }

  console.log('✓ Default triggers configured');
  return triggers;
}

export default ConditionalTriggers;
