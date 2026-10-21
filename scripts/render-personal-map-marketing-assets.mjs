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

const previewInput = { ...samplePersonalMapData, preview: true };
const html = buildPersonalMapHtml(previewInput);
const pdfOutputDir = path.join(rootDir, 'output', 'pdf');
await fs.mkdir(pdfOutputDir, { recursive: true });
const pdfPath = path.join(pdfOutputDir, 'osobni-mapa-modelova-arch-v2.pdf');
await fs.writeFile(path.join(previewDir, 'osobni-mapa-12-mesicu.html'), html, 'utf8');
await renderPersonalMapPdf(previewInput, pdfPath);
await fs.copyFile(pdfPath, path.join(outputDir, 'modelova-mapa-arch-v2.pdf'));

const browser = await chromium.launch(getChromiumLaunchOptions());
let page;

try {
    page = await browser.newPage({ viewport: { width: 1200, height: 1700 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate('document.fonts?.ready ? document.fonts.ready.then(() => true) : true');

    const assets = [
        ['preview-cover-arch-v2.webp', '.mh-pdf-page--cover'],
        ['preview-signature-atlas.webp', '.mh-pdf-page--signature'],
        ['preview-mantra-atlas.webp', '.mh-pdf-page--mantra'],
        ['preview-actions-atlas.webp', '.mh-pdf-page--actions']
    ];

    for (const [fileName, selector] of assets) {
        const png = await page.locator(selector).first().screenshot({ type: 'png' });
        await sharp(png)
            .resize(760, 1075, { fit: 'fill' })
            .webp({ quality: 84, effort: 5 })
            .toFile(path.join(outputDir, fileName));
    }

    const pageLocators = page.locator('.mh-pdf-page');
    const contactPages = await pageLocators.count();
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
            height: 40 + Math.ceil(contactPages / 4) * 289 + 12,
            channels: 3,
            background: '#0b1929'
        }
    })
        .composite(composites)
        .webp({ quality: 82, effort: 5 })
        .toFile(path.join(outputDir, 'preview-contact-sheet-arch-v2.webp'));

    const coverImage = (await fs.readFile(path.join(outputDir, 'preview-cover-arch-v2.webp'))).toString('base64');
    await page.setViewportSize({ width:1200, height:630 });
    await page.setContent(`<html lang="cs"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#0b1929;color:#e9e3d7}main{height:630px;display:grid;grid-template-columns:1fr 310px;gap:70px;align-items:center;padding:58px 80px}small{font:16px Arial,sans-serif;color:#d0b17c;letter-spacing:2px}h1{font:54px/1.15 Georgia,serif;margin:28px 0}p{font:23px/1.5 Arial,sans-serif;max-width:600px;color:#c3c9cb}img{width:290px;border:1px solid #bd9b6544}footer{font:16px Arial,sans-serif;color:#d0b17c;margin-top:26px}</style><main><section><small>MYSTICKÁ HVĚZDA</small><h1>Osobní mapa<br>na 12 měsíců</h1><p>Jedna otázka. Souvislosti a malé kroky, ke kterým se můžeš vracet.</p><footer>20 stran PDF · 299 Kč jednorázově</footer></section><img src="data:image/webp;base64,${coverImage}" alt="Modelová obálka"></main></html>`);
    await sharp(await page.screenshot({ type:'png' })).webp({ quality:86 }).toFile(path.join(outputDir,'share-arch-v2.webp'));
} finally {
    await page?.close({ runBeforeUnload: false });
    await browser.close();
}

const responsiveAssets = [
    { fileName: 'preview-cover-arch-v2.webp', widths: [380, 570] },
    { fileName: 'preview-signature-atlas.webp', widths: [380, 570] },
    { fileName: 'preview-actions-atlas.webp', widths: [380, 570] },
    { fileName: 'preview-contact-sheet-arch-v2.webp', widths: [416, 624] }
];

for (const { fileName, widths } of responsiveAssets) {
    const source = await fs.readFile(path.join(outputDir, fileName));
    for (const width of widths) {
        const responsiveFileName = fileName.replace(/\.webp$/, `-${width}.webp`);
        await sharp(source)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: width <= 480 ? 82 : 86, effort: 6 })
            .toFile(path.join(outputDir, responsiveFileName));
    }
}

console.log(JSON.stringify({
    pdf: pdfPath,
    assets: [
        'preview-cover-arch-v2.webp',
        'preview-cover-arch-v2-380.webp',
        'preview-cover-arch-v2-570.webp',
        'preview-signature-atlas.webp',
        'preview-signature-atlas-380.webp',
        'preview-signature-atlas-570.webp',
        'preview-mantra-atlas.webp',
        'preview-actions-atlas.webp',
        'preview-actions-atlas-380.webp',
        'preview-actions-atlas-570.webp',
        'preview-contact-sheet-arch-v2.webp',
        'preview-contact-sheet-arch-v2-416.webp',
        'preview-contact-sheet-arch-v2-624.webp'
    ].map((fileName) => path.join(outputDir, fileName))
}, null, 2));
