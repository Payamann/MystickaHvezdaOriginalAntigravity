#!/usr/bin/env node
/**
 * Local editorial QA for the 29 Sep–5 Oct 2026 pilot. Never touches the DB.
 * Run after all three draft parts exist; pass --write to save a merged draft.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dates = ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'];
const signs = ['Beran', 'Býk', 'Blíženci', 'Rak', 'Lev', 'Panna', 'Váhy', 'Štír', 'Střelec', 'Kozoroh', 'Vodnář', 'Ryby'];
const areaNumbers = [7, 6, 5, 4, 3, 2, 1, 12, 11, 10, 9, 8];
const areaLabels = ['dohoda a vztahy', 'rytmus práce a denní návyky', 'tvorba a radost', 'domov a zázemí', 'rozhovor a sdělení', 'zdroje a hodnoty', 'vlastní směr', 'odpočinek a uzavírání', 'přátelé a spolupráce', 'práce a odpovědnost', 'učení a širší souvislosti', 'sdílené závazky a hranice'];
const isRewrite = process.argv.includes('--v2');
const parts = isRewrite
    ? ['horoscope-pilot-rewrite-half-a.json', 'horoscope-pilot-rewrite-half-b.json']
    : ['horoscope-pilot-week-part-0.json', 'horoscope-pilot-week-part-a.json', 'horoscope-pilot-week-part-b.json'];
const version = isRewrite ? 'pilot-v2' : 'pilot-v1';
const output = path.join(root, 'docs', isRewrite
    ? 'horoscope-pilot-week-2026-09-29_2026-10-05-v2.json'
    : 'horoscope-pilot-week-2026-09-29_2026-10-05.json');

function tokens(value) {
    return new Set(String(value).toLocaleLowerCase('cs-CZ')
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .match(/\p{L}{4,}/gu) || []);
}

function overlap(a, b) {
    const x = tokens(a);
    const y = tokens(b);
    const intersection = [...x].filter(word => y.has(word)).length;
    return intersection / Math.max(1, x.size + y.size - intersection);
}

const errors = [];
const warnings = [];
const items = [];

for (const part of parts) {
    const partPath = path.join(root, 'docs', part);
    if (!fs.existsSync(partPath)) {
        errors.push(`Chybí soubor ${part}`);
        continue;
    }
    let draft;
    try {
        draft = JSON.parse(fs.readFileSync(partPath, 'utf8'));
    } catch (error) {
        errors.push(`Neplatný JSON ${part}: ${error.message}`);
        continue;
    }
    if (draft.version !== version || !Array.isArray(draft.items)) {
        errors.push(`Neplatný formát ${part}`);
        continue;
    }
    items.push(...draft.items);
}

const indexed = new Map();
for (const item of items) {
    const { date, sign, area, prediction } = item;
    const signIndex = signs.indexOf(sign);
    const key = `${date}:${sign}`;
    if (!dates.includes(date) || signIndex < 0) errors.push(`Neznámé datum nebo znamení: ${key}`);
    if (indexed.has(key)) errors.push(`Duplicitní záznam: ${key}`);
    indexed.set(key, item);
    if (signIndex >= 0 && Number.parseInt(String(area), 10) !== areaNumbers[signIndex]) {
        errors.push(`Nesprávná solární oblast: ${key} (${area})`);
    }
    if (typeof prediction !== 'string' || prediction.length < 100 || prediction.length > 520) {
        errors.push(`Nevhodná délka textu: ${key}`);
        continue;
    }
    if (/[<>]/.test(prediction)) errors.push(`HTML znak v textu: ${key}`);
    // JS \b is ASCII-centric and mistakes Czech letters inside words for boundaries.
    if (/(^|[^\p{L}])(vy|vás|vám|váš|vaše|jste|buďte)(?=$|[^\p{L}])/iu.test(prediction)) warnings.push(`Možné vykání: ${key}`);
    if (/(^|[^\p{L}])(určitě se ti|čeká tě|měsíc ti způsobí|planeta ti způsobí)(?=$|[^\p{L}])/iu.test(prediction)) {
        errors.push(`Jistá nebo nepodložená předpověď: ${key}`);
    }
    const sentenceCount = (prediction.match(/[.!?](?=\s|$)/g) || []).length;
    if (sentenceCount < 2 || sentenceCount > 4) warnings.push(`Počet vět ${sentenceCount}: ${key}`);
}

for (const date of dates) {
    for (const sign of signs) {
        if (!indexed.has(`${date}:${sign}`)) errors.push(`Chybí záznam: ${date}:${sign}`);
    }
}
if (items.length !== dates.length * signs.length) errors.push(`Očekáváno 84 záznamů, nalezeno ${items.length}`);

for (const sign of signs) {
    const signItems = dates.map(date => indexed.get(`${date}:${sign}`)).filter(Boolean);
    for (let i = 0; i < signItems.length; i += 1) {
        for (let j = i + 1; j < signItems.length; j += 1) {
            const similarity = overlap(signItems[i].prediction, signItems[j].prediction);
            if (similarity > 0.55) warnings.push(`Podobné texty ${sign}: ${signItems[i].date} / ${signItems[j].date} (${similarity.toFixed(2)})`);
        }
    }
}

console.log(`Pilot: ${items.length}/84 záznamů, chyb ${errors.length}, upozornění ${warnings.length}`);
for (const message of errors) console.error(`CHYBA: ${message}`);
for (const message of warnings) console.warn(`POZOR: ${message}`);

if (errors.length) {
    process.exitCode = 1;
} else if (process.argv.includes('--write')) {
    items.sort((a, b) => dates.indexOf(a.date) - dates.indexOf(b.date) || signs.indexOf(a.sign) - signs.indexOf(b.sign));
    const normalizedItems = items.map(item => {
        const index = signs.indexOf(item.sign);
        return { ...item, area: `${areaNumbers[index]} — ${areaLabels[index]}` };
    });
    fs.writeFileSync(output, JSON.stringify({
        version,
        status: 'draft',
        source: 'docs/horoscope-pilot-week-input-2026-09-29.md',
        items: normalizedItems
    }, null, 2) + '\n', 'utf8');
    console.log(`Uložen lokální návrh: ${output}`);
}
