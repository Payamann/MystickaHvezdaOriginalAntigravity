#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'server', '.env') });
dotenv.config({ path: path.join(rootDir, '.env') });

const DEFAULT_DAYS = 90;
const DEFAULT_LIMIT = 25000;
const DEFAULT_OUTPUT_DIR = path.join(rootDir, 'social-media-agent', 'output', 'google');
const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
];

function toDateString(date) {
    return date.toISOString().slice(0, 10);
}

export function resolveDateRange({ days = DEFAULT_DAYS, startDate = null, endDate = null } = {}) {
    const end = endDate ? new Date(`${endDate}T00:00:00Z`) : new Date();
    if (Number.isNaN(end.getTime())) throw new Error(`Invalid end date: ${endDate}`);

    const start = startDate
        ? new Date(`${startDate}T00:00:00Z`)
        : new Date(end.getTime() - (Number(days) - 1) * 24 * 60 * 60 * 1000);
    if (Number.isNaN(start.getTime())) throw new Error(`Invalid start date: ${startDate}`);
    if (start > end) throw new Error('Start date must be before or equal to end date.');

    return {
        startDate: toDateString(start),
        endDate: toDateString(end),
        days: Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1,
    };
}

export function parseArgs(argv) {
    const args = {
        days: DEFAULT_DAYS,
        startDate: null,
        endDate: null,
        limit: DEFAULT_LIMIT,
        outputDir: DEFAULT_OUTPUT_DIR,
        credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
        ga4PropertyId: process.env.GA4_PROPERTY_ID || '',
        gscSiteUrl: process.env.GSC_SITE_URL || '',
        gscQueryPagesCsv: '',
        gscPagesCsv: '',
        gscPerformanceZip: '',
        ga4LandingPagesCsv: '',
        ga4SourcesCsv: '',
        reportTop: 25,
        skipGa4: false,
        skipGsc: false,
        checkConfig: false,
        json: false,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--days') args.days = Number(argv[++i]);
        else if (arg === '--start-date') args.startDate = argv[++i];
        else if (arg === '--end-date') args.endDate = argv[++i];
        else if (arg === '--limit') args.limit = Number(argv[++i]);
        else if (arg === '--output-dir') args.outputDir = argv[++i];
        else if (arg === '--credentials') args.credentials = argv[++i];
        else if (arg === '--ga4-property-id') args.ga4PropertyId = argv[++i];
        else if (arg === '--gsc-site-url') args.gscSiteUrl = argv[++i];
        else if (arg === '--gsc-query-pages-csv') args.gscQueryPagesCsv = argv[++i];
        else if (arg === '--gsc-pages-csv') args.gscPagesCsv = argv[++i];
        else if (arg === '--gsc-performance-zip') args.gscPerformanceZip = argv[++i];
        else if (arg === '--ga4-landing-pages-csv') args.ga4LandingPagesCsv = argv[++i];
        else if (arg === '--ga4-sources-csv') args.ga4SourcesCsv = argv[++i];
        else if (arg === '--report-top') args.reportTop = Number(argv[++i]);
        else if (arg === '--skip-ga4') args.skipGa4 = true;
        else if (arg === '--skip-gsc') args.skipGsc = true;
        else if (arg === '--check-config') args.checkConfig = true;
        else if (arg === '--json') args.json = true;
        else if (arg === '--help' || arg === '-h') {
            console.log([
                'Usage: node scripts/export-google-growth-data.mjs [--days 90]',
                '       [--credentials C:\\path\\service-account.json]',
                '       [--ga4-property-id 123456789] [--gsc-site-url sc-domain:example.com]',
                '       [--output-dir social-media-agent/output/google]',
                '       [--gsc-query-pages-csv export.csv] [--gsc-pages-csv export.csv]',
                '       [--gsc-performance-zip C:\\path\\performance-export.zip]',
                '       [--ga4-landing-pages-csv export.csv] [--ga4-sources-csv export.csv]',
                '       [--skip-ga4] [--skip-gsc] [--check-config] [--json]',
                '',
                'Exports GA4 and Google Search Console data into normalized CSV + JSON + weekly SEO opportunity reports.',
            ].join('\n'));
            process.exit(0);
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    if (!Number.isFinite(args.days) || args.days < 1 || args.days > 540) {
        throw new Error('--days must be a number between 1 and 540.');
    }
    if (!Number.isFinite(args.limit) || args.limit < 1 || args.limit > 25000) {
        throw new Error('--limit must be a number between 1 and 25000.');
    }
    if (!Number.isFinite(args.reportTop) || args.reportTop < 1 || args.reportTop > 100) {
        throw new Error('--report-top must be a number between 1 and 100.');
    }
    args.outputDir = path.resolve(rootDir, args.outputDir);

    return args;
}

function configStatus(args) {
    const missing = [];
    const needsGscApi = !args.skipGsc && !args.gscPerformanceZip && (!args.gscQueryPagesCsv || !args.gscPagesCsv);
    const needsGa4Api = !args.skipGa4 && (!args.ga4LandingPagesCsv || !args.ga4SourcesCsv);
    if ((needsGscApi || needsGa4Api) && !args.credentials) missing.push('GOOGLE_APPLICATION_CREDENTIALS');
    if (needsGa4Api && !args.ga4PropertyId) missing.push('GA4_PROPERTY_ID');
    if (needsGscApi && !args.gscSiteUrl) missing.push('GSC_SITE_URL');

    return {
        ok: missing.length === 0,
        missing,
        hasCredentialsPath: Boolean(args.credentials),
        ga4Enabled: !args.skipGa4,
        gscEnabled: !args.skipGsc,
        needsGa4Api,
        needsGscApi,
        importedInputs: {
            gscQueryPagesCsv: args.gscQueryPagesCsv || null,
            gscPagesCsv: args.gscPagesCsv || null,
            gscPerformanceZip: args.gscPerformanceZip || null,
            ga4LandingPagesCsv: args.ga4LandingPagesCsv || null,
            ga4SourcesCsv: args.ga4SourcesCsv || null,
        },
        ga4PropertyId: args.ga4PropertyId || null,
        gscSiteUrl: args.gscSiteUrl || null,
    };
}

async function createGoogleAuth(credentials) {
    return new google.auth.GoogleAuth({
        keyFile: credentials,
        scopes: GOOGLE_SCOPES,
    });
}

function safeNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function safeImportedNumber(value) {
    const text = String(value ?? '')
        .trim()
        .replace(/\s/g, '')
        .replace(/%$/, '')
        .replace(',', '.');
    if (!text) return 0;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : 0;
}

function safeImportedCtr(value) {
    const text = String(value ?? '').trim();
    const parsed = safeImportedNumber(text);
    if (!parsed) return 0;
    return text.includes('%') || parsed > 1 ? parsed / 100 : parsed;
}

function normalizePath(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    try {
        const url = new URL(text);
        return `${url.pathname || '/'}${url.search || ''}`;
    } catch {
        return text.startsWith('/') ? text : `/${text}`;
    }
}

export function normalizeGscRows(rows = [], dimensions = []) {
    return rows.map((row) => {
        const keys = row.keys || [];
        const item = {
            clicks: safeNumber(row.clicks),
            impressions: safeNumber(row.impressions),
            ctr: safeNumber(row.ctr),
            position: safeNumber(row.position),
        };

        dimensions.forEach((dimension, index) => {
            item[dimension] = keys[index] || '';
        });
        if (item.page) item.path = normalizePath(item.page);
        return item;
    });
}

export function normalizeGa4Rows(rows = [], dimensions = [], metrics = []) {
    return rows.map((row) => {
        const item = {};
        dimensions.forEach((dimension, index) => {
            item[dimension] = row.dimensionValues?.[index]?.value || '';
        });
        metrics.forEach((metric, index) => {
            item[metric] = safeNumber(row.metricValues?.[index]?.value);
        });
        if (item.landingPagePlusQueryString || item.landingPage) {
            item.path = normalizePath(item.landingPagePlusQueryString || item.landingPage);
        }
        if (item.sessions) {
            item.engagementRate = Math.round(((item.engagedSessions || 0) / item.sessions) * 1000) / 10;
            item.conversionRate = Math.round(((item.conversions || 0) / item.sessions) * 1000) / 10;
        } else {
            item.engagementRate = 0;
            item.conversionRate = 0;
        }
        return item;
    });
}

function parseCsvText(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                cell += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push(cell);
            cell = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') i += 1;
            row.push(cell);
            if (row.some((value) => value.trim() !== '')) rows.push(row);
            row = [];
            cell = '';
        } else {
            cell += char;
        }
    }

    row.push(cell);
    if (row.some((value) => value.trim() !== '')) rows.push(row);
    return rows;
}

function normalizeHeader(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '');
}

function csvRowsToObjects(rows) {
    if (!rows.length) return [];
    const headers = rows[0].map(normalizeHeader);
    return rows.slice(1).map((row) => headers.reduce((item, header, index) => {
        item[header] = row[index] ?? '';
        return item;
    }, {}));
}

function firstCsvValue(row, names) {
    for (const name of names) {
        const key = normalizeHeader(name);
        if (row[key] != null && row[key] !== '') return row[key];
    }
    return '';
}

async function readCsvObjects(filePath) {
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);
    const text = await fs.readFile(resolvedPath, 'utf8');
    return csvRowsToObjects(parseCsvText(text.replace(/^\uFEFF/, '')));
}

async function readGscCsv(filePath, kind) {
    const rows = await readCsvObjects(filePath);
    return rows.map((row) => {
        const page = firstCsvValue(row, ['page', 'url', 'stranka', 'adresaurl', 'landingpage']);
        const query = kind === 'queryPage'
            ? firstCsvValue(row, ['query', 'dotaz', 'searchterm', 'vyhledavacidotaz'])
            : '';
        const pathValue = firstCsvValue(row, ['path', 'cesta']) || page;
        const item = {
            page,
            path: normalizePath(pathValue || page),
            clicks: safeImportedNumber(firstCsvValue(row, ['clicks', 'kliknuti', 'prokliky'])),
            impressions: safeImportedNumber(firstCsvValue(row, ['impressions', 'zobrazeni'])),
            ctr: safeImportedCtr(firstCsvValue(row, ['ctr', 'miraprokliku'])),
            position: safeImportedNumber(firstCsvValue(row, ['position', 'pozice', 'prumernapozice'])),
        };
        if (query) item.query = query;
        return item;
    });
}

async function readGa4Csv(filePath, kind) {
    const rows = await readCsvObjects(filePath);
    return rows.map((row) => {
        const pathValue = firstCsvValue(row, [
            'landingPagePlusQueryString',
            'landingPage',
            'landing page',
            'path',
            'cesta',
        ]);
        const sessions = safeImportedNumber(firstCsvValue(row, ['sessions', 'relace']));
        const engagedSessions = safeImportedNumber(firstCsvValue(row, ['engagedSessions', 'zapojenerelace']));
        const conversions = safeImportedNumber(firstCsvValue(row, ['conversions', 'konverze', 'keyEvents', 'klicoveudalosti']));
        const item = {
            sessions,
            engagedSessions,
            conversions,
            totalRevenue: safeImportedNumber(firstCsvValue(row, ['totalRevenue', 'revenue', 'trzby'])),
        };

        if (kind === 'source') {
            item.sessionSourceMedium = firstCsvValue(row, ['sessionSourceMedium', 'sourceMedium', 'zdrojmedium']);
            item.sessionCampaignName = firstCsvValue(row, ['sessionCampaignName', 'campaign', 'kampan']);
        } else {
            item.landingPagePlusQueryString = pathValue;
            item.path = normalizePath(pathValue);
        }

        item.engagementRate = sessions ? Math.round((engagedSessions / sessions) * 1000) / 10 : 0;
        item.conversionRate = sessions ? Math.round((conversions / sessions) * 1000) / 10 : 0;
        return item;
    });
}

function findZipEndOfCentralDirectory(buffer) {
    const minOffset = Math.max(0, buffer.length - 65557);
    for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
        if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
    }
    throw new Error('Invalid ZIP file: end of central directory not found.');
}

function decodeZipFileName(buffer, flags) {
    return buffer.toString((flags & 0x0800) ? 'utf8' : 'latin1');
}

async function readZipTextEntries(filePath) {
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);
    const buffer = await fs.readFile(resolvedPath);
    const eocdOffset = findZipEndOfCentralDirectory(buffer);
    const entryCount = buffer.readUInt16LE(eocdOffset + 10);
    const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
    const entries = new Map();
    let offset = centralDirectoryOffset;

    for (let i = 0; i < entryCount; i += 1) {
        if (buffer.readUInt32LE(offset) !== 0x02014b50) {
            throw new Error('Invalid ZIP file: central directory entry is malformed.');
        }

        const flags = buffer.readUInt16LE(offset + 8);
        const compressionMethod = buffer.readUInt16LE(offset + 10);
        const compressedSize = buffer.readUInt32LE(offset + 20);
        const fileNameLength = buffer.readUInt16LE(offset + 28);
        const extraLength = buffer.readUInt16LE(offset + 30);
        const commentLength = buffer.readUInt16LE(offset + 32);
        const localHeaderOffset = buffer.readUInt32LE(offset + 42);
        const fileName = decodeZipFileName(
            buffer.subarray(offset + 46, offset + 46 + fileNameLength),
            flags,
        );

        if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
            throw new Error(`Invalid ZIP file: local header missing for ${fileName}.`);
        }

        const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
        const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
        const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
        const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);
        let data;
        if (compressionMethod === 0) {
            data = compressedData;
        } else if (compressionMethod === 8) {
            data = zlib.inflateRawSync(compressedData);
        } else {
            throw new Error(`Unsupported ZIP compression method ${compressionMethod} for ${fileName}.`);
        }

        entries.set(fileName, data.toString('utf8').replace(/^\uFEFF/, ''));
        offset += 46 + fileNameLength + extraLength + commentLength;
    }

    return entries;
}

function normalizeEntryKey(value) {
    return path.basename(String(value || ''))
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '');
}

function getPerformanceFile(files, candidates) {
    const normalized = new Map([...files.entries()].map(([name, text]) => [normalizeEntryKey(name), text]));
    for (const candidate of candidates) {
        const text = normalized.get(normalizeEntryKey(candidate));
        if (text != null) return text;
    }
    return '';
}

function performanceRowsFromCsv(text) {
    if (!text) return [];
    return csvRowsToObjects(parseCsvText(text.replace(/^\uFEFF/, '')));
}

function normalizePerformanceMetricRows(rows, labelNames, outputKey) {
    return rows.map((row) => {
        const label = firstCsvValue(row, labelNames);
        const item = {
            [outputKey]: label,
            clicks: safeImportedNumber(firstCsvValue(row, ['Prokliky', 'Clicks'])),
            impressions: safeImportedNumber(firstCsvValue(row, ['Zobrazení', 'Impressions'])),
            ctr: safeImportedCtr(firstCsvValue(row, ['CTR'])),
            position: safeImportedNumber(firstCsvValue(row, ['Pozice', 'Position'])),
        };
        if (outputKey === 'page') item.path = normalizePath(label);
        return item;
    });
}

function classifyPerformanceQueryCluster(query = '') {
    const text = String(query).toLowerCase();
    if (/and[eě]l|andel/.test(text)) return 'andelske-karty';
    if (/tarot/.test(text)) return 'tarot';
    if (/numerolog|č[íi]slo|cislo|osud/.test(text)) return 'numerologie';
    if (/gula|koule|kryszta|kristal|krišt/.test(text)) return 'kristalova-koule';
    if (/natal|astromapa|astro|hv[eě]zdn[aá] mapa/.test(text)) return 'natalni/astro';
    if (/aries|beran|b[ýy]k|rak|lev|panna|vahy|váhy|st[řr]elec|kozoroh|vodn[áa][řr]|ryby|štír|stir|znamen/.test(text)) {
        return 'horoskopy/partnerska-shoda';
    }
    return 'other';
}

function scorePerformanceOpportunity(row) {
    const impressions = row.impressions || 0;
    const ctr = row.ctr || 0;
    const position = row.position || 0;
    if (impressions < 50 || position > 20 || ctr >= 0.035) return 0;
    const positionWeight = position <= 10 ? 2 : 1;
    return Math.round(impressions * positionWeight * (0.035 - ctr) * 10);
}

function groupTimelineByWeek(rows) {
    const weeks = [];
    const sortedRows = [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    for (let i = 0; i < sortedRows.length; i += 7) {
        const chunk = sortedRows.slice(i, i + 7);
        const clicks = chunk.reduce((sum, row) => sum + (row.clicks || 0), 0);
        const impressions = chunk.reduce((sum, row) => sum + (row.impressions || 0), 0);
        weeks.push({
            from: chunk[0]?.date || '',
            to: chunk[chunk.length - 1]?.date || '',
            clicks,
            impressions,
            ctr: impressions ? Math.round((clicks / impressions) * 1000) / 1000 : 0,
            position: impressions
                ? Math.round((chunk.reduce((sum, row) => sum + ((row.position || 0) * (row.impressions || 0)), 0) / impressions) * 100) / 100
                : 0,
        });
    }
    return weeks;
}

function aggregatePerformanceClusters(rows, key) {
    const clusters = new Map();
    rows.forEach((row) => {
        const cluster = key === 'query'
            ? classifyPerformanceQueryCluster(row.query)
            : classifyGrowthCluster(row.path || row.page);
        const current = clusters.get(cluster) || {
            cluster,
            rows: 0,
            clicks: 0,
            impressions: 0,
            weightedPosition: 0,
            opportunityScore: 0,
        };
        current.rows += 1;
        current.clicks += row.clicks || 0;
        current.impressions += row.impressions || 0;
        current.weightedPosition += (row.position || 0) * (row.impressions || 0);
        current.opportunityScore += row.opportunityScore || 0;
        clusters.set(cluster, current);
    });
    return [...clusters.values()]
        .map((row) => ({
            ...row,
            ctr: row.impressions ? Math.round((row.clicks / row.impressions) * 1000) / 10 : 0,
            position: row.impressions ? Math.round((row.weightedPosition / row.impressions) * 100) / 100 : 0,
        }))
        .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));
}

export function parseGscPerformanceFiles(files) {
    const getFile = (candidates) => (
        files instanceof Map ? getPerformanceFile(files, candidates) : getPerformanceFile(new Map(Object.entries(files)), candidates)
    );

    const queries = normalizePerformanceMetricRows(
        performanceRowsFromCsv(getFile(['Dotazy.csv'])),
        ['Nejčastější dotazy', 'Query'],
        'query',
    );
    const pages = normalizePerformanceMetricRows(
        performanceRowsFromCsv(getFile(['Stránky.csv', 'Stranky.csv'])),
        ['Nejvýznamnější stránky', 'Page'],
        'page',
    );
    const timeline = normalizePerformanceMetricRows(
        performanceRowsFromCsv(getFile(['Graf.csv'])),
        ['Datum', 'Date'],
        'date',
    );
    const devices = normalizePerformanceMetricRows(
        performanceRowsFromCsv(getFile(['Zařízení.csv', 'Zarizeni.csv'])),
        ['Zařízení', 'Device'],
        'device',
    );
    const countries = normalizePerformanceMetricRows(
        performanceRowsFromCsv(getFile(['Země.csv', 'Zeme.csv'])),
        ['Země', 'Country'],
        'country',
    );
    const appearances = normalizePerformanceMetricRows(
        performanceRowsFromCsv(getFile(['Vzhled ve vyhledávání.csv', 'Vzhled ve vyhledavani.csv'])),
        ['Vzhled ve vyhledávání', 'Search appearance'],
        'appearance',
    );

    return { queries, pages, timeline, devices, countries, appearances };
}

export async function readGscPerformanceZip(filePath) {
    return parseGscPerformanceFiles(await readZipTextEntries(filePath));
}

export function buildGscPerformanceSummary({
    queries = [],
    pages = [],
    timeline = [],
    devices = [],
    countries = [],
    appearances = [],
} = {}) {
    const pageRows = pages.map((row) => ({
        ...row,
        cluster: classifyGrowthCluster(row.path || row.page),
        opportunityScore: scorePerformanceOpportunity(row),
    }));
    const queryRows = queries.map((row) => ({
        ...row,
        cluster: classifyPerformanceQueryCluster(row.query),
        opportunityScore: scorePerformanceOpportunity(row),
    }));
    const timelineTotals = {
        clicks: timeline.reduce((sum, row) => sum + (row.clicks || 0), 0),
        impressions: timeline.reduce((sum, row) => sum + (row.impressions || 0), 0),
    };
    const pageTotals = {
        clicks: pages.reduce((sum, row) => sum + (row.clicks || 0), 0),
        impressions: pages.reduce((sum, row) => sum + (row.impressions || 0), 0),
    };
    const totals = timeline.length ? timelineTotals : pageTotals;
    const weightedPosition = (timeline.length ? timeline : pages)
        .reduce((sum, row) => sum + ((row.position || 0) * (row.impressions || 0)), 0);

    return {
        generatedAt: new Date().toISOString(),
        source: 'gsc-performance-zip',
        totals: {
            clicks: Math.round(totals.clicks),
            impressions: Math.round(totals.impressions),
            ctr: totals.impressions ? Math.round((totals.clicks / totals.impressions) * 1000) / 10 : 0,
            position: totals.impressions ? Math.round((weightedPosition / totals.impressions) * 100) / 100 : 0,
        },
        counts: {
            queries: queries.length,
            pages: pages.length,
            days: timeline.length,
            devices: devices.length,
            countries: countries.length,
            appearances: appearances.length,
        },
        trend: {
            weekly: groupTimelineByWeek(timeline),
        },
        queries: {
            top: sortByMetric(queryRows, 'clicks').slice(0, 25),
            opportunities: sortByMetric(queryRows.filter((row) => row.opportunityScore > 0), 'opportunityScore').slice(0, 25),
            clusters: aggregatePerformanceClusters(queryRows, 'query'),
        },
        pages: {
            top: sortByMetric(pageRows, 'clicks').slice(0, 25),
            opportunities: sortByMetric(pageRows.filter((row) => row.opportunityScore > 0), 'opportunityScore').slice(0, 25),
            zeroClickHighImpression: sortByMetric(
                pageRows.filter((row) => (row.clicks || 0) === 0 && (row.impressions || 0) >= 50),
                'impressions',
            ).slice(0, 25),
            clusters: aggregatePerformanceClusters(pageRows, 'page'),
        },
        devices: sortByMetric(devices, 'impressions'),
        countries: sortByMetric(countries, 'impressions').slice(0, 25),
        appearances: sortByMetric(appearances, 'impressions'),
    };
}

export function buildGscPerformanceMarkdown(summary) {
    const lines = [
        '# GSC Performance Summary',
        '',
        `Generated: ${summary.generatedAt}`,
        '',
        '## Baseline',
        '',
        `- Clicks: ${summary.totals.clicks}`,
        `- Impressions: ${summary.totals.impressions}`,
        `- CTR: ${summary.totals.ctr}%`,
        `- Average position: ${summary.totals.position}`,
        '',
        '## P0 Query Opportunities',
        '',
        '| Query | Cluster | Clicks | Impressions | CTR | Position | Score |',
        '|---|---|---:|---:|---:|---:|---:|',
        ...summary.queries.opportunities.slice(0, 15).map((row) => (
            `| ${markdownCell(row.query)} | ${markdownCell(row.cluster)} | ${row.clicks} | ${row.impressions} | ${((row.ctr || 0) * 100).toFixed(1)}% | ${(row.position || 0).toFixed(1)} | ${row.opportunityScore} |`
        )),
        '',
        '## P0 Page Opportunities',
        '',
        '| Page | Cluster | Clicks | Impressions | CTR | Position | Score |',
        '|---|---|---:|---:|---:|---:|---:|',
        ...summary.pages.opportunities.slice(0, 15).map((row) => (
            `| ${markdownCell(row.page)} | ${markdownCell(row.cluster)} | ${row.clicks} | ${row.impressions} | ${((row.ctr || 0) * 100).toFixed(1)}% | ${(row.position || 0).toFixed(1)} | ${row.opportunityScore} |`
        )),
        '',
        '## Weekly Trend',
        '',
        '| From | To | Clicks | Impressions | CTR | Position |',
        '|---|---|---:|---:|---:|---:|',
        ...summary.trend.weekly.map((row) => (
            `| ${row.from} | ${row.to} | ${row.clicks} | ${row.impressions} | ${(row.ctr * 100).toFixed(1)}% | ${row.position} |`
        )),
        '',
        '## Devices',
        '',
        '| Device | Clicks | Impressions | CTR | Position |',
        '|---|---:|---:|---:|---:|',
        ...summary.devices.map((row) => (
            `| ${markdownCell(row.device)} | ${row.clicks} | ${row.impressions} | ${((row.ctr || 0) * 100).toFixed(1)}% | ${(row.position || 0).toFixed(1)} |`
        )),
        '',
    ];
    return `${lines.join('\n')}\n`;
}

async function runGscQuery(searchconsole, siteUrl, { startDate, endDate, dimensions, limit }) {
    const allRows = [];
    let startRow = 0;
    const pageSize = Math.min(limit, 25000);

    while (allRows.length < limit) {
        const response = await searchconsole.searchanalytics.query({
            siteUrl,
            requestBody: {
                startDate,
                endDate,
                dimensions,
                rowLimit: Math.min(pageSize, limit - allRows.length),
                startRow,
            },
        });

        const rows = response.data.rows || [];
        allRows.push(...rows);
        if (rows.length < pageSize) break;
        startRow += rows.length;
    }

    return normalizeGscRows(allRows, dimensions);
}

async function runGa4Report(analyticsdata, propertyId, {
    startDate,
    endDate,
    dimensions,
    metrics,
    limit,
}) {
    const response = await analyticsdata.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
            dateRanges: [{ startDate, endDate }],
            dimensions: dimensions.map((name) => ({ name })),
            metrics: metrics.map((name) => ({ name })),
            limit,
            orderBys: [{ metric: { metricName: metrics[0] }, desc: true }],
        },
    });

    return normalizeGa4Rows(response.data.rows || [], dimensions, metrics);
}

async function runGa4ReportWithFallback(analyticsdata, propertyId, options) {
    try {
        return await runGa4Report(analyticsdata, propertyId, options);
    } catch (error) {
        const fallback = {
            ...options,
            dimensions: options.dimensions.map((dimension) => (
                dimension === 'landingPagePlusQueryString' ? 'landingPage' : dimension
            )),
            metrics: options.metrics.filter((metric) => metric !== 'conversions' && metric !== 'totalRevenue'),
        };
        if (
            fallback.dimensions.join('|') === options.dimensions.join('|')
            && fallback.metrics.join('|') === options.metrics.join('|')
        ) {
            throw error;
        }
        return runGa4Report(analyticsdata, propertyId, fallback);
    }
}

function sortByMetric(rows, metric) {
    return [...rows].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
}

function buildCtrOpportunity(row) {
    const impressions = row.impressions || 0;
    const ctrPercent = (row.ctr || 0) * 100;
    const position = row.position || 0;
    if (impressions < 50 || position > 20 || ctrPercent >= 3.5) return 0;
    const positionWeight = position <= 10 ? 2 : 1;
    return Math.round((impressions * positionWeight * (3.5 - ctrPercent)) / 10);
}

export function classifyGrowthCluster(value = '') {
    const pathValue = normalizePath(value).toLowerCase();
    if (/cenik|checkout|premium|registrace|prihlaseni/.test(pathValue)) return 'pricing';
    if (/partnerska-shoda|kompatibilita/.test(pathValue)) return 'partnerska-shoda';
    if (/kristalova|kristal|koule/.test(pathValue)) return 'kristalova-koule';
    if (/andelsk|andel/.test(pathValue)) return 'andelske-karty';
    if (/tarot/.test(pathValue)) return 'tarot';
    if (/horoskop|horoskopy/.test(pathValue)) return 'horoskopy';
    if (/numerolog|cisla-osudu|osobni-rok|zivotni-cislo|partnerska-numerologie/.test(pathValue)) return 'numerologie';
    if (/runy|runa/.test(pathValue)) return 'runy';
    if (/natalni|astro|lunace|osobni-mapa|biorytm|cinsky-horoskop|shamansko|mentor/.test(pathValue)) return 'natalni/astro';
    if (/jak-to-funguje|kontakt|faq|o-nas|slovnik|blog|soukromi|podminky/.test(pathValue)) return 'trust/content';
    return 'other';
}

function hasConversionFit(row) {
    const cluster = row.cluster || classifyGrowthCluster(row.path || row.page || row.landingPagePlusQueryString || '');
    return [
        'tarot',
        'horoskopy',
        'numerologie',
        'andelske-karty',
        'runy',
        'natalni/astro',
        'pricing',
        'partnerska-shoda',
        'kristalova-koule',
    ].includes(cluster);
}

export function classifyGrowthPriority(row) {
    const impressions = row.impressions || 0;
    const ctr = row.ctr || 0;
    const position = row.position || 0;
    const sessions = row.sessions || 0;
    const conversions = row.conversions || 0;

    if (
        position >= 8
        && position <= 20
        && impressions >= 50
        && ctr < 0.035
        && hasConversionFit(row)
    ) {
        return 'P0';
    }
    if (sessions >= 10 && conversions === 0) return 'P1';
    if (hasConversionFit(row) && (impressions >= 20 || sessions >= 5)) return 'P2';
    return 'Monitor';
}

function enrichGrowthRow(row, ga4ByPath = new Map()) {
    const pathValue = row.path || normalizePath(row.page || row.landingPagePlusQueryString || row.landingPage || '');
    const ga4 = pathValue ? ga4ByPath.get(pathValue) || {} : {};
    const enriched = {
        ...row,
        path: pathValue,
        sessions: row.sessions ?? ga4.sessions ?? 0,
        engagedSessions: row.engagedSessions ?? ga4.engagedSessions ?? 0,
        conversions: row.conversions ?? ga4.conversions ?? 0,
        totalRevenue: row.totalRevenue ?? ga4.totalRevenue ?? 0,
        engagementRate: row.engagementRate ?? ga4.engagementRate ?? 0,
        conversionRate: row.conversionRate ?? ga4.conversionRate ?? 0,
        opportunityScore: row.opportunityScore ?? buildCtrOpportunity(row),
    };
    enriched.cluster = row.cluster || classifyGrowthCluster(pathValue);
    enriched.priority = row.priority || classifyGrowthPriority(enriched);
    return enriched;
}

function aggregateClusters(rows) {
    const clusters = new Map();
    rows.forEach((row) => {
        const cluster = row.cluster || classifyGrowthCluster(row.path || row.page || '');
        const current = clusters.get(cluster) || {
            cluster,
            rows: 0,
            clicks: 0,
            impressions: 0,
            sessions: 0,
            conversions: 0,
            revenue: 0,
            opportunityScore: 0,
            p0Count: 0,
            p1Count: 0,
        };
        current.rows += 1;
        current.clicks += row.clicks || 0;
        current.impressions += row.impressions || 0;
        current.sessions += row.sessions || 0;
        current.conversions += row.conversions || 0;
        current.revenue += row.totalRevenue || 0;
        current.opportunityScore += row.opportunityScore || 0;
        if (row.priority === 'P0') current.p0Count += 1;
        if (row.priority === 'P1') current.p1Count += 1;
        clusters.set(cluster, current);
    });

    return [...clusters.values()]
        .map((row) => ({
            ...row,
            clicks: Math.round(row.clicks),
            impressions: Math.round(row.impressions),
            sessions: Math.round(row.sessions),
            conversions: Math.round(row.conversions),
            revenue: Math.round(row.revenue * 100) / 100,
            ctr: row.impressions ? Math.round((row.clicks / row.impressions) * 1000) / 10 : 0,
            conversionRate: row.sessions ? Math.round((row.conversions / row.sessions) * 1000) / 10 : 0,
        }))
        .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));
}

function buildWeeklyActions({ p0QueryPageOpportunities, p1LandingPagesNoConversion, p2ClusterCandidates }) {
    const actions = [];
    p0QueryPageOpportunities.slice(0, 5).forEach((row) => {
        actions.push({
            priority: 'P0',
            cluster: row.cluster,
            target: row.path,
            query: row.query || '',
            action: 'Rewrite title/meta/H1 promise, add visible answer block, and route CTA to the live tool with source/feature.',
            reason: `${Math.round(row.impressions)} impressions, ${(row.ctr * 100).toFixed(1)}% CTR, position ${row.position.toFixed(1)}`,
        });
    });
    p1LandingPagesNoConversion.slice(0, 5).forEach((row) => {
        actions.push({
            priority: 'P1',
            cluster: row.cluster,
            target: row.path,
            query: '',
            action: 'Audit first-value UX and CTA routing because organic sessions are not producing conversions.',
            reason: `${Math.round(row.sessions)} sessions, ${Math.round(row.conversions)} conversions`,
        });
    });
    p2ClusterCandidates.slice(0, 5).forEach((row) => {
        actions.push({
            priority: 'P2',
            cluster: row.cluster,
            target: row.path,
            query: row.query || '',
            action: 'Use as a cluster expansion candidate only if it can link to a relevant tool and monetization step.',
            reason: `${Math.round(row.impressions || row.sessions || 0)} demand signal`,
        });
    });
    return actions;
}

export function buildGoogleGrowthSummary({
    gscQueryPages = [],
    gscPages = [],
    ga4LandingPages = [],
    ga4Sources = [],
    range,
    topCount = 25,
}) {
    const ga4ByPath = new Map(ga4LandingPages.map((row) => [row.path, row]));
    const pageOpportunities = sortByMetric(
        gscPages.map((row) => enrichGrowthRow(row, ga4ByPath)),
        'opportunityScore',
    ).filter((row) => row.opportunityScore > 0);

    const queryOpportunities = sortByMetric(
        gscQueryPages.map((row) => enrichGrowthRow(row)),
        'opportunityScore',
    ).filter((row) => row.opportunityScore > 0);
    const landingPages = ga4LandingPages.map((row) => enrichGrowthRow(row));
    const p0QueryPageOpportunities = queryOpportunities.filter((row) => row.priority === 'P0');
    const p1LandingPagesNoConversion = sortByMetric(
        landingPages.filter((row) => row.priority === 'P1'),
        'sessions',
    );
    const p2ClusterCandidates = queryOpportunities.filter((row) => row.priority === 'P2');
    const clusterSummaries = aggregateClusters([
        ...pageOpportunities,
        ...p1LandingPagesNoConversion,
        ...p2ClusterCandidates,
    ]);
    const weeklyActions = buildWeeklyActions({
        p0QueryPageOpportunities,
        p1LandingPagesNoConversion,
        p2ClusterCandidates,
    });

    return {
        generatedAt: new Date().toISOString(),
        range,
        gsc: {
            queryPageRows: gscQueryPages.length,
            pageRows: gscPages.length,
            totalClicks: Math.round(gscPages.reduce((sum, row) => sum + (row.clicks || 0), 0)),
            totalImpressions: Math.round(gscPages.reduce((sum, row) => sum + (row.impressions || 0), 0)),
            topPages: sortByMetric(gscPages, 'clicks').slice(0, 20),
            topQueries: sortByMetric(gscQueryPages, 'clicks').slice(0, 20),
            ctrOpportunities: pageOpportunities.slice(0, topCount),
            queryOpportunities: queryOpportunities.slice(0, topCount),
            p0QueryPageOpportunities: p0QueryPageOpportunities.slice(0, topCount),
        },
        ga4: {
            landingPageRows: ga4LandingPages.length,
            sourceRows: ga4Sources.length,
            sessions: Math.round(ga4LandingPages.reduce((sum, row) => sum + (row.sessions || 0), 0)),
            conversions: Math.round(ga4LandingPages.reduce((sum, row) => sum + (row.conversions || 0), 0)),
            revenue: Math.round(ga4LandingPages.reduce((sum, row) => sum + (row.totalRevenue || 0), 0) * 100) / 100,
            topLandingPages: sortByMetric(ga4LandingPages, 'sessions').slice(0, 20),
            topSources: sortByMetric(ga4Sources, 'sessions').slice(0, 20),
            landingPagesWithTrafficNoConversion: sortByMetric(
                ga4LandingPages.filter((row) => (row.sessions || 0) >= 10 && (row.conversions || 0) === 0),
                'sessions',
            ).slice(0, topCount),
            p1LandingPagesNoConversion: p1LandingPagesNoConversion.slice(0, topCount),
        },
        growth: {
            clusters: clusterSummaries,
            p0: p0QueryPageOpportunities.slice(0, topCount),
            p1: p1LandingPagesNoConversion.slice(0, topCount),
            p2: p2ClusterCandidates.slice(0, topCount),
            weeklyActions,
        },
    };
}

function markdownCell(value) {
    return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function buildWeeklyMarkdownReport(summary) {
    const lines = [
        '# Google Growth Weekly Report',
        '',
        `Generated: ${summary.generatedAt}`,
        `Range: ${summary.range.startDate} to ${summary.range.endDate} (${summary.range.days} days)`,
        '',
        '## Baseline',
        '',
        `- GSC: ${summary.gsc.totalClicks} clicks, ${summary.gsc.totalImpressions} impressions`,
        `- GA4: ${summary.ga4.sessions} sessions, ${summary.ga4.conversions} conversions`,
        '',
        '## Cluster Opportunities',
        '',
        '| Cluster | Opportunity | P0 | P1 | Clicks | Impressions | CTR | Sessions | Conversions |',
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
        ...summary.growth.clusters.slice(0, 10).map((row) => (
            `| ${markdownCell(row.cluster)} | ${row.opportunityScore} | ${row.p0Count} | ${row.p1Count} | ${row.clicks} | ${row.impressions} | ${row.ctr}% | ${row.sessions} | ${row.conversions} |`
        )),
        '',
        '## P0 Query-Page Opportunities',
        '',
        '| Query | Page | Cluster | Clicks | Impressions | CTR | Position | Score |',
        '|---|---|---|---:|---:|---:|---:|---:|',
        ...summary.growth.p0.slice(0, 25).map((row) => (
            `| ${markdownCell(row.query)} | ${markdownCell(row.path)} | ${markdownCell(row.cluster)} | ${Math.round(row.clicks || 0)} | ${Math.round(row.impressions || 0)} | ${((row.ctr || 0) * 100).toFixed(1)}% | ${(row.position || 0).toFixed(1)} | ${row.opportunityScore || 0} |`
        )),
        '',
        '## P1 Traffic Without Conversion',
        '',
        '| Page | Cluster | Sessions | Conversions | Conversion Rate |',
        '|---|---|---:|---:|---:|',
        ...summary.growth.p1.slice(0, 25).map((row) => (
            `| ${markdownCell(row.path)} | ${markdownCell(row.cluster)} | ${Math.round(row.sessions || 0)} | ${Math.round(row.conversions || 0)} | ${row.conversionRate || 0}% |`
        )),
        '',
        '## Next Actions',
        '',
        ...summary.growth.weeklyActions.map((row) => (
            `- **${row.priority} ${row.cluster}** ${row.target}${row.query ? ` (${row.query})` : ''}: ${row.action} Reason: ${row.reason}.`
        )),
        '',
    ];
    return `${lines.join('\n')}\n`;
}

function csvCell(value) {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

async function writeCsv(filePath, rows, columns) {
    const csv = [columns, ...rows.map((row) => columns.map((column) => row[column] ?? ''))]
        .map((row) => row.map(csvCell).join(','))
        .join('\n');
    await fs.writeFile(filePath, `${csv}\n`, 'utf8');
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const range = resolveDateRange(args);
    const status = configStatus(args);

    if (args.checkConfig) {
        const output = { ...status, range };
        console.log(args.json ? JSON.stringify(output, null, 2) : `Google config ${status.ok ? 'OK' : `missing: ${status.missing.join(', ')}`}`);
        process.exit(status.ok ? 0 : 1);
    }

    if (!status.ok) {
        throw new Error(`Missing Google config: ${status.missing.join(', ')}`);
    }

    const outputDir = args.outputDir;
    await fs.mkdir(outputDir, { recursive: true });

    let gscQueryPages = [];
    let gscPages = [];
    let ga4LandingPages = [];
    let ga4Sources = [];
    let gscPerformance = null;
    let gscPerformanceSummary = null;
    let authClient = null;

    if (status.needsGscApi || status.needsGa4Api) {
        const auth = await createGoogleAuth(args.credentials);
        authClient = await auth.getClient();
    }

    if (!args.skipGsc) {
        if (args.gscPerformanceZip) {
            gscPerformance = await readGscPerformanceZip(args.gscPerformanceZip);
            gscPerformanceSummary = buildGscPerformanceSummary(gscPerformance);
            gscQueryPages = gscPerformance.queries;
            gscPages = gscPerformance.pages;
        }
        if (!args.gscPerformanceZip && args.gscQueryPagesCsv) {
            gscQueryPages = await readGscCsv(args.gscQueryPagesCsv, 'queryPage');
        }
        if (!args.gscPerformanceZip && args.gscPagesCsv) {
            gscPages = await readGscCsv(args.gscPagesCsv, 'page');
        }
        if (!args.gscPerformanceZip && (!args.gscQueryPagesCsv || !args.gscPagesCsv)) {
            const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
            if (!args.gscQueryPagesCsv) {
                gscQueryPages = await runGscQuery(searchconsole, args.gscSiteUrl, {
                    ...range,
                    dimensions: ['query', 'page'],
                    limit: args.limit,
                });
            }
            if (!args.gscPagesCsv) {
                gscPages = await runGscQuery(searchconsole, args.gscSiteUrl, {
                    ...range,
                    dimensions: ['page'],
                    limit: args.limit,
                });
            }
        }
    }

    if (!args.skipGa4) {
        if (args.ga4LandingPagesCsv) {
            ga4LandingPages = await readGa4Csv(args.ga4LandingPagesCsv, 'landingPage');
        }
        if (args.ga4SourcesCsv) {
            ga4Sources = await readGa4Csv(args.ga4SourcesCsv, 'source');
        }
        if (!args.ga4LandingPagesCsv || !args.ga4SourcesCsv) {
            const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: authClient });
            if (!args.ga4LandingPagesCsv) {
                ga4LandingPages = await runGa4ReportWithFallback(analyticsdata, args.ga4PropertyId, {
                    ...range,
                    dimensions: ['landingPagePlusQueryString'],
                    metrics: ['sessions', 'engagedSessions', 'conversions', 'totalRevenue'],
                    limit: args.limit,
                });
            }
            if (!args.ga4SourcesCsv) {
                ga4Sources = await runGa4ReportWithFallback(analyticsdata, args.ga4PropertyId, {
                    ...range,
                    dimensions: ['sessionSourceMedium', 'sessionCampaignName'],
                    metrics: ['sessions', 'engagedSessions', 'conversions', 'totalRevenue'],
                    limit: args.limit,
                });
            }
        }
    }

    const summary = buildGoogleGrowthSummary({
        gscQueryPages,
        gscPages,
        ga4LandingPages,
        ga4Sources,
        range,
        topCount: args.reportTop,
    });

    const daysSuffix = `${range.days}d`;
    const summaryPath = path.join(outputDir, `google-growth-${daysSuffix}.json`);
    const reportPath = path.join(outputDir, `google-growth-${daysSuffix}.md`);
    const latestReportPath = path.join(outputDir, 'google-growth-weekly-report.md');
    await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    await fs.writeFile(path.join(outputDir, 'google-growth-latest.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    await fs.writeFile(reportPath, buildWeeklyMarkdownReport(summary), 'utf8');
    await fs.writeFile(latestReportPath, buildWeeklyMarkdownReport(summary), 'utf8');
    if (gscPerformanceSummary) {
        await fs.writeFile(
            path.join(outputDir, 'gsc-performance-summary.json'),
            `${JSON.stringify(gscPerformanceSummary, null, 2)}\n`,
            'utf8',
        );
        await fs.writeFile(
            path.join(outputDir, 'gsc-performance-summary.md'),
            buildGscPerformanceMarkdown(gscPerformanceSummary),
            'utf8',
        );
    }

    await writeCsv(path.join(outputDir, `gsc-query-pages-${daysSuffix}.csv`), gscQueryPages, ['query', 'page', 'path', 'clicks', 'impressions', 'ctr', 'position']);
    await writeCsv(path.join(outputDir, `gsc-pages-${daysSuffix}.csv`), gscPages, ['page', 'path', 'clicks', 'impressions', 'ctr', 'position']);
    await writeCsv(path.join(outputDir, `ga4-landing-pages-${daysSuffix}.csv`), ga4LandingPages, ['landingPagePlusQueryString', 'landingPage', 'path', 'sessions', 'engagedSessions', 'engagementRate', 'conversions', 'conversionRate', 'totalRevenue']);
    await writeCsv(path.join(outputDir, `ga4-sources-${daysSuffix}.csv`), ga4Sources, ['sessionSourceMedium', 'sessionCampaignName', 'sessions', 'engagedSessions', 'engagementRate', 'conversions', 'conversionRate', 'totalRevenue']);
    await writeCsv(path.join(outputDir, `growth-clusters-${daysSuffix}.csv`), summary.growth.clusters, ['cluster', 'opportunityScore', 'p0Count', 'p1Count', 'clicks', 'impressions', 'ctr', 'sessions', 'conversions', 'conversionRate', 'revenue']);
    await writeCsv(path.join(outputDir, `growth-p0-query-pages-${daysSuffix}.csv`), summary.growth.p0, ['priority', 'cluster', 'query', 'page', 'path', 'clicks', 'impressions', 'ctr', 'position', 'sessions', 'conversions', 'opportunityScore']);
    await writeCsv(path.join(outputDir, `growth-p1-landing-pages-${daysSuffix}.csv`), summary.growth.p1, ['priority', 'cluster', 'path', 'sessions', 'engagedSessions', 'engagementRate', 'conversions', 'conversionRate', 'totalRevenue']);

    if (args.json) {
        console.log(JSON.stringify({ summaryPath, reportPath, summary }, null, 2));
        return;
    }

    console.log(`Google growth data exported: ${summaryPath}`);
    console.log(`Weekly growth report exported: ${latestReportPath}`);
    if (gscPerformanceSummary) {
        console.log(`GSC performance summary exported: ${path.join(outputDir, 'gsc-performance-summary.md')}`);
    }
    console.log(`GSC: ${summary.gsc.pageRows} pages, ${summary.gsc.queryPageRows} query-page rows, ${summary.gsc.totalClicks} clicks, ${summary.gsc.totalImpressions} impressions`);
    console.log(`GA4: ${summary.ga4.landingPageRows} landing pages, ${summary.ga4.sourceRows} sources, ${summary.ga4.sessions} sessions, ${summary.ga4.conversions} conversions`);
    if (summary.growth.p0[0]) {
        const row = summary.growth.p0[0];
        console.log(`Top P0 SEO opportunity: ${row.path} / "${row.query}" (${row.impressions} impressions, ${(row.ctr * 100).toFixed(1)}% CTR, position ${row.position.toFixed(1)})`);
    } else if (summary.gsc.ctrOpportunities[0]) {
        const row = summary.gsc.ctrOpportunities[0];
        console.log(`Top SEO opportunity: ${row.path} (${row.impressions} impressions, ${(row.ctr * 100).toFixed(1)}% CTR, position ${row.position.toFixed(1)})`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(`export-google-growth-data failed: ${error?.message || error}`);
        process.exit(1);
    });
}
