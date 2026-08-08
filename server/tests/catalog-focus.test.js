import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

const PUBLIC_SALES_SURFACES = [
    'index.html',
    'cenik.html',
    'osobni-mapa.html',
    'horoskopy.html',
    'mesicni-horoskop.html',
    'tydenni-horoskop.html',
    'kalkulacka-cisla-osudu.html',
    'server/jobs/weekly-newsletter.js'
];

function read(relativePath) {
    return fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');
}

describe('Focused public catalog', () => {
    test.each(PUBLIC_SALES_SURFACES)('%s does not sell the retired fixed-year product', (relativePath) => {
        const source = read(relativePath);

        expect(source).not.toContain('rocni-horoskop.html');
        expect(source).not.toContain('data-product="rocni_horoskop_2026"');
        expect(source).not.toContain('feature=rocni_horoskop_2026');
    });

    test('pricing and homepage expose the evergreen Personal Map', () => {
        expect(read('cenik.html')).toContain('data-product="osobni_mapa_2026"');
        expect(read('index.html')).toContain('img/personal-map/personal-map-evergreen-v2.webp');
        expect(read('osobni-mapa.html')).toContain('12 měsíců od objednávky');
    });

    test('legacy annual page is noindex for historical purchase confirmations only', () => {
        expect(read('rocni-horoskop.html')).toContain('<meta name="robots" content="noindex, follow">');
    });
});
