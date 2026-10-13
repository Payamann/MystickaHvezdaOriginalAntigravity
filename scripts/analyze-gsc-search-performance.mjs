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
        minImpressions: 50,
        currentRange: null,
        priorRange: null
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--dir') args.dir = argv[++index];
        else if (arg === '--output') args.output = argv[++index];
        else if (arg === '--top') args.top = Number(argv[++index]);
        else if (arg === '--min-impressions') args.minImpressions = Number(argv[++index]);
        else if (arg === '--current-range') args.currentRange = argv[++index];
        else if (arg === '--prior-range') args.priorRange = argv[++index];
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

Comparison exports with headers such as "Posledních 28 dnů Prokliky" and
"Předchozích 28 dnů Prokliky" are reported with observed deltas. When the
export does not contain explicit date ranges, pass --current-range and
--prior-range; the script never invents dates.

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

function metric(value) {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    const normalized = String(value).replace('%', '').replace(/\s+/g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

function periodKey(row, period, metricName) {
    if (period === 'single' && Object.hasOwn(row, metricName)) return metricName;
    const marker = period === 'current' ? /^Posledních\s+\d+\s+dnů\s+/u : /^Předchozích\s+\d+\s+dnů\s+/u;
    return Object.keys(row).find((key) => marker.test(key) && key.endsWith(` ${metricName}`)) || null;
}

function normalizeRows(rows, dimensionName) {
    return rows.map((row) => {
        const currentPrefix = periodKey(row, 'current', 'Prokliky') ? 'current' : 'single';
        const value = (period, name) => {
            const key = periodKey(row, period, name);
            return key ? metric(row[key]) : null;
        };
        return {
            dimension: row[dimensionName] || '',
            clicks: value(currentPrefix, 'Prokliky'),
            impressions: value(currentPrefix, 'Zobrazení'),
            ctr: value(currentPrefix, 'CTR'),
            position: value(currentPrefix, 'Pozice'),
            priorClicks: value('prior', 'Prokliky'),
            priorImpressions: value('prior', 'Zobrazení'),
            priorCtr: value('prior', 'CTR'),
            priorPosition: value('prior', 'Pozice'),
            comparison: currentPrefix === 'current'
        };
    }).filter((row) => row.dimension);
}

function classifyAction(row, type) {
    const value = row.dimension.toLowerCase();

    if (row.position !== null && row.position <= 10) return 'Prověřit soulad snippetu s intentem a první odpovědí';
    if (row.position !== null && row.position <= 20) return 'Prověřit obsah a interní odkazy';
    if (type === 'query' && /ano\s*(ne|\/ne)|ano nebo ne|áno|nie|karta dne/u.test(value)) return 'Zpřesnit intent rychlé odpovědi a CTA';
    if (/partnerska-shoda|panna|lev|beran|aries|střelec|ryby|vodnář|býk/u.test(value)) return 'Posílit vztahový/znamení intent česky';
    if (/tarot-vyznam|význam|karta/u.test(value)) return 'Posoudit obsah a interní odkazy';

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
    return value === null || value === undefined ? '—' : `${value.toFixed(2).replace('.', ',')} %`;
}

function formatMetric(value) {
    return value === null || value === undefined ? '—' : formatNumber(value);
}

function formatPosition(value) {
    return value === null || value === undefined ? '—' : value.toFixed(2).replace('.', ',');
}

function delta(current, prior) {
    return current === null || current === undefined || prior === null || prior === undefined
        ? null
        : current - prior;
}

function formatDelta(current, prior) {
    const value = delta(current, prior);
    if (value === null) return '—';
    return `${value > 0 ? '+' : ''}${formatNumber(value)}`;
}

function formatNumber(value) {
    return new Intl.NumberFormat('cs-CZ').format(value);
}

function summarizeTrend(graphRows) {
    if (!graphRows.length) return null;

    const normalized = graphRows
        .map((row) => ({
            date: row.Datum,
            clicks: metric(row.Prokliky),
            impressions: metric(row.Zobrazení)
        }))
        .filter((row) => row.date && row.clicks !== null && row.impressions !== null)
        .sort((a, b) => a.date.localeCompare(b.date));

    if (!normalized.length) return null;

    const first14 = normalized.slice(0, 14);
    const last14 = normalized.slice(-14);
    const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);

    return {
        firstDate: normalized[0]?.date || '',
        lastDate: normalized.at(-1)?.date || '',
        first14Clicks: sum(first14, 'clicks'),
        first14Impressions: sum(first14, 'impressions'),
        last14Clicks: sum(last14, 'clicks'),
        last14Impressions: sum(last14, 'impressions'),
        days: normalized.length,
        totalClicks: sum(normalized, 'clicks'),
        totalImpressions: sum(normalized, 'impressions')
    };
}

function graphTotals(graphRows) {
    if (!graphRows.length) return null;
    const rows = graphRows.map((row) => ({
        date: row.Datum,
        clicks: metric(row.Prokliky),
        impressions: metric(row.Zobrazení)
    }));
    if (rows.some((row) => !row.date || row.clicks === null || row.impressions === null)) return null;
    return {
        clicks: rows.reduce((total, row) => total + row.clicks, 0),
        impressions: rows.reduce((total, row) => total + row.impressions, 0)
    };
}

function sumMetric(rows, field) {
    if (!rows.length || rows.some((row) => row[field] === null || row[field] === undefined)) return null;
    return rows.reduce((total, row) => total + row[field], 0);
}

function weightedPosition(rows, positionField, impressionField) {
    if (!rows.length || rows.some((row) => row[positionField] === null || row[impressionField] === null)) return null;
    const impressions = sumMetric(rows, impressionField);
    return impressions > 0
        ? rows.reduce((sum, row) => sum + (row[positionField] * row[impressionField]), 0) / impressions
        : null;
}

function buildReport({ dir, top, minImpressions, currentRange, priorRange }) {
    const queries = normalizeRows(readCsv(dir, 'Dotazy.csv'), 'Nejčastější dotazy');
    const pages = normalizeRows(readCsv(dir, 'Stránky.csv'), 'Nejvýznamnější stránky');
    const devices = normalizeRows(readCsv(dir, 'Zařízení.csv'), 'Zařízení');
    const countries = normalizeRows(readCsv(dir, 'Země.csv'), 'Země');
    const graph = readCsv(dir, 'Graf.csv');
    const filters = readCsv(dir, 'Filtry.csv');
    const trend = summarizeTrend(graph);
    const graphAggregate = graphTotals(graph);

    const totalRows = devices.length ? devices : pages;
    const currentAggregate = graphAggregate || null;
    const totals = {
        clicks: currentAggregate?.clicks ?? sumMetric(totalRows, 'clicks'),
        impressions: currentAggregate?.impressions ?? sumMetric(totalRows, 'impressions'),
        priorClicks: sumMetric(totalRows, 'priorClicks'),
        priorImpressions: sumMetric(totalRows, 'priorImpressions')
    };
    const totalsSource = currentAggregate ? 'Graf.csv (součet platných dnů)' : devices.length ? 'Zařízení.csv' : pages.length ? 'Stránky.csv (částečný součet exportovaných řádků)' : 'neuvedeno';
    const ctr = totals.clicks !== null && totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : null;
    const priorCtr = totals.priorClicks !== null && totals.priorImpressions > 0
        ? (totals.priorClicks / totals.priorImpressions) * 100
        : null;
    const avgPosition = weightedPosition(totalRows, 'position', 'impressions');
    const priorAvgPosition = weightedPosition(totalRows, 'priorPosition', 'priorImpressions');

    const queryOpportunities = queries
        .filter((row) => row.impressions !== null && row.impressions >= minImpressions && row.position !== null)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, top);

    const pageOpportunities = pages
        .filter((row) => row.impressions !== null && row.impressions >= minImpressions && row.position !== null)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, top);

    const filterSummary = filters.map((row) => `${row.Filtr}: ${row.Hodnota}`).join(', ') || 'neuvedeno';

    return `# GSC SEO Opportunity Report

Zdroj: český Search Console export z adresáře \`${path.relative(repoRoot, dir) || dir}\`

## Souhrn

| Metrika | Hodnota |
|---|---:|
| Filtry | ${filterSummary} |
| Zdroj souhrnu | ${totalsSource} |
| Aktuální období | ${currentRange || (filters.find((row) => row.Filtr === 'Datum')?.Hodnota || 'neuvedeno')} |
| Předchozí období | ${priorRange || 'neuvedeno (export jej neuvádí)'} |
| Kliky (aktuální / předchozí) | ${formatMetric(totals.clicks)} / ${formatMetric(totals.priorClicks)} (${formatDelta(totals.clicks, totals.priorClicks)}) |
| Zobrazení (aktuální / předchozí) | ${formatMetric(totals.impressions)} / ${formatMetric(totals.priorImpressions)} (${formatDelta(totals.impressions, totals.priorImpressions)}) |
| CTR | ${formatPct(ctr)} |
| CTR (předchozí) | ${formatPct(priorCtr)} |
| Průměrná pozice (aktuální / předchozí) | ${formatPosition(avgPosition)} / ${formatPosition(priorAvgPosition)} |
| Prvních 14 dní | ${trend?.days >= 28 ? `${formatNumber(trend.first14Clicks)} kliků / ${formatNumber(trend.first14Impressions)} zobrazení` : trend ? 'neuvedeno (graf má méně než 28 dní)' : 'neuvedeno'} |
| Posledních 14 dní | ${trend?.days >= 28 ? `${formatNumber(trend.last14Clicks)} kliků / ${formatNumber(trend.last14Impressions)} zobrazení` : trend ? 'neuvedeno (graf má méně než 28 dní)' : 'neuvedeno'} |

## Prioritní dotazy

${table(queryOpportunities, [
        { label: 'Dotaz', format: (row) => row.dimension.replace(/\|/g, '/') },
        { label: 'Kliky akt.', format: (row) => formatMetric(row.clicks) },
        { label: 'Kliky před.', format: (row) => formatMetric(row.priorClicks) },
        { label: 'Δ kliky', format: (row) => formatDelta(row.clicks, row.priorClicks) },
        { label: 'Zobrazení akt.', format: (row) => formatMetric(row.impressions) },
        { label: 'Zobrazení před.', format: (row) => formatMetric(row.priorImpressions) },
        { label: 'Δ zobrazení', format: (row) => formatDelta(row.impressions, row.priorImpressions) },
        { label: 'CTR', format: (row) => formatPct(row.ctr) },
        { label: 'Pozice', format: (row) => formatPosition(row.position) },
        { label: 'Akce', format: (row) => classifyAction(row, 'query') }
    ])}

## Prioritní stránky

${table(pageOpportunities, [
        { label: 'Stránka', format: (row) => row.dimension.replace('https://www.mystickahvezda.cz', '') },
        { label: 'Kliky akt.', format: (row) => formatMetric(row.clicks) },
        { label: 'Kliky před.', format: (row) => formatMetric(row.priorClicks) },
        { label: 'Δ kliky', format: (row) => formatDelta(row.clicks, row.priorClicks) },
        { label: 'Zobrazení akt.', format: (row) => formatMetric(row.impressions) },
        { label: 'Zobrazení před.', format: (row) => formatMetric(row.priorImpressions) },
        { label: 'Δ zobrazení', format: (row) => formatDelta(row.impressions, row.priorImpressions) },
        { label: 'CTR', format: (row) => formatPct(row.ctr) },
        { label: 'Pozice', format: (row) => formatPosition(row.position) },
        { label: 'Akce', format: (row) => classifyAction(row, 'page') }
    ])}

## Zařízení

${table(devices, [
        { label: 'Zařízení', format: (row) => row.dimension },
        { label: 'Kliky akt.', format: (row) => formatMetric(row.clicks) },
        { label: 'Kliky před.', format: (row) => formatMetric(row.priorClicks) },
        { label: 'Δ kliky', format: (row) => formatDelta(row.clicks, row.priorClicks) },
        { label: 'Zobrazení akt.', format: (row) => formatMetric(row.impressions) },
        { label: 'Zobrazení před.', format: (row) => formatMetric(row.priorImpressions) },
        { label: 'Δ zobrazení', format: (row) => formatDelta(row.impressions, row.priorImpressions) },
        { label: 'CTR', format: (row) => formatPct(row.ctr) },
        { label: 'Pozice', format: (row) => formatPosition(row.position) }
    ])}

## Země

${table(countries.slice(0, 10), [
        { label: 'Země', format: (row) => row.dimension },
        { label: 'Kliky akt.', format: (row) => formatMetric(row.clicks) },
        { label: 'Kliky před.', format: (row) => formatMetric(row.priorClicks) },
        { label: 'Δ kliky', format: (row) => formatDelta(row.clicks, row.priorClicks) },
        { label: 'Zobrazení akt.', format: (row) => formatMetric(row.impressions) },
        { label: 'Zobrazení před.', format: (row) => formatMetric(row.priorImpressions) },
        { label: 'Δ zobrazení', format: (row) => formatDelta(row.impressions, row.priorImpressions) },
        { label: 'CTR', format: (row) => formatPct(row.ctr) },
        { label: 'Pozice', format: (row) => formatPosition(row.position) }
    ])}

## Kandidáti k ruční kontrole

Řádky výše jsou vybrané podle pozorovaných zobrazení a pozice. Nejde o předpověď růstu kliků ani o cílovou CTR.
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
        minImpressions: Number.isFinite(args.minImpressions) ? args.minImpressions : 50,
        currentRange: args.currentRange,
        priorRange: args.priorRange
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
