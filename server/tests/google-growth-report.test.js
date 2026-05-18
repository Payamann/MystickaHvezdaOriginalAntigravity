import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
    buildGoogleGrowthSummary,
    buildGscPerformanceSummary,
    classifyGrowthCluster,
    classifyGrowthPriority,
    readGscPerformanceZip,
} from '../../scripts/export-google-growth-data.mjs';

function buildStoredZip(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    Object.entries(entries).forEach(([name, text]) => {
        const nameBuffer = Buffer.from(name, 'utf8');
        const dataBuffer = Buffer.from(text, 'utf8');
        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0x0800, 6);
        localHeader.writeUInt16LE(0, 8);
        localHeader.writeUInt32LE(0, 10);
        localHeader.writeUInt32LE(0, 14);
        localHeader.writeUInt32LE(dataBuffer.length, 18);
        localHeader.writeUInt32LE(dataBuffer.length, 22);
        localHeader.writeUInt16LE(nameBuffer.length, 26);

        const centralHeader = Buffer.alloc(46);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0x0800, 8);
        centralHeader.writeUInt16LE(0, 10);
        centralHeader.writeUInt32LE(0, 12);
        centralHeader.writeUInt32LE(0, 16);
        centralHeader.writeUInt32LE(dataBuffer.length, 20);
        centralHeader.writeUInt32LE(dataBuffer.length, 24);
        centralHeader.writeUInt16LE(nameBuffer.length, 28);
        centralHeader.writeUInt32LE(offset, 42);

        localParts.push(localHeader, nameBuffer, dataBuffer);
        centralParts.push(centralHeader, nameBuffer);
        offset += localHeader.length + nameBuffer.length + dataBuffer.length;
    });

    const centralOffset = offset;
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(Object.keys(entries).length, 8);
    eocd.writeUInt16LE(Object.keys(entries).length, 10);
    eocd.writeUInt32LE(centralSize, 12);
    eocd.writeUInt32LE(centralOffset, 16);
    return Buffer.concat([...localParts, ...centralParts, eocd]);
}

describe('Google growth reporting', () => {
    it('segments SEO paths into growth clusters', () => {
        expect(classifyGrowthCluster('/tarot-zdarma.html')).toBe('tarot');
        expect(classifyGrowthCluster('/andelske-karty.html')).toBe('andelske-karty');
        expect(classifyGrowthCluster('/numerologie.html')).toBe('numerologie');
        expect(classifyGrowthCluster('/cenik.html')).toBe('pricing');
    });

    it('marks high-intent low-CTR query-page rows as P0', () => {
        expect(classifyGrowthPriority({
            path: '/tarot-zdarma.html',
            impressions: 500,
            ctr: 0.012,
            position: 12.4,
        })).toBe('P0');
    });

    it('builds top P0 and P1 opportunity lists', () => {
        const summary = buildGoogleGrowthSummary({
            range: { startDate: '2026-02-18', endDate: '2026-05-18', days: 90 },
            gscQueryPages: [
                {
                    query: 'tarot zdarma',
                    page: 'https://www.mystickahvezda.cz/tarot-zdarma.html',
                    path: '/tarot-zdarma.html',
                    clicks: 6,
                    impressions: 600,
                    ctr: 0.01,
                    position: 11.2,
                },
            ],
            gscPages: [
                {
                    page: 'https://www.mystickahvezda.cz/tarot-zdarma.html',
                    path: '/tarot-zdarma.html',
                    clicks: 6,
                    impressions: 600,
                    ctr: 0.01,
                    position: 11.2,
                },
            ],
            ga4LandingPages: [
                {
                    landingPagePlusQueryString: '/andelske-karty.html',
                    path: '/andelske-karty.html',
                    sessions: 25,
                    engagedSessions: 18,
                    conversions: 0,
                    totalRevenue: 0,
                    engagementRate: 72,
                    conversionRate: 0,
                },
            ],
        });

        expect(summary.growth.p0[0]).toMatchObject({
            query: 'tarot zdarma',
            cluster: 'tarot',
            priority: 'P0',
        });
        expect(summary.growth.p1[0]).toMatchObject({
            path: '/andelske-karty.html',
            cluster: 'andelske-karty',
            priority: 'P1',
        });
        expect(summary.growth.weeklyActions.length).toBeGreaterThanOrEqual(2);
    });

    it('parses Czech GSC performance ZIP exports', async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gsc-performance-'));
        const zipPath = path.join(tempDir, 'performance.zip');
        await fs.writeFile(zipPath, buildStoredZip({
            'Dotazy.csv': [
                'Nejčastější dotazy,Prokliky,Zobrazení,CTR,Pozice',
                'andělská karta dne,5,202,2.48%,8.18',
                'aries znamení,0,680,0%,9.05',
            ].join('\n'),
            'Stránky.csv': [
                'Nejvýznamnější stránky,Prokliky,Zobrazení,CTR,Pozice',
                'https://www.mystickahvezda.cz/horoskop/beran.html,1,891,0.11%,9.15',
            ].join('\n'),
            'Graf.csv': [
                'Datum,Prokliky,Zobrazení,CTR,Pozice',
                '2026-05-10,1,100,1%,10',
                '2026-05-11,2,200,1%,9',
            ].join('\n'),
            'Zařízení.csv': 'Zařízení,Prokliky,Zobrazení,CTR,Pozice\nMobilní,3,300,1%,9',
            'Země.csv': 'Země,Prokliky,Zobrazení,CTR,Pozice\nČesko,3,300,1%,9',
        }));

        const data = await readGscPerformanceZip(zipPath);
        const summary = buildGscPerformanceSummary(data);

        expect(summary.totals).toMatchObject({ clicks: 3, impressions: 300, ctr: 1, position: 9.33 });
        expect(summary.queries.opportunities[0]).toMatchObject({
            query: 'aries znamení',
            cluster: 'horoskopy/partnerska-shoda',
        });
        expect(summary.pages.opportunities[0]).toMatchObject({
            page: 'https://www.mystickahvezda.cz/horoskop/beran.html',
            cluster: 'horoskopy',
        });
    });
});
