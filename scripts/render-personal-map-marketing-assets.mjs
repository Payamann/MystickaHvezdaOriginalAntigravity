import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { chromium } from '@playwright/test';
import sharp from 'sharp';

process.env.NODE_ENV ||= 'test';

const {
    buildPersonalMapHtml,
    renderPersonalMapPdf,
    samplePersonalMapData
} = await import('../server/services/personal-map-pdf.js');
const { getChromiumLaunchOptions } = await import('../server/services/chromium-launch.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'img', 'personal-map');
const previewDir = path.join(rootDir, 'tmp', 'personal-map-preview');

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const html = buildPersonalMapHtml(samplePersonalMapData);
const pdfPath = path.join(previewDir, 'osobni-mapa-12-mesicu.pdf');
await fs.writeFile(path.join(previewDir, 'osobni-mapa-12-mesicu.html'), html, 'utf8');
await renderPersonalMapPdf(samplePersonalMapData, pdfPath);

const browser = await chromium.launch(getChromiumLaunchOptions());
let page;

try {
    page = await browser.newPage({ viewport: { width: 1200, height: 1700 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate('document.fonts?.ready ? document.fonts.ready.then(() => true) : true');

    const assets = [
        ['preview-cover.webp', '.mh-pdf-page--cover'],
        ['preview-signature.webp', '.mh-pdf-page--signature'],
        ['preview-mantra.webp', '.mh-pdf-page--mantra'],
        ['preview-actions.webp', '.mh-pdf-page--actions']
    ];

    for (const [fileName, selector] of assets) {
        const png = await page.locator(selector).first().screenshot({ type: 'png' });
        await sharp(png)
            .resize(760, 1075, { fit: 'fill' })
            .webp({ quality: 84, effort: 5 })
            .toFile(path.join(outputDir, fileName));
    }

    const pageLocators = page.locator('.mh-pdf-page');
    const contactPages = Math.min(await pageLocators.count(), 16);
    const composites = [];

    for (let index = 0; index < contactPages; index += 1) {
        const png = await pageLocators.nth(index).screenshot({ type: 'png' });
        const thumbnail = await sharp(png)
            .resize(190, 269, { fit: 'fill' })
            .webp({ quality: 78, effort: 4 })
            .toBuffer();
        const column = index % 4;
        const row = Math.floor(index / 4);
        composites.push({
            input: thumbnail,
            left: 12 + (column * 206),
            top: 40 + (row * 289)
        });
    }

    await sharp({
        create: {
            width: 832,
            height: 1216,
            channels: 3,
            background: '#09090e'
        }
    })
        .composite(composites)
        .webp({ quality: 82, effort: 5 })
        .toFile(path.join(outputDir, 'preview-contact-sheet.webp'));
} finally {
    await page?.close({ runBeforeUnload: false });
    await browser.close();
}

console.log(JSON.stringify({
    pdf: pdfPath,
    assets: [
        'preview-cover.webp',
        'preview-signature.webp',
        'preview-mantra.webp',
        'preview-actions.webp',
        'preview-contact-sheet.webp'
    ].map((fileName) => path.join(outputDir, fileName))
}, null, 2));
