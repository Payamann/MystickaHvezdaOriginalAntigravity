# 📊 Google Analytics 4 Deployment Checklist

**Timeline:** 2-3 hours
**Difficulty:** Easy-Medium
**Impact:** Critical for tracking upgrade funnel effectiveness

---

## ✅ PRE-DEPLOYMENT

### 1. Create GA4 Property
- [ ] Go to https://analytics.google.com
- [ ] Click "Admin" (bottom left)
- [ ] Click "Create Property"
- [ ] Property name: `Mystická Hvězda`
- [ ] Timezone: `Europe/Prague`
- [ ] Industry: `Lifestyle`
- [ ] Click "Create"

### 2. Create Web Stream
- [ ] In property, go to "Data Streams"
- [ ] Click "Add stream" → "Web"
- [ ] Website URL: `https://mystickahvezda.cz` (or your domain)
- [ ] Stream name: `Main Website`
- [ ] Click "Create stream"
- [ ] Copy **Measurement ID** (format: `G-XXXXXXXXXX`)

### 3. Generate GA Snippet
```bash
node scripts/generate-ga-snippet.js G-XXXXXXXXXX
```
(Replace with your actual Measurement ID)

This will:
- ✅ Output HEAD snippet for `<head>`
- ✅ Output BODY snippet for end of `<body>`
- ✅ Update `js/ga-config.js` with your ID

---

## 🔧 IMPLEMENTATION (Pick one approach)

### Approach A: Add to ALL HTML Files (Recommended)

1. **Update index.html**
   ```html
   <!-- In <head> section, add: -->
   <!-- Google Analytics 4 -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
       window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', 'G-XXXXXXXXXX');
   </script>

   <!-- Before </body>, add: -->
   <script type="module">
       import { initAnalytics, trackPageLoadMetrics } from './js/ga-tracking.js';
       document.addEventListener('DOMContentLoaded', () => {
           initAnalytics();
           trackPageLoadMetrics();
       });
   </script>
   ```

2. **Copy to other main HTML files:**
   - [ ] profil.html
   - [ ] cenik.html
   - [ ] snar.html
   - [ ] natalni-karta.html
   - [ ] kristalova-koule.html
   - [ ] horoskopy.html
   - [ ] andelske-karty.html

3. **Or use HTML template/component system** if you have one

### Approach B: Use Template/Layout File (If applicable)

If you have a template that all pages inherit from:
```
1. Add GA snippet to template <head>
2. Add GA initialization script to template end
3. All pages automatically include it
```

---

## 🧪 TESTING (Before going live)

### 1. Install Google Tag Assistant
- [ ] Chrome Web Store: "Google Tag Assistant"
- [ ] Open your website
- [ ] Click GTAssistant icon
- [ ] Should show "GA4" with green checkmark

### 2. Check Network Tab
- [ ] F12 → Network tab
- [ ] Refresh page
- [ ] Filter by "google-analytics"
- [ ] Should see requests to `analytics.google.com`

### 3. Test Events Manually
```javascript
// In Chrome DevTools console:
gtag('event', 'test_event', {'value': 123});
```

### 4. Check GA4 Realtime Report
- [ ] Google Analytics dashboard
- [ ] Reports → Realtime
- [ ] Refresh your website
- [ ] Should see "1 user" in Realtime report within 10 seconds

### 5. Test Upgrade Modal (if deployed)
- [ ] Go to crystal-ball page
- [ ] Try to ask 4+ questions
- [ ] Upgrade modal should appear
- [ ] GA dashboard → Realtime → Should show `upgrade_modal_shown` event

---

## 📊 SETUP CONVERSIONS (In GA Dashboard)

### 1. Create Conversion Events

**Event 1: Upgrade Modal Shown**
- [ ] Admin → Conversions → New conversion event
- [ ] Event name: `upgrade_modal_shown`
- [ ] Description: "User was shown upgrade modal"
- [ ] Count as conversion: ✅ Yes

**Event 2: Upgrade CTA Clicked**
- [ ] Event name: `upgrade_cta_clicked`
- [ ] Count as conversion: ✅ Yes

**Event 3: Purchase**
- [ ] Event name: `purchase`
- [ ] Count as conversion: ✅ Yes

**Event 4: Feature Used**
- [ ] Event name: `feature_use`
- [ ] Count as conversion: ❌ No (informational)

---

## 📈 CREATE DASHBOARD

### 1. Create Custom Dashboard
- [ ] Reports (left sidebar) → Customization → New Dashboard
- [ ] Name: "Upgrade Funnel"

### 2. Add Cards

**Card 1: Key Metrics**
```
Metric 1: upgrade_modal_shown (count)
Metric 2: upgrade_cta_clicked (count)
Metric 3: purchase (count)
Dimension: None
```

**Card 2: Upgrade Funnel**
```
Event: upgrade_modal_shown → upgrade_cta_clicked → purchase
Shows drop-off at each stage
```

**Card 3: Feature Usage**
```
Metric: feature_use (count)
Dimension: custom_feature_name
Shows which features are most used
```

**Card 4: User Journey (Funnel)**
```
Step 1: New users
Step 2: User login (if tracked)
Step 3: feature_use event
Step 4: upgrade_modal_shown
Step 5: purchase
```

---

## 🔔 SETUP ALERTS

### 1. Alert: Spike in Upgrade Modals
- [ ] Admin → Alerts → Create
- [ ] Alert name: "High upgrade modal views"
- [ ] Metric: `upgrade_modal_shown`
- [ ] Condition: "Increases by 50% vs yesterday"
- [ ] Notification: Email

### 2. Alert: Purchase Drop
- [ ] Metric: `purchase`
- [ ] Condition: "Less than 2 per day"
- [ ] Notification: Email

---

## 📝 TRACKING IMPLEMENTATION

Files already created for you:

- ✅ `js/ga-tracking.js` - All tracking functions
- ✅ `js/ga-config.js` - Configuration
- ✅ `js/upgrade-modal.js` - Already calls tracking!
- ✅ `js/api-wrapper.js` - Already calls tracking!

### No additional code needed in those files!

But verify:

1. **In upgrade-modal.js:**
   ```javascript
   import { trackUpgradeModalShown } from './ga-tracking.js';
   // Should see this call already
   ```

2. **In api-wrapper.js:**
   ```javascript
   // Already handles 402 responses with upsell
   ```

---

## 🚀 DEPLOYMENT

### 1. Commit Changes
```bash
git add js/ga-*.js scripts/generate-ga-snippet.js GA-*
git commit -m "ANALYTICS: Google Analytics 4 setup with upgrade funnel tracking"
git push origin claude/app-optimization-analysis-WYgs0
```

### 2. Deploy to Production
```bash
# Deploy your main branch to production
# (Your deployment process here)
```

### 3. Verify in Production
- [ ] Open https://mystickahvezda.cz in browser
- [ ] Open DevTools Network tab
- [ ] See "google-analytics" requests
- [ ] Go to GA Realtime report
- [ ] Should show active users

---

## 📊 WHAT TO MONITOR

### Daily
- **Upgrade Modal Shows:** How many daily?
- **CTA Click Rate:** % of modal viewers clicking
- **Purchase Conversions:** How many completing purchase?

### Weekly
- **Feature Usage Ranking:** Which features drive engagement?
- **User Retention:** % of new users still active?
- **Page Load Time:** Any slowdowns?

### Monthly
- **MRR Growth:** Revenue trend
- **Upgrade Conversion Rate:** % of modal shows → purchases
- **CAC:** Cost per acquisition (if tracking ad spend)

---

## 📈 CREATING REPORTS

### Weekly Report Template
```markdown
## MYSTICKÁ HVĚZDA - WEEKLY ANALYTICS REPORT

📊 Key Metrics:
- New Users: 145 (+20%)
- Upgrade Modal Shows: 34 (+15%)
- CTA Click Rate: 29% (+4pp)
- Purchases: 10 (+67%) 💰
- Page Load: 2.3s ✅

🎯 Top Features:
1. Crystal Ball (145 uses)
2. Horoscope (108 uses)
3. Tarot (92 uses)

📉 Areas to Improve:
- Dream Analysis has 0 uses (issue?)
- Mobile conversion lower than desktop

✅ Next Week Actions:
- A/B test modal copy
- Fix dream analysis UI
- Optimize for mobile
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] GA4 property created
- [ ] Measurement ID added to all HTML files
- [ ] Test in browser - GA requests visible
- [ ] Realtime report shows activity
- [ ] Conversion events created (3+ conversions)
- [ ] Custom dashboard created
- [ ] Alerts setup
- [ ] First metrics visible (wait 24 hours)
- [ ] Team notified of new dashboard
- [ ] Weekly report scheduled

---

## 🆘 TROUBLESHOOTING

### Problem: No data appearing in GA4
**Solution:**
1. Check Measurement ID is correct
2. Hard refresh browser (Ctrl+Shift+R)
3. Wait 24-48 hours for data to populate
4. Check Realtime report first (shows within 10 sec)

### Problem: Events not showing
**Solution:**
1. Install Google Tag Assistant extension
2. Check browser console for errors
3. Verify gtag is loaded: `console.log(window.gtag)`
4. Check Network tab for analytics requests

### Problem: Wrong Measurement ID
**Solution:**
```bash
# Update js/ga-config.js
# OR run script again with correct ID:
node scripts/generate-ga-snippet.js G-CORRECT_ID
```

---

## 📚 RESOURCES

- [GA4 Setup Guide](https://support.google.com/analytics/answer/10089681)
- [Event Reference](https://support.google.com/analytics/answer/9322688)
- [Conversions Setup](https://support.google.com/analytics/answer/12188160)
- [GA4 Realtime Guide](https://support.google.com/analytics/answer/9271635)

---

## 💡 NEXT STEPS

After GA is live:

1. **Monitor first week** - Make sure data is correct
2. **Setup email alerts** - Get notified of anomalies
3. **Create Slack integration** - Auto-post daily metrics
4. **A/B test upgrades** - Test different modal text/design
5. **Implement all tracking** - Features we prepared but not yet using

---

**Estimated time:** 2-3 hours
**Difficulty:** Easy-Medium
**Impact:** High - Track all upgrade funnel conversions 🎯

Ready? Let's go! 🚀
