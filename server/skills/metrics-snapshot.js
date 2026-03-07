/**
 * Metrics Snapshot System
 * Automatically measure before/after impact of skill actions
 */

import { MockAnalyticsAPI } from '../integrations/google-analytics-api.js';

/**
 * Captures metrics before and after action execution
 * Calculates impact and ROI
 */
export class MetricsSnapshot {
  constructor(analyticsAPI = null) {
    this.api = analyticsAPI || new MockAnalyticsAPI();
    this.snapshots = [];
  }

  /**
   * Take snapshot of current metrics
   */
  async capture(label = 'snapshot') {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

      const metrics = {
        timestamp: now.toISOString(),
        label,
        core: await this.api.getMetrics(
          sevenDaysAgo.toISOString().split('T')[0],
          now.toISOString().split('T')[0]
        ),
        funnel: await this.api.getConversionFunnel(
          sevenDaysAgo.toISOString().split('T')[0],
          now.toISOString().split('T')[0]
        ),
        traffic: await this.api.getTrafficSources(
          sevenDaysAgo.toISOString().split('T')[0],
          now.toISOString().split('T')[0]
        ),
        topPages: await this.api.getTopPages(
          sevenDaysAgo.toISOString().split('T')[0],
          now.toISOString().split('T')[0]
        )
      };

      this.snapshots.push(metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to capture metrics:', error.message);
      return null;
    }
  }

  /**
   * Calculate impact between two snapshots
   */
  calculateImpact(beforeSnapshot, afterSnapshot) {
    const impact = {
      timestamp: new Date().toISOString(),
      metrics: {},
      percentage_changes: {},
      interpretation: ''
    };

    // Core metrics comparison
    if (beforeSnapshot.core && afterSnapshot.core) {
      impact.metrics.users_change = (afterSnapshot.core.activeUsers || 0) -
                                     (beforeSnapshot.core.activeUsers || 0);
      impact.metrics.sessions_change = (afterSnapshot.core.sessions || 0) -
                                       (beforeSnapshot.core.sessions || 0);
      impact.metrics.conversion_change = (afterSnapshot.core.conversion_rate || 0) -
                                         (beforeSnapshot.core.conversion_rate || 0);

      // Calculate percentages
      if (beforeSnapshot.core.activeUsers) {
        impact.percentage_changes.users =
          (impact.metrics.users_change / beforeSnapshot.core.activeUsers) * 100;
      }
      if (beforeSnapshot.core.conversion_rate) {
        impact.percentage_changes.conversion =
          (impact.metrics.conversion_change / beforeSnapshot.core.conversion_rate) * 100;
      }
    }

    // Generate interpretation
    impact.interpretation = this._generateInterpretation(impact);

    return impact;
  }

  /**
   * Generate human-readable interpretation
   */
  _generateInterpretation(impact) {
    const lines = [];

    if (impact.metrics.users_change > 0) {
      const pct = impact.percentage_changes.users?.toFixed(1) || 0;
      lines.push(`📈 +${impact.metrics.users_change} active users (+${pct}%)`);
    } else if (impact.metrics.users_change < 0) {
      lines.push(`📉 ${impact.metrics.users_change} active users`);
    }

    if (impact.metrics.conversion_change > 0) {
      lines.push(`🎯 +${impact.metrics.conversion_change.toFixed(2)}% conversion rate`);
    }

    if (impact.metrics.sessions_change > 0) {
      lines.push(`🔄 +${impact.metrics.sessions_change} sessions`);
    }

    return lines.length > 0 ? lines.join('\n') : 'No significant changes detected';
  }

  /**
   * Estimate ROI (time investment vs value gain)
   */
  estimateROI(actionTimeMinutes, impact) {
    const metricsValue = {
      users: 15,           // Worth $15 per new user
      conversion: 2.5,     // Worth $2.50 per 1% conversion increase
      revenue_potential: 50 // Value of completed conversions
    };

    let totalValue = 0;

    if (impact.metrics.users_change > 0) {
      totalValue += impact.metrics.users_change * metricsValue.users;
    }

    if (impact.metrics.conversion_change > 0) {
      totalValue += impact.metrics.conversion_change * 100 * metricsValue.conversion;
    }

    const timeInvestment = (actionTimeMinutes / 60) * 50; // Value of 1 hour = $50

    return {
      estimated_value: totalValue.toFixed(2),
      time_investment: timeInvestment.toFixed(2),
      roi: totalValue / timeInvestment,
      roi_ratio: `${(totalValue / timeInvestment).toFixed(2)}:1`,
      verdict: totalValue > timeInvestment ? '✅ Worth it' : '⚠️  Monitor'
    };
  }

  /**
   * Create wrapper for action execution
   */
  async wrapAction(action, actionTimeMinutes) {
    return async (context) => {
      // Before snapshot
      console.log(`📸 Capturing before metrics...`);
      const before = await this.capture('before');

      // Execute action
      const result = await action.handler(context);

      // Wait a bit (simulating real-world delay)
      // In production, metrics take hours/days to stabilize
      await new Promise(r => setTimeout(r, 1000));

      // After snapshot
      console.log(`📸 Capturing after metrics...`);
      const after = await this.capture('after');

      // Calculate impact
      const impact = this.calculateImpact(before, after);
      const roi = this.estimateROI(actionTimeMinutes, impact);

      console.log(`\n📊 IMPACT ANALYSIS:`);
      console.log(`${impact.interpretation}`);
      console.log(`\n💰 ROI Estimate:`);
      console.log(`   Value: $${roi.estimated_value}`);
      console.log(`   Time: $${roi.time_investment}`);
      console.log(`   Ratio: ${roi.roi_ratio}`);
      console.log(`   ${roi.verdict}\n`);

      return {
        ...result,
        metrics: {
          before: before.core,
          after: after.core,
          impact,
          roi
        }
      };
    };
  }

  /**
   * Get all snapshots
   */
  getSnapshots() {
    return this.snapshots;
  }

  /**
   * Generate report
   */
  generateReport() {
    if (this.snapshots.length < 2) {
      return 'Not enough snapshots to generate report';
    }

    const report = {
      total_snapshots: this.snapshots.length,
      timeline: this.snapshots.map(s => s.timestamp),
      metrics_progression: []
    };

    for (let i = 0; i < this.snapshots.length - 1; i++) {
      const impact = this.calculateImpact(this.snapshots[i], this.snapshots[i + 1]);
      report.metrics_progression.push({
        from: this.snapshots[i].label,
        to: this.snapshots[i + 1].label,
        ...impact
      });
    }

    return report;
  }
}

/**
 * Create metricsSnapshot middleware for SkillAction
 */
export function withMetricsTracking(action, analyticsAPI, estimatedTimeMinutes = 15) {
  const snapshot = new MetricsSnapshot(analyticsAPI);
  const originalHandler = action.handler;

  action.handler = async (context) => {
    const wrappedHandler = await snapshot.wrapAction(
      { handler: originalHandler },
      estimatedTimeMinutes
    );
    return wrappedHandler(context);
  };

  return { action, snapshot };
}

export default MetricsSnapshot;
