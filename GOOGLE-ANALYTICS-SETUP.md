# 📊 Google Analytics 4 Setup Guide

**Cíl:** Měřit upgrade modal effectiveness & conversion funnel

---

## KROK 1: Setup GA4 Property

### A) Ve Google Analytics
1. Jdi na https://analytics.google.com
2. **Create** → **New Property**
3. Property name: `Mystická Hvězda`
4. Reporting timezone: `Europe/Prague`
5. Industry category: `Lifestyle`
6. Business size: `Small-Medium`

### B) Web Stream Setup
1. **Data Streams** → **Web**
2. Website URL: `https://mystickahvezda.cz` (nebo tvá domain)
3. Stream name: `Main Website`
4. **Create stream** → Copy **Measurement ID** (格式: `G-XXXXXXXXXX`)

**Uložit:** Measurement ID někam bezpečně!

---

## KROK 2: Přidej GA Script do HTML

### Do `index.html` (a ostatních stránek):

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX', {
        'page_path': window.location.pathname
    });
</script>
```

**⚠️ Nahraď `G-XXXXXXXXXX` svým Measurement ID!**

---

## KROK 3: Setup Event Tracking

Vytvořte `js/ga-tracking.js`:

```javascript
/**
 * Google Analytics 4 Event Tracking
 * Tracks upgrade funnels, feature usage, and conversions
 */

// Initialize tracking (called on page load)
export function initAnalytics() {
    if (typeof gtag === 'undefined') {
        console.warn('GA4 not loaded');
        return;
    }

    // Set user properties
    gtag('config', {
        'user_id': getUserId() || undefined,
        'anonymize_ip': true
    });
}

// ─────────────────────────────────────────────────────────
// UPGRADE FUNNEL TRACKING
// ─────────────────────────────────────────────────────────

export function trackUpgradeModalShown(data) {
    gtag('event', 'upgrade_modal_shown', {
        'feature_name': data.feature || 'unknown',
        'plan_id': data.plan || 'pruvodce',
        'price': data.price || 179,
        'trigger_type': data.trigger || 'limit_reached'
    });
}

export function trackUpgradeModalClosed(action) {
    gtag('event', 'upgrade_modal_closed', {
        'close_action': action // 'cta_clicked', 'close_button', 'escape', 'later_button'
    });
}

export function trackUpgradeCTAClicked(data) {
    gtag('event', 'upgrade_cta_clicked', {
        'feature_name': data.feature || 'unknown',
        'plan_id': data.plan || 'pruvodce',
        'upgrade_url': data.upgradeUrl || '/cenik'
    });
}

export function trackUpgradePageView(plan) {
    gtag('event', 'view_item_list', {
        'items': [{
            'item_id': 'plan_' + plan,
            'item_name': plan,
            'item_category': 'pricing'
        }]
    });
}

// ─────────────────────────────────────────────────────────
// FEATURE USAGE TRACKING
// ─────────────────────────────────────────────────────────

export function trackCrystalBallQuestion() {
    gtag('event', 'feature_use', {
        'feature_name': 'crystal_ball',
        'feature_type': 'divination'
    });
}

export function trackTarotReading(spreadType) {
    gtag('event', 'feature_use', {
        'feature_name': 'tarot',
        'feature_type': 'divination',
        'spread_type': spreadType || 'unknown'
    });
}

export function trackHoroscopeView(sign, period) {
    gtag('event', 'feature_use', {
        'feature_name': 'horoscope',
        'feature_type': 'astrology',
        'zodiac_sign': sign,
        'period': period || 'daily'
    });
}

export function trackAngelCardDraw() {
    gtag('event', 'feature_use', {
        'feature_name': 'angel_cards',
        'feature_type': 'divination'
    });
}

// ─────────────────────────────────────────────────────────
// USER JOURNEY TRACKING
// ─────────────────────────────────────────────────────────

export function trackUserSignup(method) {
    gtag('event', 'sign_up', {
        'method': method // 'email', 'google', 'facebook'
    });
}

export function trackUserLogin(method) {
    gtag('event', 'login', {
        'method': method
    });
}

export function trackPremiumPurchase(plan, price) {
    gtag('event', 'purchase', {
        'currency': 'CZK',
        'value': price / 100, // Convert from haléře to Kč
        'items': [{
            'item_id': 'plan_' + plan,
            'item_name': plan,
            'item_category': 'subscription',
            'price': price / 100
        }]
    });
}

export function trackPageView(pageName, path) {
    gtag('event', 'page_view', {
        'page_title': pageName,
        'page_path': path || window.location.pathname
    });
}

// ─────────────────────────────────────────────────────────
// PERFORMANCE TRACKING
// ─────────────────────────────────────────────────────────

export function trackPageLoadMetrics() {
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (!perfData) return;

        const metrics = {
            'dns_time': Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
            'tcp_time': Math.round(perfData.connectEnd - perfData.connectStart),
            'ttfb': Math.round(perfData.responseStart - perfData.requestStart),
            'page_load': Math.round(perfData.loadEventEnd - perfData.loadEventStart)
        };

        gtag('event', 'page_load_metrics', metrics);

        // Also track LCP & CLS
        const fcp = performance.getEntriesByName('first-contentful-paint')[0];
        if (fcp) {
            gtag('event', 'first_contentful_paint', {
                'value': Math.round(fcp.startTime)
            });
        }
    });
}

// ─────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────

function getUserId() {
    // Get from localStorage or cookie
    return localStorage.getItem('userId') || null;
}

export function setUserId(userId) {
    localStorage.setItem('userId', userId);
    gtag('config', { 'user_id': userId });
}

export default {
    initAnalytics,
    trackUpgradeModalShown,
    trackUpgradeModalClosed,
    trackUpgradeCTAClicked,
    trackCrystalBallQuestion,
    trackTarotReading,
    trackHoroscopeView,
    trackAngelCardDraw,
    trackUserSignup,
    trackUserLogin,
    trackPremiumPurchase,
    trackPageView,
    trackPageLoadMetrics,
    setUserId
};
```

---

## KROK 4: Integrace do stávajícího kódu

### A) Update `js/upgrade-modal.js`

```javascript
import { showUpgradeModal } from './upgrade-modal.js';
import { trackUpgradeModalShown, trackUpgradeCTAClicked } from './ga-tracking.js';

export function showUpgradeModal(data) {
    // ... existing code ...

    // TRACKING
    trackUpgradeModalShown({
        feature: data.feature,
        plan: data.plan,
        price: data.price
    });

    // ... rest of modal code ...

    ctaBtn.addEventListener('click', () => {
        trackUpgradeCTAClicked({
            feature: data.feature,
            plan: data.plan
        });
    });
}
```

### B) Update `server/routes/oracle.js`

```javascript
// Na konci souboru, přidat helper:
export function trackUpgradeModalView(feature, plan) {
    // Můžeš poslat event na server, nebo GA přímo z frontendu
    console.log(`Analytics: Upgrade modal shown for ${feature}`);
}
```

### C) Update `index.html`

```html
<!-- Na konci body, těsně před closing tag -->
<script type="module">
    import { initAnalytics, trackPageLoadMetrics } from './js/ga-tracking.js';

    document.addEventListener('DOMContentLoaded', () => {
        initAnalytics();
        trackPageLoadMetrics();
    });
</script>
```

---

## KROK 5: Setup Conversion Goals

### V Google Analytics Dashboard:

1. **Admin** → **Conversions** → **New conversion event**

#### Conversion 1: Upgrade Modal Shown
- Name: `upgrade_modal_shown`
- Description: "User saw upgrade modal"
- Mark as conversion: ✅

#### Conversion 2: Upgrade CTA Clicked
- Name: `upgrade_cta_clicked`
- Description: "User clicked upgrade button"
- Mark as conversion: ✅

#### Conversion 3: Purchase
- Name: `purchase`
- Description: "Completed premium purchase"
- Mark as conversion: ✅

---

## KROK 6: Create Dashboard

### Custom Dashboard pro tracking:

1. **Reports** → **Customization** → **New Dashboard**
2. Add cards:

**Card 1: Upgrade Funnel**
```
Event: upgrade_modal_shown
Event: upgrade_cta_clicked
Event: purchase

Shows: Funnel visualization
- Users who saw modal → Clicked CTA → Purchased
```

**Card 2: Feature Usage**
```
Event: feature_use
Dimension: feature_name
Shows which features are most used
```

**Card 3: Page Performance**
```
Event: first_contentful_paint
Event: page_load_metrics
Shows page load time trends
```

**Card 4: User Journey**
```
Funnel:
- New users
- Sign up completed
- Feature used
- Upgrade modal shown
- Purchase completed
```

---

## KROK 7: Setup Custom Alerts

V Google Analytics:

1. **Admin** → **Alerts** → **Create alert**

**Alert 1: Spike in upgrade modals**
```
Metric: upgrade_modal_shown count
Condition: Increases by 50%+ vs. previous day
Action: Email notification
```

**Alert 2: Drop in purchase events**
```
Metric: purchase count
Condition: Decreases below 2 per day
Action: Email + Slack
```

---

## 📊 Key Metrics to Monitor

### Daily
- **Upgrade Modal Views:** How many users hit limits?
- **Upgrade CTA Click Rate:** % of modal viewers who click
- **Purchase Conversion:** % of CTA clickers who complete purchase

### Weekly
- **Feature Usage:** Which features drive most engagement?
- **User Retention:** % of new users still active after 7 days
- **Average Page Load:** Tracking performance improvements

### Monthly
- **MRR Growth:** Premium subscribers × plan price
- **LTV Calculation:** (Revenue from customer - CAC) / Churn Rate
- **CAC:** Total marketing spend / New customers

---

## 📈 Reporting Templates

### Weekly Report (Embed in Slack/Email)
```
🎯 MYSTICKÁ HVĚZDA - WEEKLY REPORT

📊 Key Metrics:
├─ New Users: 123 (+15% vs last week)
├─ Premium Conversions: 18 (+50% vs last week) 💰
├─ Upgrade Modal CTR: 28% (+3pp)
├─ Page Load: 2.3s (-20% vs baseline)
└─ Churn Rate: 7% (-1pp)

🚀 Top Features:
1. Crystal Ball (234 uses)
2. Horoscope (189 uses)
3. Angel Cards (156 uses)

🔍 Next Week Actions:
- Launch VIP plan
- A/B test modal copy
- Email sequence #1
```

---

## 🔒 Privacy & GDPR

### Add Cookie Consent Banner

```html
<!-- Cookie consent notice -->
<div id="cookie-banner">
    <p>Používáme analytics pro zlepšení. OK?</p>
    <button onclick="acceptAnalytics()">Souhlasím</button>
</div>

<script>
function acceptAnalytics() {
    localStorage.setItem('analytics-consent', 'true');
    gtag('consent', 'update', {
        'analytics_storage': 'granted'
    });
    document.getElementById('cookie-banner').style.display = 'none';
}

// On page load
if (!localStorage.getItem('analytics-consent')) {
    document.getElementById('cookie-banner').style.display = 'block';
}
</script>
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Create GA4 property in Google Analytics
- [ ] Get Measurement ID
- [ ] Add GA script to all HTML pages
- [ ] Create `js/ga-tracking.js`
- [ ] Update upgrade-modal.js with tracking calls
- [ ] Update index.html to initialize analytics
- [ ] Setup conversion events (3 conversions)
- [ ] Create custom dashboard
- [ ] Setup alerts for anomalies
- [ ] Add cookie consent banner
- [ ] Test: Open DevTools → Google Tag Assistant extension
- [ ] Wait 24 hours for data to populate
- [ ] Check data in GA dashboard
- [ ] Create weekly reporting template

---

## 🧪 Testing Analytics

### Google Tag Assistant (Chrome Extension)
1. Install: https://chrome.google.com/webstore
2. Open page
3. Should see "GA4" tags firing
4. Click on tag → see event details

### Manual Testing
```javascript
// In browser console:
gtag('event', 'test_event', {
    'value': 123
});

// Should appear in GA Realtime report within 10 seconds
```

---

## 📚 Resources

- GA4 Docs: https://support.google.com/analytics/answer/10089681
- Event Reference: https://support.google.com/analytics/answer/9322688
- Conversion Setup: https://support.google.com/analytics/answer/12188160

---

**Status:** Ready to implement! ✅
**Estimated time:** 2-3 hours setup + testing
