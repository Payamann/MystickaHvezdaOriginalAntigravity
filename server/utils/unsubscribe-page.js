import { publicAssetVersioning } from './public-assets.js';

/**
 * Shared CSP-safe HTML renderer for one-click unsubscribe responses.
 * No inline styles or scripts — styling comes from the public stylesheet.
 */
export function renderUnsubscribePage({ title, message }) {
    return publicAssetVersioning.html(`<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
            <title>${title} — Mystická Hvězda</title>
            <link rel="stylesheet" href="/fonts/local-fonts.css">
            <link rel="stylesheet" href="/css/style.v2.min.css?v=11">
            <link rel="stylesheet" href="/css/atlas-web.css?v=1">
            </head><body class="atlas-page unsubscribe-page"><div class="unsubscribe-page__box">
            <h1>${title}</h1>
            <p>${message}</p>
            <a href="/">← Zpět na Mystickou Hvězdu</a>
            </div></body></html>`, '/');
}
