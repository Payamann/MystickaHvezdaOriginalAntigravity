/**
 * horoscope-share.js
 * -----------------
 * Generuje sdílecí panel po načtení horoskopu:
 *  - Canvas karta 1080×1350 (Instagram / Pinterest / TikTok)
 *  - Share buttons: stažení obrázku, Facebook, Kopírovat odkaz
 *  - Dynamická aktualizace OG meta tagů pro Facebook link preview
 */

(function () {
    'use strict';

    // ─── Konfigurace ────────────────────────────────────────────────────────────
    const BASE_URL = 'https://www.mystickahvezda.cz';
    const CARD_W = 1080;
    const CARD_H = 1350;

    // Barvy
    const C_BG_TOP    = '#050510';
    const C_BG_BTM    = '#0d0620';
    const C_NEBULA_1  = 'rgba(90,40,160,0.45)';
    const C_NEBULA_2  = 'rgba(50,20,100,0.35)';
    const C_GOLD      = '#ebc066';
    const C_GOLD_DIM  = 'rgba(235,192,102,0.15)';
    const C_WHITE     = '#ffffff';
    const C_WHITE_DIM = 'rgba(255,255,255,0.75)';
    const C_STAR      = 'rgba(255,255,255,0.7)';

    // ─── Vygeneruj hvězdičky náhodně ─────────────────────────────────────────
    function drawStars(ctx, w, h, count = 120) {
        ctx.save();
        for (let i = 0; i < count; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h * 0.75;
            const r = Math.random() * 1.5 + 0.3;
            const alpha = Math.random() * 0.6 + 0.2;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.fill();
        }
        ctx.restore();
    }

    // ─── Wrap textu na canvas ────────────────────────────────────────────────
    function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
        const words = text.split(' ');
        let line = '';
        let linesDrawn = 0;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                if (linesDrawn >= maxLines - 1) {
                    // Poslední řádek — přidej …
                    ctx.fillText(line.trimEnd() + '…', x, y);
                    return;
                }
                ctx.fillText(line.trimEnd(), x, y);
                line = words[n] + ' ';
                y += lineHeight;
                linesDrawn++;
            } else {
                line = testLine;
            }
        }
        if (line.trim()) ctx.fillText(line.trimEnd(), x, y);
    }

    // ─── Hlavní generátor canvas karty ──────────────────────────────────────
    function generateHoroscopeCard(signSymbol, signName, dateStr, predictionText, affirmationText) {
        const canvas = document.createElement('canvas');
        canvas.width  = CARD_W;
        canvas.height = CARD_H;
        const ctx = canvas.getContext('2d');

        // ── Pozadí — vertikální gradient ───────────────────────
        const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_H);
        bgGrad.addColorStop(0,   C_BG_TOP);
        bgGrad.addColorStop(0.5, '#0b0418');
        bgGrad.addColorStop(1,   C_BG_BTM);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, CARD_W, CARD_H);

        // ── Nebula světelné skvrny ─────────────────────────────
        const neb1 = ctx.createRadialGradient(CARD_W * 0.3, CARD_H * 0.25, 0, CARD_W * 0.3, CARD_H * 0.25, CARD_W * 0.55);
        neb1.addColorStop(0, C_NEBULA_1);
        neb1.addColorStop(1, 'transparent');
        ctx.fillStyle = neb1;
        ctx.fillRect(0, 0, CARD_W, CARD_H);

        const neb2 = ctx.createRadialGradient(CARD_W * 0.75, CARD_H * 0.45, 0, CARD_W * 0.75, CARD_H * 0.45, CARD_W * 0.45);
        neb2.addColorStop(0, C_NEBULA_2);
        neb2.addColorStop(1, 'transparent');
        ctx.fillStyle = neb2;
        ctx.fillRect(0, 0, CARD_W, CARD_H);

        // ── Hvězdičky ──────────────────────────────────────────
        drawStars(ctx, CARD_W, CARD_H, 140);

        // ── Zlatý kruh za symbolem ─────────────────────────────
        const circX = CARD_W / 2;
        const circY = 420;
        const circR = 210;
        const circGrad = ctx.createRadialGradient(circX, circY, 60, circX, circY, circR);
        circGrad.addColorStop(0, 'rgba(235,192,102,0.18)');
        circGrad.addColorStop(0.6, 'rgba(235,192,102,0.06)');
        circGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = circGrad;
        ctx.beginPath();
        ctx.arc(circX, circY, circR, 0, Math.PI * 2);
        ctx.fill();

        // Tenký zlatý kroužek
        ctx.beginPath();
        ctx.arc(circX, circY, circR - 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(235,192,102,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // ── Top badge "DENNÍ HOROSKOP" ─────────────────────────
        const badgeY = 100;
        ctx.font = '500 34px Inter, sans-serif';
        ctx.letterSpacing = '6px';
        ctx.fillStyle = C_GOLD;
        ctx.textAlign = 'center';
        ctx.fillText('DENNÍ HOROSKOP', CARD_W / 2, badgeY);
        ctx.letterSpacing = '0px';

        // Tenká zlatá linka pod badge
        ctx.beginPath();
        ctx.moveTo(CARD_W / 2 - 160, badgeY + 18);
        ctx.lineTo(CARD_W / 2 + 160, badgeY + 18);
        ctx.strokeStyle = 'rgba(235,192,102,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // ── Datum ──────────────────────────────────────────────
        ctx.font = '300 30px Inter, sans-serif';
        ctx.fillStyle = C_WHITE_DIM;
        ctx.textAlign = 'center';
        ctx.fillText(dateStr, CARD_W / 2, badgeY + 58);

        // ── Zodiac symbol (emoji) ──────────────────────────────
        ctx.font = '180px serif';
        ctx.textAlign = 'center';
        ctx.fillText(signSymbol, CARD_W / 2, circY + 65);

        // ── Jméno znamení ──────────────────────────────────────
        ctx.font = 'bold 88px Cinzel, Georgia, serif';
        ctx.fillStyle = C_GOLD;
        ctx.textAlign = 'center';
        ctx.fillText(signName.toUpperCase(), CARD_W / 2, 680);

        // Ozdobná linka pod jménem
        const lineY = 710;
        const lineW = 300;
        ctx.beginPath();
        ctx.moveTo(CARD_W / 2 - lineW / 2, lineY);
        ctx.lineTo(CARD_W / 2 + lineW / 2, lineY);
        ctx.strokeStyle = 'rgba(235,192,102,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Diamant uprostřed linky
        ctx.save();
        ctx.translate(CARD_W / 2, lineY);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = C_GOLD;
        ctx.fillRect(-5, -5, 10, 10);
        ctx.restore();

        // ── Predikce text ──────────────────────────────────────
        const textX     = 90;
        const textMaxW  = CARD_W - 180;
        const textStartY = 790;

        ctx.font = '400 38px Inter, sans-serif';
        ctx.fillStyle = C_WHITE;
        ctx.textAlign = 'left';
        wrapText(ctx, predictionText, textX, textStartY, textMaxW, 58, 5);

        // ── Afirmace ───────────────────────────────────────────
        if (affirmationText) {
            const affY = 1110;
            // Rámečk afirmace
            ctx.fillStyle = C_GOLD_DIM;
            roundRect(ctx, textX - 20, affY - 46, textMaxW + 40, 130, 16);
            ctx.fill();
            ctx.strokeStyle = 'rgba(235,192,102,0.3)';
            ctx.lineWidth = 1;
            roundRect(ctx, textX - 20, affY - 46, textMaxW + 40, 130, 16);
            ctx.stroke();

            ctx.font = '500 30px Inter, sans-serif';
            ctx.fillStyle = C_GOLD;
            ctx.textAlign = 'left';
            ctx.fillText('✨ Afirmace', textX, affY);

            ctx.font = 'italic 34px Inter, sans-serif';
            ctx.fillStyle = C_WHITE_DIM;
            wrapText(ctx, `"${affirmationText}"`, textX, affY + 46, textMaxW, 46, 2);
        }

        // ── Branding dole ──────────────────────────────────────
        const brandY = CARD_H - 60;

        // Tenká linka
        ctx.beginPath();
        ctx.moveTo(90, brandY - 30);
        ctx.lineTo(CARD_W - 90, brandY - 30);
        ctx.strokeStyle = 'rgba(235,192,102,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Hvězdička
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = C_GOLD;
        ctx.fillText('★', CARD_W / 2 - 220, brandY);

        ctx.font = '500 32px Cinzel, Georgia, serif';
        ctx.fillStyle = C_GOLD;
        ctx.textAlign = 'center';
        ctx.fillText('mystickahvezda.cz', CARD_W / 2, brandY);

        ctx.font = '32px serif';
        ctx.fillText('★', CARD_W / 2 + 220, brandY);

        return canvas;
    }

    // ─── Helper: roundRect ───────────────────────────────────────────────────
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // ─── Aktualizace OG meta tagů pro Facebook ──────────────────────────────
    function updateOGMeta(signName, predictionText, canonicalUrl, slug) {
        const setMeta = (prop, val) => {
            let el = document.querySelector(`meta[property="${prop}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute('property', prop);
                document.head.appendChild(el);
            }
            el.setAttribute('content', val);
        };
        const title = `Horoskop ${signName} — ${new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })} | Mystická Hvězda`;
        const desc  = predictionText.slice(0, 200).trimEnd() + (predictionText.length > 200 ? '…' : '');
        setMeta('og:title',       title);
        setMeta('og:description', desc);
        setMeta('og:url',         canonicalUrl);
        setMeta('og:type',        'article');
        setMeta('og:site_name',   'Mystická Hvězda');
        setMeta('og:image',       `${BASE_URL}/img/og/horoskop-${slug}.jpg`);
        setMeta('og:image:width',  '1200');
        setMeta('og:image:height', '630');
        setMeta('og:image:alt',    `Horoskop ${signName} — Mystická Hvězda`);
    }

    // ─── Vytvoř share panel ──────────────────────────────────────────────────
    function createSharePanel(canvas, signName, signSymbol, canonicalUrl, shareUrlWithUTM) {
        const existing = document.getElementById('horoscope-share-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'horoscope-share-panel';

        // Preview náhled karty (zmenšená)
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width  = 270;
        previewCanvas.height = 338;
        const pCtx = previewCanvas.getContext('2d');
        pCtx.drawImage(canvas, 0, 0, 270, 338);
        previewCanvas.className = 'hs-preview-canvas';

        // Share URL — UTM + anchor (pro clipboard)
        const shareUrl = shareUrlWithUTM || canonicalUrl;

        const fbUrl  = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`;
        const waUrl  = `https://wa.me/?text=${encodeURIComponent(`${signSymbol} Můj dnešní horoskop pro ${signName}: ${shareUrl}`)}`;
        const canShareFiles = !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'test.jpg', { type: 'image/jpeg' })] }));

        panel.innerHTML = `
            <div class="hs-inner">
                <p class="hs-title">✨ Sdílet horoskop ${signSymbol} ${signName}</p>
                <div class="hs-preview-wrap"></div>
                <div class="hs-main-btn-wrap">
                    <button class="hs-btn hs-btn--primary" id="hs-share-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        Sdílet horoskop
                        <svg class="hs-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6,9 12,15 18,9"/></svg>
                    </button>
                </div>
                <div class="hs-options" id="hs-options" aria-hidden="true">
                    <div class="hs-options-inner">
                        ${canShareFiles ? `
                        <button class="hs-opt" id="hs-native-btn">
                            <span class="hs-opt-icon">📲</span>
                            <span>Instagram / TikTok / WhatsApp</span>
                        </button>` : ''}
                        <a class="hs-opt" href="${fbUrl}" target="_blank" rel="noopener">
                            <span class="hs-opt-icon hs-opt-icon--facebook">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                            </span>
                            <span>Facebook</span>
                        </a>
                        <a class="hs-opt" href="${waUrl}" target="_blank" rel="noopener">
                            <span class="hs-opt-icon hs-opt-icon--whatsapp">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                            </span>
                            <span>WhatsApp</span>
                        </a>
                        <button class="hs-opt" id="hs-copy-btn">
                            <span class="hs-opt-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </span>
                            <span>Kopírovat odkaz</span>
                        </button>
                        <button class="hs-opt" id="hs-download-btn">
                            <span class="hs-opt-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </span>
                            <span>Uložit obrázek</span>
                        </button>
                    </div>
                </div>
                <div class="hs-toast" id="hs-toast" role="status" aria-live="polite">✅ Odkaz zkopírován!</div>
            </div>
        `;

        // Vložit preview canvas
        panel.querySelector('.hs-preview-wrap').appendChild(previewCanvas);

        // Hlavní tlačítko — toggle možností
        const shareBtn  = panel.querySelector('#hs-share-btn');
        const optionsEl = panel.querySelector('#hs-options');
        shareBtn.addEventListener('click', () => {
            const open = optionsEl.classList.toggle('hs-options--open');
            optionsEl.setAttribute('aria-hidden', String(!open));
            shareBtn.classList.toggle('hs-share-btn--open', open);
        });

        // Nativní share (mobil) — Instagram / TikTok / WhatsApp
        panel.querySelector('#hs-native-btn')?.addEventListener('click', async () => {
            const filename = `horoskop-${signName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.jpg`;
            const dataUrl  = canvas.toDataURL('image/jpeg', 0.92);
            try {
                const res  = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], filename, { type: 'image/jpeg' });
                await navigator.share({ files: [file], title: `Horoskop ${signName} — Mystická Hvězda`, text: `${signSymbol} Můj dnešní horoskop: ${shareUrl}` });
            } catch (e) { /* uživatel zrušil nebo nepodporováno */ }
        });

        // Download
        panel.querySelector('#hs-download-btn').addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `horoskop-${signName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.92);
            link.click();
        });

        // Copy link
        panel.querySelector('#hs-copy-btn').addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(shareUrl);
            } catch {
                prompt('Zkopírujte odkaz:', shareUrl);
                return;
            }
            const toast = panel.querySelector('#hs-toast');
            toast.classList.add('visible');
            setTimeout(() => toast.classList.remove('visible'), 3000);
        });

        return panel;
    }

    // ─── CSS styles ──────────────────────────────────────────────────────────
    function injectStyles() {
        // Styles live in css/style.v2.css.
    }

    // Hlavni logika - sleduj nacteni horoskopu
    function init() {
        injectStyles();

        const detailSection = document.getElementById('horoscope-detail-section');
        if (!detailSection) return;

        // Placeholder text který se zobrazuje před výběrem znamení
        const PLACEHOLDER = 'Klikněte na kartičku';

        let lastSign = null;

        function tryRenderPanel() {
            const signName    = document.getElementById('detail-name')?.innerText?.trim();
            const signSymbol  = document.getElementById('detail-symbol')?.innerText?.trim();
            const dateStr     = document.getElementById('detail-date')?.innerText?.trim();
            const prediction  = document.getElementById('detail-text')?.innerText?.trim();
            const affirmation = document.getElementById('detail-work')?.innerText
                ?.replace(/^✨\s*Afirmace:\s*/i, '').trim();

            // Přeskočit pokud není vybrané znamení nebo text je placeholder / příliš krátký
            if (!signName || signName === 'Zvěrokruh') return;
            if (!prediction || prediction.startsWith(PLACEHOLDER) || prediction.length < 40) return;
            // Přeskočit chybové hlášení
            if (prediction.includes('Zkuste se ztišit')) return;

            // Nespouštět znovu pokud se nic nezměnilo
            if (lastSign === signName + prediction.slice(0, 20)) return;
            lastSign = signName + prediction.slice(0, 20);

            // Canonical URL se slugem znamení
            const slug = signName.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-');
            // Canonical URL bez hash fragmentu (FB crawler nevidí JS, hash by nefungoval)
            // Canonical s ?znak= pro server-side OG injection (FB scraper dostane správný og:image)
            const canonical = `${BASE_URL}/horoskopy.html?znak=${encodeURIComponent(slug)}`;
            // Share URL s UTM + anchor — pro kopírování odkazu
            const shareUrlWithUTM = `${BASE_URL}/horoskopy.html?znak=${encodeURIComponent(slug)}&utm_source=social&utm_medium=share&utm_campaign=horoscope#${slug}`;

            // Aktualizuj OG meta
            updateOGMeta(signName, prediction, canonical, slug);

            // Vygeneruj canvas kartu
            const canvas = generateHoroscopeCard(signSymbol, signName, dateStr || '', prediction, affirmation || '');

            // Vlož share panel
            const contentContainer = detailSection.querySelector('.horoscope-content');
            if (!contentContainer) return;

            const panel = createSharePanel(canvas, signName, signSymbol, canonical, shareUrlWithUTM);

            // Odstraň starý panel pokud existuje
            const old = contentContainer.querySelector('#horoscope-share-panel');
            if (old) old.remove();

            contentContainer.appendChild(panel);
        }

        // Sleduj změny v detail-text (childList + characterData + subtree) i data-loaded atribut
        const observer = new MutationObserver(tryRenderPanel);

        observer.observe(detailSection, {
            attributes: true,
            attributeFilter: ['data-loaded'],
            childList: true,
            subtree: true,
            characterData: true,
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
