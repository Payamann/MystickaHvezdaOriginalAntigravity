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
const essencePath = path.join(outputDir, 'osobni-mapa-essence-dark.png');
const mainPath = path.join(outputDir, 'osobni-mapa-main-dark.png');
const actionsPath = path.join(outputDir, 'osobni-mapa-actions-dark.png');

await fs.writeFile(htmlPath, buildPersonalMapHtml(samplePersonalMapData), 'utf8');
await renderPersonalMapPdf(samplePersonalMapData, pdfPath);
await renderPersonalMapCoverPreview(samplePersonalMapData, coverPath);
await renderPersonalMapPagePreview(samplePersonalMapData, essencePath, '.mh-pdf-page--essence');
await renderPersonalMapPagePreview(samplePersonalMapData, mainPath, '.mh-pdf-page--content');
await renderPersonalMapPagePreview(samplePersonalMapData, actionsPath, '.mh-pdf-page--actions');

console.log(JSON.stringify({
    html: htmlPath,
    pdf: pdfPath,
    cover: coverPath,
    essence: essencePath,
    main: mainPath,
    actions: actionsPath
}, null, 2));
