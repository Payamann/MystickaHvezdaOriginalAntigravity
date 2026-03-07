/**
 * Smart Sequencing Engine
 * Automatically recommend best action sequence based on current metrics and goals
 */

import { MockAnalyticsAPI } from '../integrations/google-analytics-api.js';

/**
 * Action impact profile - estimates for each action
 * These are conservative estimates based on typical improvements
 */
const ACTION_IMPACT_PROFILE = {
  'setup-google-analytics': {
    conversion_rate: 0.2,      // Can identify leaks in funnel
    user_insights: 0.8,
    time_minutes: 15,
    priority: 10,
    dependencies: []
  },
  'add-schema-markup': {
    ctr: 20,                   // 20% improvement in CTR from rich snippets
    organic_traffic: 15,       // 15% more organic visibility
    time_minutes: 15,
    priority: 8,
    dependencies: []
  },
  'create-landing-pages': {
    organic_traffic: 45,       // 45% more traffic from keyword-targeted pages
    trial_conversion: 2.0,     // 2% absolute conversion improvement
    time_minutes: 10,
    priority: 9,
    dependencies: ['setup-google-analytics']
  },
  'generate-rss-feed': {
    organic_traffic: 10,       // Via syndication + backlinks
    email_subscribers: 25,     // RSS drives newsletter signup
    time_minutes: 5,
    priority: 5,
    dependencies: []
  },
  'audit-brand-integrity': {
    authenticity_score: 0.3,   // 30% improvement when issues found
    conversion_rate: 0.5,      // Trust = conversions
    time_minutes: 5,
    priority: 10,              // Must run first!
    dependencies: []
  },
  'fix-brand-integrity': {
    authenticity_score: 20,    // 20+ point improvement
    conversion_rate: 1.5,      // 1.5% conversion boost from trust
    premium_conversion: 3.0,   // Big impact on paid tier
    time_minutes: 10,
    priority: 10,
    dependencies: ['audit-brand-integrity']
  },
  'verify-conversion-optimization': {
    conversion_rate: 0.3,      // Identifies what's wrong
    cta_coverage: 0.8,
    time_minutes: 15,
    priority: 7,
    dependencies: []
  },
  'optimize-premium-copy': {
    premium_conversion: 5.0,   // 5% absolute increase in paid signups
    trial_conversion: 2.5,
    time_minutes: 30,
    priority: 8,
    dependencies: ['verify-conversion-optimization']
  }
};

/**
 * Smart recommender
 */
export class SmartSequencer {
  constructor(analyticsAPI = null) {
    this.api = analyticsAPI || new MockAnalyticsAPI();
  }

  /**
   * Recommend best sequence for a goal
   */
  async recommendSequence(goal, timebudgetMinutes = 120, currentMetrics = null) {
    // If metrics not provided, fetch them
    if (!currentMetrics) {
      currentMetrics = await this._getCurrentMetrics();
    }

    // Analyze what's wrong
    const issues = this._identifyIssues(currentMetrics);

    // Score each action
    const actionScores = this._scoreActions(goal, issues, currentMetrics);

    // Build sequence respecting dependencies
    const sequence = this._buildSequence(actionScores, timebudgetMinutes);

    return {
      recommended_sequence: sequence,
      estimated_time: sequence.reduce((t, aid) => t + (ACTION_IMPACT_PROFILE[aid]?.time_minutes || 0), 0),
      goal,
      projected_impact: this._projectImpact(sequence, currentMetrics, goal),
      reasoning: this._generateReasoning(sequence, goal, issues),
      current_state: {
        issues_found: issues,
        metrics: currentMetrics
      }
    };
  }

  /**
   * Get current metrics from analytics
   */
  async _getCurrentMetrics() {
    try {
      const funnel = await this.api.getConversionFunnel('2024-03-01', '2024-03-07');
      return {
        ctr: 2.1,
        organic_traffic: 450,
        conversion_rate: 2.8,
        trial_conversion: 1.5,
        premium_conversion: 0.8,
        email_subscribers: 150,
        authenticity_score: 75,
        page_views: 1200,
        ...funnel
      };
    } catch {
      return null;
    }
  }

  /**
   * Identify what's problematic
   */
  _identifyIssues(metrics) {
    const issues = [];

    if (!metrics) return issues;

    if (metrics.authenticity_score < 85) {
      issues.push({
        type: 'brand_integrity',
        severity: 'high',
        description: 'Brand authenticity needs improvement',
        fix_actions: ['audit-brand-integrity', 'fix-brand-integrity']
      });
    }

    if (metrics.ctr < 3.0) {
      issues.push({
        type: 'organic_visibility',
        severity: 'medium',
        description: 'CTR below average, rich snippets could help',
        fix_actions: ['add-schema-markup', 'create-landing-pages']
      });
    }

    if (metrics.conversion_rate < 3.0) {
      issues.push({
        type: 'conversion_funnel',
        severity: 'high',
        description: 'Conversion rate is low',
        fix_actions: ['verify-conversion-optimization', 'optimize-premium-copy']
      });
    }

    if (metrics.trial_conversion < 2.0) {
      issues.push({
        type: 'trial_signup',
        severity: 'medium',
        description: 'Not converting free users to trial',
        fix_actions: ['optimize-premium-copy', 'create-landing-pages']
      });
    }

    if (metrics.email_subscribers < 500) {
      issues.push({
        type: 'audience_building',
        severity: 'low',
        description: 'Email list is small',
        fix_actions: ['generate-rss-feed']
      });
    }

    return issues;
  }

  /**
   * Score each action for goal achievement
   */
  _scoreActions(goal, issues, currentMetrics) {
    const scores = new Map();

    for (const [actionId, profile] of Object.entries(ACTION_IMPACT_PROFILE)) {
      let score = 0;

      // Impact on goal
      if (goal === 'increase_conversion' && profile.conversion_rate) {
        score += profile.conversion_rate * 10;
      }
      if (goal === 'increase_trial_signup' && profile.trial_conversion) {
        score += profile.trial_conversion * 10;
      }
      if (goal === 'increase_organic_traffic' && profile.organic_traffic) {
        score += profile.organic_traffic * 10;
      }
      if (goal === 'increase_ctr' && profile.ctr) {
        score += profile.ctr * 10;
      }
      if (goal === 'brand_integrity' && profile.authenticity_score) {
        score += profile.authenticity_score * 5;
      }

      // Fixes known issues
      for (const issue of issues) {
        if (issue.fix_actions.includes(actionId)) {
          score += issue.severity === 'high' ? 30 : issue.severity === 'medium' ? 20 : 10;
        }
      }

      // Time efficiency bonus (quick wins)
      if (profile.time_minutes <= 15) {
        score += 10;
      }

      // Priority bonus
      score += profile.priority * 2;

      scores.set(actionId, {
        action_id: actionId,
        score: Math.round(score * 10) / 10,
        impact_profile: profile
      });
    }

    // Sort by score
    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Build sequence respecting dependencies
   */
  _buildSequence(scoredActions, timebudgetMinutes) {
    const sequence = [];
    const resolved = new Set();
    let timeUsed = 0;

    // Track which actions we've added
    const actionScoreMap = new Map();
    for (const scored of scoredActions) {
      actionScoreMap.set(scored.action_id, scored);
    }

    // Greedily add highest-score actions if dependencies met
    const toProcess = [...scoredActions];

    while (toProcess.length > 0 && timeUsed < timebudgetMinutes) {
      // Find highest-score action with met dependencies
      let bestIdx = -1;

      for (let i = 0; i < toProcess.length; i++) {
        const action = toProcess[i];
        const profile = ACTION_IMPACT_PROFILE[action.action_id];

        // Check dependencies
        const depsMetL = profile.dependencies.every(dep => resolved.has(dep));
        if (!depsMetL) continue;

        // Check time
        const timeNeeded = profile.time_minutes || 15;
        if (timeUsed + timeNeeded > timebudgetMinutes) continue;

        // This is a candidate
        if (bestIdx === -1 || toProcess[i].score > toProcess[bestIdx].score) {
          bestIdx = i;
        }
      }

      if (bestIdx === -1) break; // No more actions fit

      const chosen = toProcess[bestIdx];
      sequence.push(chosen.action_id);
      resolved.add(chosen.action_id);
      timeUsed += (ACTION_IMPACT_PROFILE[chosen.action_id]?.time_minutes || 0);
      toProcess.splice(bestIdx, 1);
    }

    return sequence;
  }

  /**
   * Project impact of sequence
   */
  _projectImpact(sequence, currentMetrics, goal) {
    let projectedMetrics = { ...currentMetrics };

    for (const actionId of sequence) {
      const profile = ACTION_IMPACT_PROFILE[actionId];
      if (!profile) continue;

      // Apply each metric impact
      for (const [metric, impact] of Object.entries(profile)) {
        if (typeof impact === 'number' && metric !== 'time_minutes' && metric !== 'priority') {
          if (!projectedMetrics[metric]) {
            projectedMetrics[metric] = 0;
          }

          // Impacts can be absolute or relative
          if (impact > 0 && impact < 1) {
            // Relative: 0.2 = 20% improvement
            projectedMetrics[metric] *= (1 + impact);
          } else {
            // Absolute: 20 = +20 percentage points
            projectedMetrics[metric] += impact;
          }
        }
      }
    }

    // Calculate goal improvement
    const goalMetric = goal
      .replace('increase_', '')
      .replace(/_/g, ' ');

    const improvement = projectedMetrics[goalMetric] - (currentMetrics[goalMetric] || 0);
    const percentImprovement = currentMetrics[goalMetric]
      ? ((improvement / currentMetrics[goalMetric]) * 100)
      : 0;

    return {
      current: currentMetrics[goalMetric] || 0,
      projected: Math.round(projectedMetrics[goalMetric] * 100) / 100,
      improvement,
      percent_improvement: Math.round(percentImprovement * 10) / 10
    };
  }

  /**
   * Generate human-readable reasoning
   */
  _generateReasoning(sequence, goal, issues) {
    const lines = [];

    if (issues.length > 0) {
      lines.push('Issues identified:');
      for (const issue of issues) {
        lines.push(`  • ${issue.description} (${issue.severity})`);
      }
      lines.push('');
    }

    lines.push('Recommended sequence:');
    for (let i = 0; i < sequence.length; i++) {
      const actionId = sequence[i];
      const profile = ACTION_IMPACT_PROFILE[actionId];
      lines.push(`  ${i + 1}. ${actionId} (${profile?.time_minutes || 0} min)`);
    }

    lines.push('');
    lines.push(`Total time: ${sequence.reduce((t, id) => t + (ACTION_IMPACT_PROFILE[id]?.time_minutes || 0), 0)} minutes`);
    lines.push(`Goal: Improve ${goal.replace('_', ' ')}`);

    return lines.join('\n');
  }

  /**
   * Get recommendations for multiple goals
   */
  async getMultiGoalRecommendations(goals = [], timeBudgetMinutes = 120) {
    const currentMetrics = await this._getCurrentMetrics();

    const recommendations = {};
    for (const goal of goals) {
      recommendations[goal] = await this.recommendSequence(goal, timeBudgetMinutes, currentMetrics);
    }

    return recommendations;
  }
}

export default SmartSequencer;
