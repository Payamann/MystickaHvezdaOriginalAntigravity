# 🚀 Optimization Action Plan - Implementation Guide

> Konkrétní kroky, kódy a checklisty pro implementaci optimalizací z analýzy.

---

## FÁZE 1: PERFORMANCE QUICK WINS (2 týdny)

### 1.1 Defer Script Loading (30 minut)

Cíl: Eliminovat render-blocking scripts

**Soubory k úpravě:**
- `index.html` (hlavní stránka)
- `profil.html`
- `snar.html`
- `natalni-karta.html`
- Všechny ostatní HTML s `<script>` tagy

**Postup:**

```bash
# Najdi všechny synchronní script tagy
grep -r '<script src' *.html | grep -v defer | head -20
```

**Náhrada:**

```html
<!-- BEFORE -->
<script src="https://js.stripe.com/v3/"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="js/api-config.js"></script>
<script src="js/templates.js"></script>
<script src="js/components.js"></script>

<!-- AFTER -->
<!-- Critical path only -->
<link rel="preconnect" href="https://js.stripe.com">

<!-- Deferred load -->
<script defer src="js/api-config.js"></script>
<script defer src="js/templates.js"></script>
<script defer src="js/components.js"></script>

<!-- Lazy-load Stripe (on demand) -->
<script id="stripe-loader" data-lazy="true"></script>
<script defer>
window.loadStripe = () => {
    if (Stripe) return Promise.resolve(Stripe);
    return new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => resolve(window.Stripe);
        document.body.appendChild(script);
    });
};
</script>

<!-- Lazy-load Chart.js (only on pages that use it) -->
<script>
window.loadChart = () => {
    if (Chart) return Promise.resolve(Chart);
    return new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => resolve(window.Chart);
        document.body.appendChild(script);
    });
};
</script>

<!-- Use on profil.html -->
<script>
// Nur wenn wir Profile-Seite sind
document.addEventListener('DOMContentLoaded', async () => {
    if (document.querySelector('.biorhythm-chart')) {
        const Chart = await window.loadChart();
        // init chart
    }
});
</script>
```

**Checklist:**
- [ ] index.html
- [ ] profil.html
- [ ] snar.html
- [ ] natalni-karta.html
- [ ] cenik.html
- [ ] Všechny ostatní HTML soubory

**Ověření:**
```bash
# Po změnách - měli bychom mít jen main.js bez defer (entry point)
grep -r '<script src' *.html | grep -v defer
```

---

### 1.2 Image Optimization (4-6 hodin)

Cíl: Servir WebP + lazy loading + proper dimensions

**Krok 1: Audit obrázků**
```bash
find img -type f \( -name "*.png" -o -name "*.jpg" \) | while read f; do
    webp_version="${f%.*}.webp"
    if [ -f "$webp_version" ]; then
        png_size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f")
        webp_size=$(stat -f%z "$webp_version" 2>/dev/null || stat -c%s "$webp_version")
        echo "$f: $(($png_size/1024))KB → $(($webp_size/1024))KB ($(((100*webp_size/$png_size)))%)"
    fi
done
```

**Krok 2: Vytvořit helper funkci v `js/utils/image-helper.js`**

```javascript
/**
 * Helper pro optimalizaci obrázků
 * - WebP first
 * - Lazy loading
 * - Responsive srcset
 */

export function createPictureElement(baseUrl, alt, width, height, loading = 'lazy') {
    const picture = document.createElement('picture');

    // WebP version
    const sourceWebP = document.createElement('source');
    sourceWebP.srcset = `${baseUrl}.webp`;
    sourceWebP.type = 'image/webp';

    // Fallback
    const img = document.createElement('img');
    img.src = `${baseUrl}.png`;
    img.alt = alt;
    img.loading = loading;
    img.width = width;
    img.height = height;

    picture.appendChild(sourceWebP);
    picture.appendChild(img);

    return picture;
}
```

**Krok 3: Nahradit v HTML**

```html
<!-- BEFORE -->
<img src="img/tarot/01-magician.png" alt="The Magician">

<!-- AFTER -->
<picture>
    <source srcset="img/tarot/01-magician.webp" type="image/webp">
    <img src="img/tarot/01-magician.png" alt="The Magician"
         loading="lazy" width="300" height="400">
</picture>

<!-- Nebo s helper funkcí -->
<script type="module">
import { createPictureElement } from 'js/utils/image-helper.js';
const picture = createPictureElement('img/tarot/01-magician', 'The Magician', 300, 400);
document.getElementById('tarot-container').appendChild(picture);
</script>
```

**Automation script: `scripts/optimize-images.js`**

```javascript
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function optimizeImages() {
    const imgDir = 'img';
    const files = fs.readdirSync(imgDir);

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();

        if (['.png', '.jpg', '.jpeg'].includes(ext)) {
            const inputPath = path.join(imgDir, file);
            const outputPath = path.join(imgDir, file.replace(ext, '.webp'));

            // Skip if WebP exists
            if (fs.existsSync(outputPath)) {
                console.log(`✅ ${file} → ${path.basename(outputPath)} (exists)`);
                continue;
            }

            try {
                await sharp(inputPath)
                    .webp({ quality: 80 })
                    .toFile(outputPath);

                const inputSize = fs.statSync(inputPath).size;
                const outputSize = fs.statSync(outputPath).size;
                const savings = Math.round((1 - outputSize/inputSize) * 100);

                console.log(`✅ ${file} → ${path.basename(outputPath)} (-${savings}%)`);
            } catch (err) {
                console.error(`❌ ${file}: ${err.message}`);
            }
        }
    }
}

optimizeImages().then(() => console.log('Done!'));
```

Run:
```bash
node scripts/optimize-images.js
```

**Checklist:**
- [ ] Nástroj spuštěn, WebP verze vygenerovány
- [ ] Skripty ve všech HTML souborech konvertovány na `<picture>`
- [ ] Všechny obrázky mají `width` a `height` atributy
- [ ] Všechny obrázky pod fold mají `loading="lazy"`
- [ ] Testováno v DevTools: Network tab (kontrola WebP servování)

---

### 1.3 Moon Phase Caching (30 minut)

**Soubor:** `server/services/astrology.js`

```javascript
// BEFORE
export function calculateMoonPhase() {
    const now = new Date();
    // ... complex calculation
    return phaseName;
}

// AFTER: Cached by date
let cachedMoonPhase = null;
let cachedMoonDate = null;

export function calculateMoonPhase() {
    const today = new Date().toISOString().split('T')[0];

    if (cachedMoonDate === today && cachedMoonPhase) {
        return cachedMoonPhase;
    }

    const now = new Date();
    // ... complex calculation
    const phaseName = /* result */;

    cachedMoonPhase = phaseName;
    cachedMoonDate = today;

    return phaseName;
}
```

**Test:**
```bash
node -e "
import('./server/services/astrology.js').then(m => {
    console.time('Moon phase 1');
    console.log(m.calculateMoonPhase());
    console.timeEnd('Moon phase 1');

    console.time('Moon phase 2 (cached)');
    console.log(m.calculateMoonPhase());
    console.timeEnd('Moon phase 2 (cached)');
})
"
```

---

## FÁZE 2: DATABASE OPTIMIZATIONS (1 týden)

### 2.1 JWT-Based Premium Cache

**Soubor:** `server/auth.js`

```javascript
// BEFORE: Premium check queries DB
res.json({ token: jwt.sign({ userId }, JWT_SECRET) });

// AFTER: Include premium status in JWT
const premiumData = await isPremiumUser(userId);
const subscription = premiumData ?
    await supabase
        .from('subscriptions')
        .select('plan_type, status, current_period_end')
        .eq('user_id', userId)
        .single()
    : null;

const token = jwt.sign({
    userId,
    email,
    isPremium: premiumData,
    premiumExpires: subscription?.current_period_end,
    planType: subscription?.plan_type
}, JWT_SECRET, { expiresIn: '7d' });

res.json({ token });
```

**Soubor:** `server/middleware.js`

```javascript
export const optionalPremiumCheck = (req, res, next) => {
    // Check from JWT first (no DB call!)
    if (req.user) {
        req.isPremium = req.user.isPremium &&
                       new Date(req.user.premiumExpires) > new Date();
    } else {
        req.isPremium = false;
    }
    next();
};
```

**Soubor:** `server/routes/oracle.js`

```javascript
// BEFORE
if (!req.isPremium && req.user?.id) {
    const { data } = await supabase
        .from('readings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', req.user.id)
        .eq('type', 'crystal-ball')
        .gte('created_at', `${today}T00:00:00`);
    const count = data?.length || 0;
    if (count >= 3) {
        return res.status(402).json({...});
    }
}

// AFTER
if (!req.isPremium && req.user?.id) {
    // Use local cache-based limit
    const cacheKey = `crystal-ball-limit:${req.user.id}:${today}`;
    let count = req.app.locals.limitsCache?.[cacheKey] || 0;

    if (count >= 3) {
        return res.status(402).json({...});
    }

    req.app.locals.limitsCache = req.app.locals.limitsCache || {};
    req.app.locals.limitsCache[cacheKey] = count + 1;
}
```

**Test:**
```bash
curl -X POST http://localhost:3001/api/crystal-ball \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Test?"}'
```

---

### 2.2 Fix N+1 Queries

**Soubor:** `server/auth.js`

```javascript
// BEFORE: 2 queries
async function loginUser(email, password) {
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    // Password check...

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

    return { user, subscription };
}

// AFTER: 1 query
async function loginUser(email, password) {
    const { data: user } = await supabase
        .from('users')
        .select('*, subscriptions(*)')
        .eq('email', email)
        .single();

    // Password check...

    return user; // subscription attached
}
```

---

## FÁZE 3: MONETIZATION SETUP (2-3 týdny)

### 3.1 Add VIP Plan

**Soubor:** `server/payment.js`

```javascript
const PLANS = {
    'poutnik': {
        name: 'Poutník (Základ)',
        price: 0,
        type: 'free',
        interval: null
    },
    'pruvodce': {
        name: 'Hvězdný Průvodce (Měsíční)',
        price: 17900, // 179 CZK
        type: 'premium_monthly',
        interval: 'month'
    },
    'osviceni': {
        name: 'Osvícení (Měsíční)',
        price: 39900, // 399 CZK
        type: 'premium_monthly',
        interval: 'month'
    },
    'vesmirny_pruvodce': {
        name: 'Vesmírný Průvodce (Měsíční)',
        price: 99900, // 999 CZK
        type: 'vip_monthly',
        interval: 'month'
    }
};
```

**Soubor:** `cenik.html` - Přidat vizuálně VIP plán

```html
<div class="pricing-cards">
    <div class="card plan-poutnik">
        <h3>Poutník (Základ)</h3>
        <p class="price">Zdarma</p>
        <ul>
            <li>✓ Denní horoskop</li>
            <li>✓ 3× Křišťálová koule</li>
        </ul>
        <button>Zůstat na Free</button>
    </div>

    <div class="card plan-pruvodce">
        <h3>Hvězdný Průvodce</h3>
        <p class="price">179 Kč<span>/měsíc</span></p>
        <ul>
            <li>✓ Unlimited Crystal Ball</li>
            <li>✓ Tarot neomezeno</li>
            <li>✓ Dream analýza</li>
        </ul>
        <button>Upgrader teď</button>
    </div>

    <div class="card plan-osviceni">
        <h3>Osvícení</h3>
        <p class="price">399 Kč<span>/měsíc</span></p>
        <ul>
            <li>✓ Vše z Průvodce</li>
            <li>✓ AI analýza čtení</li>
            <li>✓ Měsíční report</li>
        </ul>
        <button>Upgrader teď</button>
    </div>

    <!-- NEW: VIP PLAN -->
    <div class="card plan-vip" style="border: 2px solid gold; transform: scale(1.05);">
        <span class="badge" style="background: gold; color: black;">⭐ POPULAR</span>
        <h3>Vesmírný Průvodce</h3>
        <p class="price">999 Kč<span>/měsíc</span></p>
        <p class="description">VIP přístup s prioritou</p>
        <ul>
            <li>✓ Vše z Osvícení</li>
            <li>✓ White-glove mentor chat</li>
            <li>✓ Custom natalní karta</li>
            <li>✓ Prioritní podpora</li>
            <li>✓ Discord komunita</li>
        </ul>
        <button style="background: gold; color: black;">Stát se Vesmírným Průvodcem</button>
    </div>
</div>
```

---

### 3.2 Upgrade Funnel

**Soubor:** `server/routes/oracle.js` - Soft wall se upsell

```javascript
router.post('/crystal-ball', optionalPremiumCheck, async (req, res) => {
    try {
        const { question, history = [] } = req.body;

        if (!req.isPremium && req.user?.id) {
            // Check daily limit
            const today = new Date().toISOString().split('T')[0];
            const cacheKey = `crystal-ball:${req.user.id}:${today}`;
            const cache = req.app.locals.readingCache = req.app.locals.readingCache || {};
            const count = cache[cacheKey] || 0;

            if (count >= 3) {
                // SOFT WALL: Show upgrade prompt instead of hard block
                return res.status(402).json({
                    success: false,
                    error: 'Denní limit vyčerpán',
                    code: 'LIMIT_REACHED',
                    upsell: {
                        title: 'Hvězdný Průvodce - Neomezené Otázky',
                        message: 'Vyzkoušeli jste si Křišťálovou kouli. Chcete neomezený přístup?',
                        cta: 'Upgradovat na Premium',
                        plan: 'pruvodce',
                        price: 179,
                        url: '/cenik?selected=pruvodce'
                    }
                });
            }

            cache[cacheKey] = count + 1;
        }

        // ... rest of logic
    } catch (error) {
        console.error('Crystal Ball Error:', error);
        res.status(500).json({ success: false, error: 'Křišťálová koule je zahalena mlhou...' });
    }
});
```

**Soubor:** `js/premium-gates.js` - Frontend handling

```javascript
export async function callAPI(endpoint, data) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        // Handle upsell prompt
        if (response.status === 402 && result.upsell) {
            showUpgradeModal(result.upsell);
            return null;
        }

        return result;
    } catch (error) {
        showError(error.message);
        return null;
    }
}

function showUpgradeModal(upsell) {
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${upsell.title}</h2>
            <p>${upsell.message}</p>
            <p class="price">Pouze ${upsell.price} Kč/měsíc</p>
            <button onclick="window.location.href='${upsell.url}'">
                ${upsell.cta}
            </button>
            <button onclick="this.closest('.upgrade-modal').remove()">
                Zůstat na Free
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}
```

---

## FÁZE 4: MONITORING & VALIDATION (1 týden)

### 4.1 Setup Performance Monitoring

**Soubor:** `server/middleware.js`

```javascript
// Add detailed performance logging
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = duration > 1000 ? 'WARN' : 'INFO';

        console.log(
            `[${level}] ${req.method} ${req.path} - ${duration}ms [${res.statusCode}]`
        );

        // Send to monitoring service (optional)
        if (process.env.MONITORING_URL) {
            fetch(process.env.MONITORING_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: req.method,
                    path: req.path,
                    duration,
                    status: res.statusCode,
                    timestamp: new Date().toISOString()
                })
            }).catch(() => {});
        }
    });

    next();
});
```

### 4.2 Frontend Performance Monitoring

**Soubor:** `js/utils/performance.js`

```javascript
export function trackPageMetrics() {
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];

        if (!perfData) return;

        const metrics = {
            'DNS': perfData.domainLookupEnd - perfData.domainLookupStart,
            'TCP': perfData.connectEnd - perfData.connectStart,
            'TTFB': perfData.responseStart - perfData.requestStart,
            'Download': perfData.responseEnd - perfData.responseStart,
            'DOM Parse': perfData.domInteractive - perfData.domLoading,
            'DOM Content': perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            'FCP': performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
            'LCP': performance.getEntriesByType('largest-contentful-paint').pop()?.startTime
        };

        console.table(metrics);

        // Send to analytics (optional)
        if (window.gtag) {
            Object.entries(metrics).forEach(([name, value]) => {
                gtag('event', 'page_metric', { metric_name: name, value: Math.round(value) });
            });
        }
    });
}

// Call on every page
trackPageMetrics();
```

---

## CHECKLIST: DEPLOYMENT

- [ ] **Performance**: Všechny script tagy mají `defer`, obrázky WebP, lazy loading
- [ ] **Database**: Premium cache v JWT, N+1 queries vyřešeny
- [ ] **Monetization**: 4. plán přidán, soft wall implementován
- [ ] **Monitoring**: Performance logging aktivní
- [ ] **Testing**: Ověřeno v Chrome DevTools (Network, Lighthouse)
- [ ] **Mobile**: Testováno na mobilě (iOS + Android)
- [ ] **Security**: `innerHTML` nahrazen `textContent`, XSS opravy
- [ ] **Analytics**: Conversion tracking aktivní

---

## MĚŘENÍ VLIVU (2 týdny po deployu)

Sbírej data:

```javascript
// Track before/after
const metrics = {
    before: {
        pageLoadTime: 3.8, // s
        premiumConversion: 0.08, // %
        monthlyRevenue: 0, // Kč (baseline)
        userEngagement: 2.3 // readings/měsíc
    }
};

// Po 2 týdnech - sbereš nová data:
metrics.after = {
    pageLoadTime: 1.9, // s (-50%)
    premiumConversion: 0.12, // % (+50%)
    monthlyRevenue: 0, // Kč
    userEngagement: 3.8 // readings/měsíc (+65%)
};
```

**Kde sbírat data:**
- Google Analytics (Page load time, Conversion rate)
- Stripe Dashboard (Revenue, customers)
- Supabase Logs (Query performance)
- Sentry (Error tracking)

---

## NEXT STEPS

1. **Zítřev:** Vybrat jednu fázi pro start
2. **Tento týden:** Implementovat P1 (scripts + images)
3. **Příští týden:** DB optimalizace + monitoring
4. **Pak:** Monetization setup + A/B testing

**Potřebuješ help s konkrétní implementací?** 👇
