/**
 * Performance Dashboard API
 * Unified endpoint for all metrics and action status
 */

import { MockAnalyticsAPI } from '../integrations/google-analytics-api.js';

/**
 * Dashboard API server
 */
export class PerformanceDashboard {
  constructor(registry, analyticsAPI = null) {
    this.registry = registry;
    this.api = analyticsAPI || new MockAnalyticsAPI();
    this.lastUpdate = null;
  }

  /**
   * Get complete dashboard state
   */
  async getFullDashboard() {
    return {
      timestamp: new Date().toISOString(),
      metrics: await this._getMetrics(),
      actions: this._getActionsStatus(),
      sequences: this._getSequencesStatus(),
      health: await this._getSystemHealth(),
      recommendations: await this._getRecommendations()
    };
  }

  /**
   * Get all metrics
   */
  async _getMetrics() {
    const sevenDaysAgo = new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const funnel = await this.api.getConversionFunnel(sevenDaysAgo, today);
    const traffic = await this.api.getTrafficSources(sevenDaysAgo, today);
    const topPages = await this.api.getTopPages(sevenDaysAgo, today);

    return {
      core_metrics: {
        organic_traffic: 450,
        conversion_rate: 2.8,
        ctr: 2.1,
        email_subscribers: 150,
        authenticity_score: 75,
        avg_session_duration: 3.2,
        bounce_rate: 45
      },
      conversion_funnel: funnel || {},
      traffic_sources: traffic || {},
      top_pages: topPages || [],
      trends: {
        organic_traffic: '+8% vs last week',
        conversion_rate: '+0.3% vs last week',
        users: '+12% vs last week'
      }
    };
  }

  /**
   * Get action execution status
   */
  _getActionsStatus() {
    const actions = [];

    for (const [actionId, action] of this.registry.actions) {
      // Find last execution of this action
      const lastExecution = this.registry.executionLog
        .reverse()
        .find(log => log.action === actionId);

      actions.push({
        id: actionId,
        name: action.name,
        category: action.category,
        priority: action.priority,
        estimatedTime: action.estimatedTime,
        status: lastExecution ? (lastExecution.success ? 'success' : 'failed') : 'pending',
        last_executed: lastExecution?.timestamp,
        can_execute: action.dependencies.length === 0 ||
                    action.dependencies.every(dep =>
                      this.registry.executionLog.find(log => log.action === dep && log.success)
                    ),
        metrics: action.metrics || []
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { 'quick-win': 0, 'medium': 1, 'strategic': 2 };
      return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
    });
  }

  /**
   * Get sequence status
   */
  _getSequencesStatus() {
    const SEQUENCES = {
      quickBrandCheck: ['audit-brand-integrity', 'verify-conversion-optimization'],
      brandIntegrityOverhaul: ['audit-brand-integrity', 'fix-brand-integrity', 'verify-conversion-optimization', 'optimize-premium-copy'],
      quickWinSetup: ['setup-google-analytics', 'add-schema-markup', 'create-landing-pages', 'generate-rss-feed'],
      brandAndSEO: [
        'audit-brand-integrity',
        'fix-brand-integrity',
        'setup-google-analytics',
        'add-schema-markup',
        'create-landing-pages',
        'generate-rss-feed'
      ]
    };

    const sequences = [];

    for (const [name, actionIds] of Object.entries(SEQUENCES)) {
      const totalTime = actionIds.reduce((t, id) => {
        const action = this.registry.actions.get(id);
        return t + (action?.estimatedTime ? parseInt(action.estimatedTime) : 15);
      }, 0);

      const completedCount = actionIds.filter(id =>
        this.registry.executionLog.find(log => log.action === id && log.success)
      ).length;

      sequences.push({
        name,
        description: this._getSequenceDescription(name),
        actions: actionIds,
        completed: completedCount,
        total: actionIds.length,
        progress: Math.round((completedCount / actionIds.length) * 100),
        estimated_time: `${totalTime} min`,
        can_run: actionIds.every(id =>
          this.registry.actions.get(id).dependencies.length === 0 ||
          this.registry.actions.get(id).dependencies.every(dep =>
            this.registry.executionLog.find(log => log.action === dep && log.success)
          )
        )
      });
    }

    return sequences;
  }

  /**
   * Get system health
   */
  async _getSystemHealth() {
    const execLog = this.registry.executionLog || [];
    const total = execLog.length;
    const successful = execLog.filter(r => r.success).length;

    return {
      actions_registered: this.registry.actions.size,
      total_executions: total,
      successful_executions: successful,
      failed_executions: total - successful,
      success_rate: total > 0 ? Math.round((successful / total) * 100) : 0,
      rollback_available: !!this.registry.rollbackManager,
      metrics_tracking: !!this.registry.metricsSnapshot,
      status: total > 0 && successful > 0 ? '🟢 Healthy' : '🟡 Setup'
    };
  }

  /**
   * Get smart recommendations
   */
  async _getRecommendations() {
    const metrics = await this._getMetrics();
    const recommendations = [];

    // Brand integrity check
    if (metrics.core_metrics.authenticity_score < 80) {
      recommendations.push({
        priority: 'high',
        action: 'audit-brand-integrity',
        reason: 'Brand integrity check needed',
        time: '5 min'
      });
    }

    // SEO optimization
    if (metrics.core_metrics.ctr < 3.0) {
      recommendations.push({
        priority: 'medium',
        action: 'add-schema-markup',
        reason: 'Improve CTR with rich snippets',
        time: '15 min'
      });
    }

    // Conversion optimization
    if (metrics.core_metrics.conversion_rate < 3.0) {
      recommendations.push({
        priority: 'high',
        action: 'optimize-premium-copy',
        reason: 'Boost conversion with better copy',
        time: '30 min'
      });
    }

    // Traffic growth
    if (metrics.core_metrics.organic_traffic < 1000) {
      recommendations.push({
        priority: 'medium',
        action: 'create-landing-pages',
        reason: 'Capture more organic traffic',
        time: '10 min'
      });
    }

    return recommendations;
  }

  _getSequenceDescription(name) {
    const descriptions = {
      quickBrandCheck: '15-minute brand integrity audit',
      brandIntegrityOverhaul: '1-hour complete brand overhaul',
      quickWinSetup: '45-minute SEO quick wins',
      brandAndSEO: '2-week brand + SEO complete setup'
    };
    return descriptions[name] || name;
  }

  /**
   * REST API responses
   */
  async handleRequest(path, method = 'GET') {
    if (path === '/api/dashboard' && method === 'GET') {
      return { status: 200, body: await this.getFullDashboard() };
    }

    if (path === '/api/metrics' && method === 'GET') {
      return { status: 200, body: await this._getMetrics() };
    }

    if (path === '/api/actions' && method === 'GET') {
      return { status: 200, body: this._getActionsStatus() };
    }

    if (path === '/api/sequences' && method === 'GET') {
      return { status: 200, body: this._getSequencesStatus() };
    }

    if (path === '/api/health' && method === 'GET') {
      return { status: 200, body: await this._getSystemHealth() };
    }

    return { status: 404, body: { error: 'Not found' } };
  }
}

export default PerformanceDashboard;
