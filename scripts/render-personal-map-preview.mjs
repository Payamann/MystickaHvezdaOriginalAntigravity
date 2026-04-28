import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import {
    buildPersonalMapHtml,
    renderPersonalMapCoverPreview,
    renderPersonalMapPagePreview,
    renderPersonalMapPdf,
    samplePersonalMapData
} from '../server/services/personal-map-pdf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'tmp', 'personal-map-preview');

await fs.mkdir(outputDir, { recursive: true });

const htmlPath = path.join(outputDir, 'osobni-mapa-preview-dark.html');
const pdfPath = path.join(outputDir, 'osobni-mapa-preview-dark.pdf');
const coverPath = path.join(outputDir, 'osobni-mapa-cover-dark.png');
const signaturePath = path.join(outputDir, 'osobni-mapa-signature-dark.png');
const essencePath = path.join(outputDir, 'osobni-mapa-essence-dark.png');
const mantraPath = path.join(outputDir, 'osobni-mapa-mantra-dark.png');
const mainPath = path.join(outputDir, 'osobni-mapa-main-dark.png');
const actionsPath = path.join(outputDir, 'osobni-mapa-actions-dark.png');
const journalPath = path.join(outputDir, 'osobni-mapa-journal-dark.png');

await fs.writeFile(htmlPath, buildPersonalMapHtml(samplePersonalMapData), 'utf8');
await renderPersonalMapPdf(samplePersonalMapData, pdfPath);
await renderPersonalMapCoverPreview(samplePersonalMapData, coverPath);
await renderPersonalMapPagePreview(samplePersonalMapData, signaturePath, '.mh-pdf-page--signature');
await renderPersonalMapPagePreview(samplePersonalMapData, essencePath, '.mh-pdf-page--essence');
await renderPersonalMapPagePreview(samplePersonalMapData, mantraPath, '.mh-pdf-page--mantra');
await renderPersonalMapPagePreview(samplePersonalMapData, mainPath, '.mh-pdf-page--content');
await renderPersonalMapPagePreview(samplePersonalMapData, actionsPath, '.mh-pdf-page--actions');
await renderPersonalMapPagePreview(samplePersonalMapData, journalPath, '.mh-pdf-page--journal');

console.log(JSON.stringify({
    html: htmlPath,
    pdf: pdfPath,
    cover: coverPath,
    signature: signaturePath,
    essence: essencePath,
    mantra: mantraPath,
    main: mainPath,
    actions: actionsPath,
    journal: journalPath
}, null, 2));
