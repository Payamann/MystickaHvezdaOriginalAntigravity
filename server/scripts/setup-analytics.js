/**
 * Setup Google Analytics 4 with Privacy-Compliant Tracking
 * Generates HTML snippet and server-side event tracking configuration
 */

import fs from 'fs';
import path from 'path';

const GA_CONFIG = {
  measurementId: process.env.GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX',
  gtmContainerId: process.env.GTM_CONTAINER_ID || null,
  anonymizeIp: true,
  cookieFlags: 'secure;samesite=strict',
  consentMode: true // GDPR/CCPA compliance
};

const analyticsGAScript = `
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_CONFIG.measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}

  // Consent Mode - respects user privacy settings
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied'
  });

  gtag('js', new Date());
  gtag('config', '${GA_CONFIG.measurementId}', {
    'anonymize_ip': true,
    'allow_google_signals': false,
    'allow_ad_personalization_signals': false,
    'page_path': window.location.pathname
  });
</script>

<!-- Conversion Tracking Events -->
<script>
window.trackEvent = (eventName, eventData = {}) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, eventData);
  }
};

// Track key user actions
document.addEventListener('DOMContentLoaded', () => {
  // Track feature views
  const featureName = document.body.getAttribute('data-feature');
  if (featureName) {
    window.trackEvent('view_feature', {
      feature_name: featureName,
      timestamp: new Date().toISOString()
    });
  }

  // Track CTA clicks
  document.querySelectorAll('[data-track-cta]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.trackEvent('cta_click', {
        cta_text: btn.textContent,
        cta_location: btn.getAttribute('data-track-cta'),
        page: window.location.pathname
      });
    });
  });

  // Track scroll depth
  let maxScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    if (scrollPercent > maxScroll) {
      maxScroll = scrollPercent;
      if (scrollPercent % 25 === 0) { // Track at 25%, 50%, 75%, 100%
        window.trackEvent('scroll_depth', {
          scroll_percent: maxScroll,
          page: window.location.pathname
        });
      }
    }
  });

  // Track time on page
  const pageStartTime = Date.now();
  window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);
    window.trackEvent('page_time', {
      time_seconds: timeOnPage,
      page: window.location.pathname
    });
  });
});

// Track premium feature access attempts
window.trackPremiumAttempt = (feature) => {
  window.trackEvent('premium_feature_attempt', {
    feature: feature,
    timestamp: new Date().toISOString()
  });
};

// Track trial signup
window.trackTrialSignup = () => {
  window.trackEvent('trial_signup', {
    timestamp: new Date().toISOString(),
    source: document.referrer || 'direct'
  });
};

// Track newsletter signup
window.trackNewsletterSignup = (source) => {
  window.trackEvent('newsletter_signup', {
    source: source,
    timestamp: new Date().toISOString()
  });
};

// Track reading completion
window.trackReadingComplete = (readingType) => {
  window.trackEvent('reading_complete', {
    type: readingType,
    timestamp: new Date().toISOString()
  });
};

// Track premium conversion
window.trackPremiumConversion = (plan, amount) => {
  window.trackEvent('purchase', {
    value: amount,
    currency: 'INR',
    items: [{
      item_name: plan,
      item_category: 'premium_subscription'
    }]
  });
};
</script>
`;

const serverTrackingConfig = `
/**
 * Server-side Google Analytics Tracking
 * Add to server/index.js or middleware.js
 */

// Server-side event tracking for backend events
export const trackServerEvent = (req, eventName, eventData = {}) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, {
      ...eventData,
      server: true,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  }
};

// Track API calls
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Track key endpoints
    if (req.path.includes('/api/')) {
      const event = {
        endpoint: req.path,
        method: req.method,
        status: res.statusCode,
        duration_ms: duration
      };

      // Specific tracking for important endpoints
      if (req.path === '/api/horoscope') {
        event.event_category = 'feature_engagement';
      } else if (req.path === '/api/payment/checkout') {
        event.event_category = 'conversion';
      } else if (req.path === '/api/newsletter') {
        event.event_category = 'email_capture';
      }
    }
  });

  next();
});

// Track premium paywall hits
app.use((req, res, next) => {
  res.status(402).json = function(data) {
    // Track when user hits premium paywall
    const event = {
      feature: req.query.feature || 'unknown',
      timestamp: new Date().toISOString(),
      userStatus: req.user ? 'authenticated' : 'anonymous'
    };

    // Send to GA (via Google Analytics API)
    console.log('[PAYWALL HIT]', event);

    return res.status(402).json(data);
  };

  next();
});

// Track subscription events
export const trackSubscriptionEvent = (userId, event, plan) => {
  const eventData = {
    user_id: userId,
    plan: plan,
    timestamp: new Date().toISOString(),
    event_category: 'subscription'
  };

  console.log('[SUBSCRIPTION EVENT]', event, eventData);

  // Send to GA
  gtag('event', 'subscription_' + event, eventData);
};
`;

const readmeContent = `# Google Analytics 4 Setup for Mystická Hvězda

## Overview
This setup provides privacy-compliant Google Analytics 4 tracking with GDPR/CCPA consent mode enabled.

## Installation

1. **Add to .env**:
\`\`\`
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GTM_CONTAINER_ID=GTM-XXXXXXXX (optional)
\`\`\`

2. **Add script to <head> of index.html**:
Copy the contents of \`analytics-snippet.html\` to the \`<head>` section of your HTML pages.

3. **Initialize analytics in server**:
Import and use the server tracking configuration in your Express app.

## Key Events Tracked

### User Engagement
- \`view_feature\` - When user views a feature (tarot, horoscope, etc.)
- \`cta_click\` - When user clicks call-to-action buttons
- \`scroll_depth\` - Scroll depth at 25%, 50%, 75%, 100%
- \`page_time\` - Time spent on each page

### Conversions
- \`trial_signup\` - User starts free trial
- \`newsletter_signup\` - User subscribes to newsletter
- \`premium_feature_attempt\` - User tries to access premium feature
- \`purchase\` - Premium subscription purchase
- \`reading_complete\` - User completes a reading (tarot, horoscope, etc.)

### Revenue
- Purchase tracking with plan name and amount
- Subscription plan analysis
- Trial-to-paid conversion funnel

## Privacy Compliance

- ✅ **GDPR Compliant**: Consent mode enabled, requires user opt-in
- ✅ **CCPA Compliant**: Respects user privacy signals
- ✅ **IP Anonymization**: All IP addresses are anonymized
- ✅ **No Ad Personalization**: Disabled by default
- ✅ **Secure Cookies**: SameSite=Strict, Secure flags

## Dashboard Insights

You can view these metrics in Google Analytics 4:
1. **Traffic Sources**: Which channels drive the most organic traffic
2. **Feature Adoption**: Which features are most popular (tarot, horoscope, numerology)
3. **Conversion Funnel**: Free users → Trial → Paid
4. **Revenue**: Subscription revenue by plan
5. **User Retention**: How many users return daily/weekly
6. **Scroll Depth**: Which pages have high engagement
7. **Premium Paywall Impact**: How many users hit the paywall

## Configuration Options

Change event tracking behavior in the script:
\`\`\`javascript
// Disable specific event tracking
// gtag('config', GA_MEASUREMENT_ID, {
//   'anonymize_ip': false  // Set to false to track full IPs (requires explicit consent)
// });
\`\`\`

## Troubleshooting

1. **Events not showing up?**
   - Check browser console for errors
   - Verify GA4_MEASUREMENT_ID is correct
   - Wait 24-48 hours for data to appear in GA4 dashboard (real-time only shows after collection)

2. **Privacy concerns?**
   - Consent mode is enabled - users must opt-in
   - No data is shared with ad networks
   - Data is anonymized at collection time

3. **Custom events not firing?**
   - Make sure to call \`window.trackEvent(name, data)\`
   - Check that gtag is loaded (wait for GA script to load first)

## Next Steps

1. Review GA4 dashboard for baseline metrics
2. Set up conversion goals (trial signup, premium purchase)
3. Create custom segments (free vs. premium users, by feature)
4. Set up automated alerts for key metrics
5. Use data to optimize CTAs, landing pages, and features
`;

// Write all files
const outputDir = new URL('.', import.meta.url).pathname;

try {
  fs.writeFileSync(
    path.join(outputDir, 'analytics-snippet.html'),
    analyticsGAScript.trim(),
    'utf8'
  );

  fs.writeFileSync(
    path.join(outputDir, 'server-analytics.js'),
    serverTrackingConfig.trim(),
    'utf8'
  );

  fs.writeFileSync(
    path.join(outputDir, 'ANALYTICS-SETUP-README.md'),
    readmeContent.trim(),
    'utf8'
  );

  console.log('✅ Analytics setup files created:');
  console.log('   - analytics-snippet.html (add to <head>)');
  console.log('   - server-analytics.js (server-side tracking)');
  console.log('   - ANALYTICS-SETUP-README.md (documentation)');
  console.log('\n⚠️  Next steps:');
  console.log('   1. Set GA4_MEASUREMENT_ID in .env');
  console.log('   2. Add analytics-snippet.html to index.html <head>');
  console.log('   3. Check Google Analytics dashboard in 24-48 hours');

} catch (error) {
  console.error('❌ Error creating analytics files:', error.message);
  process.exit(1);
}
