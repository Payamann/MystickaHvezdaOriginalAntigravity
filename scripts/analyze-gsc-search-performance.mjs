#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

function parseArgs(argv) {
    const args = {
        dir: null,
        output: null,
        top: 20,
        minImpressions: 50
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--dir') args.dir = argv[++index];
        else if (arg === '--output') args.output = argv[++index];
        else if (arg === '--top') args.top = Number(argv[++index]);
        else if (arg === '--min-impressions') args.minImpressions = Number(argv[++index]);
        else if (arg === '--help' || arg === '-h') args.help = true;
        else throw new Error(`Unknown argument: ${arg}`);
    }

    return args;
}

function usage() {
    return `Usage:
  node scripts/analyze-gsc-search-performance.mjs --dir <extracted-gsc-export-dir> [--output report.md]

Reads Czech Google Search Console CSV export files:
  Dotazy.csv, Stránky.csv, Graf.csv, Zařízení.csv, Země.csv

The report is aggregate-only and safe to keep internally. Do not commit raw GSC exports.`;
}

function parseCsv(content) {
    const rows = [];
    let field = '';
    let row = [];
    let inQuotes = false;

    for (let index = 0; index < content.length; index += 1) {
        const char = content[index];
        const next = content[index + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                field += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push(field);
            field = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') index += 1;
            row.push(field);
            if (row.some((value) => value !== '')) rows.push(row);
            row = [];
            field = '';
        } else {
            field += char;
        }
    }

    if (field || row.length) {
        row.push(field);
        if (row.some((value) => value !== '')) rows.push(row);
    }

    const [headers = [], ...dataRows] = rows;
    return dataRows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

function readCsv(dir, fileName) {
    const filePath = path.join(dir, fileName);
    if (!fs.existsSync(filePath)) return [];
    return parseCsv(fs.readFileSync(filePath, 'utf8'));
}

function asInteger(value) {
    const normalized = String(value || '0').replace(/\s+/g, '').replace(',', '.');
    return Number.parseInt(normalized, 10) || 0;
}

function asNumber(value) {
    const normalized = String(value || '0').replace('%', '').replace(/\s+/g, '').replace(',', '.');
    return Number.parseFloat(normalized) || 0;
}

function normalizeRows(rows, dimensionName) {
    return rows.map((row) => ({
        dimension: row[dimensionName] || '',
        clicks: asInteger(row.Prokliky),
        impressions: asInteger(row.Zobrazení),
        ctr: asNumber(row.CTR),
        position: asNumber(row.Pozice)
    })).filter((row) => row.dimension);
}

function expectedCtr(position) {
    if (position <= 3) return 10;
    if (position <= 5) return 6;
    if (position <= 10) return 4;
    if (position <= 20) return 2.5;
    return 1.5;
}

function opportunity(row) {
    const targetCtr = expectedCtr(row.position);
    const potentialClicks = Math.max(0, Math.round((row.impressions * (targetCtr / 100)) - row.clicks));
    return { ...row, targetCtr, potentialClicks };
}

function classifyAction(row, type) {
    const value = row.dimension.toLowerCase();

    if (row.position <= 10 && row.ctr < 1) return 'Přepsat český title/meta a první odpověď nad foldem';
    if (row.position <= 10 && row.ctr < 3.5) return 'CTR refresh: title/meta + přesnější český snippet';
    if (row.position > 10 && row.position <= 20) return 'Content refresh + interní odkazy z hubů';
    if (type === 'query' && /ano\s*(ne|\/ne)|ano nebo ne|áno|nie|karta dne/u.test(value)) return 'Zpřesnit intent rychlé odpovědi a CTA';
    if (/partnerska-shoda|panna|lev|beran|aries|střelec|ryby|vodnář|býk/u.test(value)) return 'Posílit vztahový/znamení intent česky';
    if (/tarot-vyznam|význam|karta/u.test(value)) return 'Rozšířit šablonu významu o lásku, práci a ano/ne';

    return 'Monitorovat nebo zařadit do dalšího content slicu';
}

function table(rows, columns) {
    if (!rows.length) return '_Žádná data pro tuto sekci._\n';
    const header = `| ${columns.map((column) => column.label).join(' | ')} |`;
    const separator = `| ${columns.map(() => '---').join(' | ')} |`;
    const body = rows.map((row) => `| ${columns.map((column) => column.format(row)).join(' | ')} |`);
    return [header, separator, ...body].join('\n');
}

function formatPct(value) {
    return `${value.toFixed(2).replace('.', ',')} %`;
}

function formatNumber(value) {
    return new Intl.NumberFormat('cs-CZ').format(value);
}

function summarizeTrend(graphRows) {
    if (!graphRows.length) return null;

    const normalized = graphRows
        .map((row) => ({
            date: row.Datum,
            clicks: asInteger(row.Prokliky),
            impressions: asInteger(row.Zobrazení)
        }))
        .filter((row) => row.date)
        .sort((a, b) => a.date.localeCompare(b.date));

    const first14 = normalized.slice(0, 14);
    const last14 = normalized.slice(-14);
    const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);

    return {
        firstDate: normalized[0]?.date || '',
        lastDate: normalized.at(-1)?.date || '',
        first14Clicks: sum(first14, 'clicks'),
        first14Impressions: sum(first14, 'impressions'),
        last14Clicks: sum(last14, 'clicks'),
        last14Impressions: sum(last14, 'impressions')
    };
}

function buildReport({ dir, top, minImpressions }) {
    const queries = normalizeRows(readCsv(dir, 'Dotazy.csv'), 'Nejčastější dotazy');
    const pages = normalizeRows(readCsv(dir, 'Stránky.csv'), 'Nejvýznamnější stránky');
    const devices = normalizeRows(readCsv(dir, 'Zařízení.csv'), 'Zařízení');
    const countries = normalizeRows(readCsv(dir, 'Země.csv'), 'Země');
    const graph = readCsv(dir, 'Graf.csv');
    const filters = readCsv(dir, 'Filtry.csv');
    const trend = summarizeTrend(graph);

    const totals = devices.reduce((acc, row) => ({
        clicks: acc.clicks + row.clicks,
        impressions: acc.impressions + row.impressions
    }), { clicks: 0, impressions: 0 });
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const avgPosition = devices.reduce((sum, row) => sum + (row.position * row.impressions), 0)
        / Math.max(1, totals.impressions);

    const queryOpportunities = queries
        .filter((row) => row.impressions >= minImpressions)
        .map(opportunity)
        .filter((row) => row.potentialClicks > 0 || (row.position <= 12 && row.ctr < 3.5))
        .sort((a, b) => b.potentialClicks - a.potentialClicks || b.impressions - a.impressions)
        .slice(0, top);

    const pageOpportunities = pages
        .filter((row) => row.impressions >= minImpressions)
        .map(opportunity)
        .filter((row) => row.potentialClicks > 0 || (row.position <= 12 && row.ctr < 3.5))
        .sort((a, b) => b.potentialClicks - a.potentialClicks || b.impressions - a.impressions)
        .slice(0, top);

    const filterSummary = filters.map((row) => `${row.Filtr}: ${row.Hodnota}`).join(', ') || 'neuvedeno';

    return `# GSC SEO Opportunity Report

Zdroj: český Search Console export z adresáře \`${path.relative(repoRoot, dir) || dir}\`

## Souhrn

| Metrika | Hodnota |
|---|---:|
| Filtry | ${filterSummary} |
| Období grafu | ${trend ? `${trend.firstDate} až ${trend.lastDate}` : 'neuvedeno'} |
| Kliky | ${formatNumber(totals.clicks)} |
| Zobrazení | ${formatNumber(totals.impressions)} |
| CTR | ${formatPct(ctr)} |
| Průměrná pozice | ${avgPosition.toFixed(2).replace('.', ',')} |
| Prvních 14 dní | ${trend ? `${formatNumber(trend.first14Clicks)} kliků / ${formatNumber(trend.first14Impressions)} zobrazení` : 'neuvedeno'} |
| Posledních 14 dní | ${trend ? `${formatNumber(trend.last14Clicks)} kliků / ${formatNumber(trend.last14Impressions)} zobrazení` : 'neuvedeno'} |

## Prioritní dotazy

${table(queryOpportunities, [
        { label: 'Dotaz', format: (row) => row.dimension.replace(/\|/g, '/') },
        { label: 'Kliky', format: (row) => formatNumber(row.clicks) },
        { label: 'Zobrazení', format: (row) => formatNumber(row.impressions) },
        { label: 'CTR', format: (row) => formatPct(row.ctr) },
        { label: 'Pozice', format: (row) => row.position.toFixed(2).replace('.', ',') },
        { label: 'Potenciál', format: (row) => `+${formatNumber(row.potentialClicks)}` },
        { label: 'Akce', format: (row) => classifyAction(row, 'query') }
    ])}

## Prioritní stránky

${table(pageOpportunities, [
        { label: 'Stránka', format: (row) => row.dimension.replace('https://www.mystickahvezda.cz', '') },
        { label: 'Kliky', format: (row) => formatNumber(row.clicks) },
        { label: 'Zobrazení', format: (row) => formatNumber(row.impressions) },
        { label: 'CTR', format: (row) => formatPct(row.ctr) },
        { label: 'Pozice', format: (row) => row.position.toFixed(2).replace('.', ',') },
        { label: 'Potenciál', format: (row) => `+${formatNumber(row.potentialClicks)}` },
        { label: 'Akce', format: (row) => classifyAction(row, 'page') }
    ])}

## Zařízení

${table(devices, [
        { label: 'Zařízení', format: (row) => row.dimension },
        { label: 'Kliky', format: (row) => formatNumber(row.clicks) },
        { label: 'Zobrazení', format: (row) => formatNumber(row.impressions) },
        { label: 'CTR', format: (row) => formatPct(row.ctr) },
        { label: 'Pozice', format: (row) => row.position.toFixed(2).replace('.', ',') }
    ])}

## Země

${table(countries.slice(0, 10), [
        { label: 'Země', format: (row) => row.dimension },
        { label: 'Kliky', format: (row) => formatNumber(row.clicks) },
        { label: 'Zobrazení', format: (row) => formatNumber(row.impressions) },
        { label: 'CTR', format: (row) => formatPct(row.ctr) },
        { label: 'Pozice', format: (row) => row.position.toFixed(2).replace('.', ',') }
    ])}

## Doporučený další slice

1. CTR refresh pro stránky s pozicí do 10 a CTR pod 3,5 %.
2. Český snippet a první odpověď nad foldem pro dotazy s vysokými zobrazeními.
3. Šablonové rozšíření tarotových významů a partnerských dvojic.
4. Interní odkazy z výkonných hubů na revenue nástroje.
`;
}

try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help || !args.dir) {
        console.log(usage());
        process.exit(args.help ? 0 : 1);
    }

    const dir = path.resolve(args.dir);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
        throw new Error(`Directory not found: ${dir}`);
    }

    const report = buildReport({
        dir,
        top: Number.isFinite(args.top) ? args.top : 20,
        minImpressions: Number.isFinite(args.minImpressions) ? args.minImpressions : 50
    });

    if (args.output) {
        const output = path.resolve(args.output);
        fs.mkdirSync(path.dirname(output), { recursive: true });
        fs.writeFileSync(output, report, 'utf8');
        console.log(`Wrote ${output}`);
    } else {
        console.log(report);
    }
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
