/**
 * Google Analytics API Integration
 * Fetch real metrics to measure action impact
 */

import fetch from 'node-fetch';

/**
 * Google Analytics API client
 * Requires: GOOGLE_APPLICATION_CREDENTIALS env var (service account JSON)
 */
export class GoogleAnalyticsAPI {
  constructor(propertyId, credentialsPath) {
    this.propertyId = propertyId; // GA4 measurement ID
    this.credentialsPath = credentialsPath;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate using service account
   */
  async authenticate() {
    try {
      if (this.accessToken && this.tokenExpiry > Date.now()) {
        return this.accessToken;
      }

      const credentials = require(this.credentialsPath);

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: credentials.client_id,
          client_email: credentials.client_email,
          private_key: credentials.private_key,
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: this._createJWT(credentials)
        })
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      console.log('✅ Google Analytics authenticated');
      return this.accessToken;
    } catch (error) {
      console.error('GA authentication failed:', error.message);
      return null;
    }
  }

  /**
   * Create JWT for service account
   */
  _createJWT(credentials) {
    // Simplified - in production use a proper JWT library
    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT' })
    ).toString('base64');

    const now = Math.floor(Date.now() / 1000);
    const claims = Buffer.from(
      JSON.stringify({
        iss: credentials.client_email,
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      })
    ).toString('base64');

    // Note: Real implementation requires RS256 signing
    return `${header}.${claims}.signature`;
  }

  /**
   * Fetch metrics from GA4 (using Data API)
   */
  async getMetrics(startDate, endDate, dimensions = [], metrics = []) {
    try {
      const token = await this.authenticate();
      if (!token) throw new Error('Authentication failed');

      const defaultMetrics = [
        'activeUsers',
        'newUsers',
        'sessions',
        'sessionDuration',
        'bounceRate',
        'screenPageViews'
      ];

      const requestBody = {
        dateRanges: [{ startDate, endDate }],
        dimensions: dimensions.map(d => ({ name: d })) || [],
        metrics: (metrics.length > 0 ? metrics : defaultMetrics).map(m => ({ name: m }))
      };

      const response = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`GA API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this._parseMetrics(data);
    } catch (error) {
      console.error('Failed to fetch GA metrics:', error.message);
      return null;
    }
  }

  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(startDate, endDate) {
    try {
      const metrics = await this.getMetrics(
        startDate,
        endDate,
        ['eventName'],
        ['eventCount', 'totalUsers']
      );

      return {
        page_view: metrics.page_view || 0,
        scroll_engagement: metrics.scroll_engagement || 0,
        cta_click: metrics.cta_click || 0,
        trial_signup: metrics.trial_signup || 0,
        subscription_purchase: metrics.subscription_purchase || 0
      };
    } catch (error) {
      console.error('Failed to fetch funnel:', error.message);
      return null;
    }
  }

  /**
   * Get traffic source breakdown
   */
  async getTrafficSources(startDate, endDate) {
    try {
      const data = await this.getMetrics(
        startDate,
        endDate,
        ['sessionSource'],
        ['sessions', 'activeUsers']
      );

      return {
        organic: data.organic || 0,
        direct: data.direct || 0,
        referral: data.referral || 0,
        paid: data.paid || 0
      };
    } catch (error) {
      console.error('Failed to fetch traffic sources:', error.message);
      return null;
    }
  }

  /**
   * Get top pages
   */
  async getTopPages(startDate, endDate, limit = 10) {
    try {
      const data = await this.getMetrics(
        startDate,
        endDate,
        ['pagePath'],
        ['screenPageViews', 'averageSessionDuration', 'bounceRate']
      );

      // Sort by views
      return Object.entries(data)
        .sort((a, b) => b[1].views - a[1].views)
        .slice(0, limit)
        .map(([page, stats]) => ({ page, ...stats }));
    } catch (error) {
      console.error('Failed to fetch top pages:', error.message);
      return [];
    }
  }

  /**
   * Get CTR (click-through rate) estimate from Search Console
   */
  async estimateCTR() {
    // Note: This would require Search Console API integration
    // For now, return placeholder
    console.log('⚠️  CTR estimation requires Search Console API setup');
    return { estimated_ctr: 2.1, source: 'placeholder' };
  }

  /**
   * Parse GA response
   */
  _parseMetrics(gaResponse) {
    const result = {};

    if (gaResponse.rows) {
      for (const row of gaResponse.rows) {
        const key = row.dimensions?.[0] || 'total';
        result[key] = {
          views: parseInt(row.metricValues?.[0]?.value || 0),
          users: parseInt(row.metricValues?.[1]?.value || 0),
          duration: parseFloat(row.metricValues?.[2]?.value || 0)
        };
      }
    }

    return result;
  }
}

/**
 * Simplified Analytics client for development
 * Uses mock data when real GA credentials aren't available
 */
export class MockAnalyticsAPI {
  constructor() {
    this.baseline = {
      activeUsers: 150,
      sessions: 450,
      sessionDuration: 3.2,
      bounceRate: 45,
      screenPageViews: 1200,
      conversion_rate: 2.8,
      ctr: 2.1
    };
  }

  async getMetrics(startDate, endDate, dimensions = [], metrics = []) {
    // Return baseline + random variation
    return {
      activeUsers: this._vary(this.baseline.activeUsers),
      sessions: this._vary(this.baseline.sessions),
      conversion_rate: this._vary(this.baseline.conversion_rate),
      ctr: this._vary(this.baseline.ctr)
    };
  }

  async getConversionFunnel() {
    return {
      page_view: 1200,
      scroll_engagement: 456,
      cta_click: 312,
      trial_signup: 67,
      subscription_purchase: 12
    };
  }

  async getTrafficSources() {
    return {
      organic: 780,
      direct: 240,
      referral: 180,
      paid: 250
    };
  }

  async getTopPages() {
    return [
      { page: '/tarot.html', views: 450, duration: 4.2, bounceRate: 32 },
      { page: '/horoskopy.html', views: 380, duration: 3.8, bounceRate: 38 },
      { page: '/numerologie.html', views: 210, duration: 2.9, bounceRate: 52 },
      { page: '/index.html', views: 180, duration: 5.1, bounceRate: 28 }
    ];
  }

  _vary(value) {
    const variance = value * 0.1; // ±10%
    return Math.round(value + (Math.random() - 0.5) * variance * 2);
  }
}

export default GoogleAnalyticsAPI;
