#!/usr/bin/env node
/** Assemble and audit the October 2026 editorial draft. No production writes. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
const dates = Array.from({ length: 26 }, (_, i) => `2026-10-${String(i + 6).padStart(2, '0')}`);
const signs = ['Beran', 'Býk', 'Blíženci', 'Rak', 'Lev', 'Panna', 'Váhy', 'Štír', 'Střelec', 'Kozoroh', 'Vodnář', 'Ryby'];
const libraAreas = ['7 — dohody a vztahy', '6 — rytmus práce a návyky', '5 — tvorba a radost', '4 — domov a zázemí', '3 — rozhovor a sdělení', '2 — zdroje a hodnoty', '1 — vlastní směr', '12 — odpočinek a uzavírání', '11 — přátelé a spolupráce', '10 — práce a odpovědnost', '9 — učení a širší souvislosti', '8 — sdílené závazky a hranice'];
const scorpioAreas = ['8 — sdílené závazky a důvěra', '7 — dohody a vztahy', '6 — rytmus práce a návyky', '5 — tvorba a radost', '4 — domov a zázemí', '3 — rozhovor a sdělení', '2 — zdroje a hodnoty', '1 — vlastní směr', '12 — odpočinek a uzavírání', '11 — přátelé a spolupráce', '10 — práce a odpovědnost', '9 — učení a širší souvislosti'];
const errors = [];
const warnings = [];
const items = [];

for (const [part, expectedSigns] of [
    ['horoscope-october-2026-half-a.json', signs.slice(0, 6)],
    ['horoscope-october-2026-half-b.json', signs.slice(6)]
]) {
    const file = path.join(docs, part);
    if (!fs.existsSync(file)) { errors.push(`Chybí ${part}`); continue; }
    let batch;
    try { batch = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (error) { errors.push(`Neplatný JSON ${part}: ${error.message}`); continue; }
    if (batch.version !== 'october-2026-v1' || batch.status !== 'draft' || batch.source !== 'docs/horoscope-october-2026-brief.md' || !Array.isArray(batch.items)) {
        errors.push(`Neplatná metadata ${part}`);
        continue;
    }
    if (batch.items.length !== 156) errors.push(`${part}: očekáváno 156 textů, nalezeno ${batch.items.length}`);
    for (const item of batch.items) {
        if (!expectedSigns.includes(item.sign)) errors.push(`${part}: nepatřičné znamení ${item.sign}`);
        items.push(item);
    }
}

const seen = new Set();
for (const item of items) {
    const { date, sign, area, prediction } = item;
    const key = `${date}:${sign}`;
    const signIndex = signs.indexOf(sign);
    if (!dates.includes(date) || signIndex < 0) errors.push(`Neplatné datum nebo znamení ${key}`);
    if (seen.has(key)) errors.push(`Duplicita ${key}`);
    seen.add(key);
    if (signIndex >= 0 && dates.includes(date)) {
        const expectedArea = date < '2026-10-23' ? libraAreas[signIndex] : date === '2026-10-23' ? null : scorpioAreas[signIndex];
        if (expectedArea ? area !== expectedArea : !String(area).startsWith('přechod — ')) errors.push(`Nesprávná oblast ${key}: ${area}`);
    }
    if (typeof prediction !== 'string' || prediction.length < 100 || prediction.length > 400) { errors.push(`Délka ${key}: ${prediction?.length}`); continue; }
    if (/[<>]/u.test(prediction)) errors.push(`HTML znak ${key}`);
    if (/(^|[^\p{L}])(určitě se ti|čeká tě|osud ti|měsíc ti způsobí|planeta ti způsobí)(?=$|[^\p{L}])/iu.test(prediction)) errors.push(`Jistá nebo nepodložená předpověď ${key}`);
    if (/(^|[^\p{L}])(jste|vás|vám|váš|vaše)(?=$|[^\p{L}])/iu.test(prediction)) warnings.push(`Možné vykání ${key}`);
    if (/(^|[^\p{L}])(byl jsi|udělal jsi|všiml sis|mohl bys|sám|máš rád|můžeš mít rád|bys byl)(?=$|[^\p{L}])/iu.test(prediction)) warnings.push(`Možný mužský rod ${key}`);
    const sentences = (prediction.match(/[.!?](?=\s|$)/gu) || []).length;
    if (sentences < 2 || sentences > 3) warnings.push(`Počet vět ${sentences}: ${key}`);
}
for (const date of dates) for (const sign of signs) if (!seen.has(`${date}:${sign}`)) errors.push(`Chybí ${date}:${sign}`);
if (items.length !== 312) errors.push(`Očekáváno 312, nalezeno ${items.length}`);

function tokens(value) {
    return new Set(String(value).toLocaleLowerCase('cs-CZ').normalize('NFD').replace(/\p{Diacritic}/gu, '').match(/\p{L}{4,}/gu) || []);
}
function similarity(a, b) {
    const x = tokens(a), y = tokens(b);
    const common = [...x].filter(token => y.has(token)).length;
    return common / Math.max(1, x.size + y.size - common);
}
const previous = JSON.parse(fs.readFileSync(path.join(docs, 'horoscope-pilot-week-2026-09-29_2026-10-05-v2.json'), 'utf8')).items;
for (const sign of signs) {
    const sequence = [...previous.filter(item => item.sign === sign), ...items.filter(item => item.sign === sign)].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < sequence.length; i += 1) for (let j = i + 1; j < sequence.length; j += 1) {
        const score = similarity(sequence[i].prediction, sequence[j].prediction);
        if (score > 0.5) warnings.push(`Podobné texty ${sign}: ${sequence[i].date}/${sequence[j].date} (${score.toFixed(2)})`);
    }
}

console.log(`Říjen: ${items.length}/312 textů, ${errors.length} chyb, ${warnings.length} upozornění`);
for (const error of errors) console.error(`CHYBA: ${error}`);
for (const warning of warnings) console.warn(`POZOR: ${warning}`);
if (errors.length) process.exitCode = 1;
else if (process.argv.includes('--write')) {
    items.sort((a, b) => dates.indexOf(a.date) - dates.indexOf(b.date) || signs.indexOf(a.sign) - signs.indexOf(b.sign));
    const output = path.join(docs, 'horoscope-october-2026-draft.json');
    fs.writeFileSync(output, JSON.stringify({ version: 'october-2026-v1', status: 'draft', source: 'docs/horoscope-october-2026-brief.md', items }, null, 2) + '\n', 'utf8');
    console.log(`Uložen ${output}`);
}
