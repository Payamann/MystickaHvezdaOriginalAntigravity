import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const cardsPath = path.join(rootDir, 'data', 'tarot-cards.json');
const seoOverridesPath = path.join(rootDir, 'data', 'tarot-card-seo-overrides.json');
const pagePath = path.join(rootDir, 'tarot-vyznam-karet.html');
const detailDir = path.join(rootDir, 'tarot-vyznam');
const siteOrigin = 'https://www.mystickahvezda.cz';
const seoOverrides = fs.existsSync(seoOverridesPath)
    ? JSON.parse(fs.readFileSync(seoOverridesPath, 'utf8'))
    : {};
const editorialSummaries = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'tarot-editorial-summaries.json'), 'utf8'));

const majorArcana = new Set([
    'Blázen',
    'Mág',
    'Velekněžka',
    'Císařovna',
    'Císař',
    'Velekněz',
    'Milenci',
    'Vůz',
    'Síla',
    'Poustevník',
    'Kolo štěstí',
    'Spravedlnost',
    'Viselec',
    'Smrt',
    'Mírnost',
    'Ďábel',
    'Věž',
    'Hvězda',
    'Luna',
    'Slunce',
    'Soud',
    'Svět'
]);

const groupLabels = {
    major: 'Velká arkána',
    wands: 'Hůlky',
    cups: 'Poháry',
    swords: 'Meče',
    pentacles: 'Pentákly'
};

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getCardGroup(name) {
    if (majorArcana.has(name)) return 'major';
    if (name.includes('holí')) return 'wands';
    if (name.includes('pohárů')) return 'cups';
    if (name.includes('mečů')) return 'swords';
    if (name.includes('pentáklů')) return 'pentacles';
    return 'major';
}

function getFirstSentence(text) {
    const cleaned = String(text || '').trim();
    if (!cleaned) return '';
    const firstDot = cleaned.indexOf('.');
    if (firstDot === -1) return cleaned.slice(0, 180);
    return cleaned.slice(0, firstDot + 1);
}

function getSentences(text, limit = 3) {
    return String(text || '')
        .split(/(?<=[.!?])\s+/)
        .map(sentence => sentence.trim())
        .filter(Boolean)
        .slice(0, limit);
}

/** Zmen\u0161\u00ed prvn\u00ed znak \u2014 `meaning` je v datech s velk\u00fdm p\u00edsmenem, ale za dvojte\u010dkou
 *  v titulku \u010dte p\u0159irozen\u011bji mal\u00e9 ("Kr\u00e1l poh\u00e1r\u016f: emocion\u00e1ln\u00ed moudrost\u2026"). */
function lowerFirst(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    return text.charAt(0).toLocaleLowerCase('cs-CZ') + text.slice(1);
}

/** Popisek detailu karty: unik\u00e1tn\u00ed per kartu (d\u0159\u00edv byl nap\u0159\u00ed\u010d 78 str\u00e1nkami
 *  skoro identick\u00fd, co\u017e Googlu d\u00e1valo 78 t\u00e9m\u011b\u0159 duplicitn\u00edch snippet\u016f).
 *  Skl\u00e1d\u00e1 se z v\u00fdznamu + prvn\u00ed v\u011bty interpretace + praktick\u00e9ho p\u0159\u00edslibu. */
function buildDetailDescription(name, meaning, interpretation) {
    const lead = meaning ? `${meaning}.` : `V\u00fdznam karty ${name} v tarotu.`;
    const tail = 'V\u00fdznam v l\u00e1sce, pr\u00e1ci i jako odpov\u011b\u010f ano/ne.';
    // N\u011bkter\u00e9 karty maj\u00ed velmi kr\u00e1tkou prvn\u00ed v\u011btu ("Triumf!"), co\u017e by dalo popisek
    // pod ~80 znak\u016f. Proto se p\u0159ib\u00edraj\u00ed dal\u0161\u00ed v\u011bty, dokud snippet nem\u00e1 rozumnou d\u00e9lku.
    const sentences = getSentences(interpretation, 3);
    let hook = '';
    for (const sentence of sentences) {
        hook = hook ? `${hook} ${sentence}` : sentence;
        if (`${lead} ${hook} ${tail}`.length >= 95) break;
    }
    return compactText([lead, hook, tail].filter(Boolean).join(' '), 165);
}

function slugify(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function detailFileName(name) {
    return `${slugify(name)}.html`;
}

function detailHref(name) {
    return `tarot-vyznam/${detailFileName(name)}`;
}

function detailCanonical(name) {
    return `${siteOrigin}/tarot-vyznam/${detailFileName(name)}`;
}

function assetUrl(relativePath) {
    const normalized = String(relativePath || 'img/tarot/tarot_placeholder.webp').replace(/^\/+/, '');
    return `${siteOrigin}/${normalized}`;
}

function rootAssetPath(relativePath) {
    const normalized = String(relativePath || 'img/tarot/tarot_placeholder.webp').replace(/^\/+/, '');
    return `/${normalized}`;
}

function compactText(value, maxLength = 155) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1).trim()}…`;
}

function jsonLd(value) {
    return JSON.stringify(value, null, 8).replace(/</g, '\\u003c');
}

function getReadingAngles(group, name, meaning) {
    const base = {
        major: {
            love: `${name} v lásce mluví o velkém tématu vztahu: o tom, co už nelze přehlížet a co potřebuje vědomé rozhodnutí.`,
            work: `V práci karta ${name} ukazuje směr, kde má větší váhu dlouhodobý smysl než rychlá reakce.`,
            action: `Dnes si polož otázku, kde se energie „${meaning}“ už objevuje a co po tobě chce v praxi.`
        },
        wands: {
            love: `${name} ve vztazích přináší oheň, odvahu a potřebu jednat otevřeně místo čekání na dokonalý okamžik.`,
            work: `V práci karta ${name} podporuje akci, kreativitu a jasnější rozhodnutí, kam chceš směřovat energii.`,
            action: `Vyber jeden krok, který posune téma „${meaning}“ z úvah do pohybu.`
        },
        cups: {
            love: `${name} v lásce otevírá citovou rovinu: potřebu naslouchat, pojmenovat emoce a nelhat si o tom, co cítíš.`,
            work: `V práci karta ${name} ukazuje, jak moc do situace vstupují vztahy, intuice a vnitřní motivace.`,
            action: `Zastav se u pocitu, který téma „${meaning}“ vyvolává, a převeď ho do jedné klidné věty.`
        },
        swords: {
            love: `${name} ve vztazích žádá pravdivou komunikaci, jasné hranice a ochotu slyšet i nepohodlnou část příběhu.`,
            work: `V práci karta ${name} pomáhá oddělit fakta od domněnek a udělat rozhodnutí s čistší hlavou.`,
            action: `Napiš si, kde tě téma „${meaning}“ vede k přesnějším slovům nebo férovější hranici.`
        },
        pentacles: {
            love: `${name} v lásce připomíná důvěru budovanou činy, stabilitu a péči, která je vidět v každodennosti.`,
            work: `V práci karta ${name} míří k praxi: penězům, tělu, času, výsledkům a tomu, co má pevný základ.`,
            action: `Udělej jeden konkrétní krok, který energii „${meaning}“ ukotví v reálném světě.`
        }
    };

    return base[group] || base.major;
}

function getYesNoSignal(group, name, meaning) {
    const signals = {
        major: `${name} jako ano/ne odpověď většinou říká: podívej se na hlavní téma situace dřív, než zvolíš pevné ano nebo ne.`,
        wands: `${name} v otázce ano/ne podporuje akci, pokud je záměr jasný a nejde jen o impulz.`,
        cups: `${name} v otázce ano/ne vede k citům, důvěře a tomu, jestli odpověď opravdu ladí se srdcem.`,
        swords: `${name} v otázce ano/ne žádá fakta, jasná slova a rozhodnutí bez domýšlení.`,
        pentacles: `${name} v otázce ano/ne míří k praxi: času, stabilitě, tělu, penězům a reálnému kroku.`
    };

    return signals[group] || `Karta ${name} v otázce ano/ne nese téma „${meaning}“ a chce nejdřív zpřesnit otázku.`;
}

function getRelatedCards(entries, index, limit = 3) {
    const [name] = entries[index];
    const group = getCardGroup(name);
    const candidates = [];

    const addCandidate = (candidate) => {
        if (!candidate) return;
        const [candidateName, candidateCard] = candidate;
        if (!candidateName || candidateName === name) return;
        if (candidates.some(([existingName]) => existingName === candidateName)) return;
        candidates.push([candidateName, candidateCard]);
    };

    addCandidate(entries[index - 1]);
    addCandidate(entries[index + 1]);

    for (const entry of entries) {
        if (candidates.length >= limit) break;
        if (getCardGroup(entry[0]) === group) addCandidate(entry);
    }

    return candidates.slice(0, limit);
}

function getEditorialTheme(name, card) {
    const theme = seoOverrides[name]?.theme;
    return typeof theme === 'string' && theme.trim() ? theme.trim() : (card.meaning || '');
}

function buildRelatedCardLinks(relatedCards) {
    return relatedCards
        .map(([relatedName, relatedCard]) => {
            const relatedGroup = groupLabels[getCardGroup(relatedName)] || 'Tarot';
            return `<a class="tarot-related-card" href="/${escapeHtml(detailHref(relatedName))}">
                        <img src="${escapeHtml(rootAssetPath(relatedCard.image))}" alt="" width="66" height="110" loading="lazy" decoding="async" srcset="${escapeHtml(`${rootAssetPath(relatedCard.image.replace(/\.webp$/i, '-240.webp'))} 240w, ${rootAssetPath(relatedCard.image.replace(/\.webp$/i, '-360.webp'))} 360w, ${rootAssetPath(relatedCard.image)} 600w`)}" sizes="66px">
                        <span>${escapeHtml(relatedGroup)}</span>
                        <strong>${escapeHtml(relatedName)}</strong>
                        <small>${escapeHtml(getEditorialTheme(relatedName, relatedCard))}</small>
                    </a>`;
        })
        .join('\n                    ');
}

function responsiveCardImageAttributes(image) {
    const source = String(image || '');
    if (!/^img\/tarot-v2\/tarot_[^/]+\.webp$/i.test(source)) return '';

    const base = source.slice(0, -'.webp'.length);
    const candidates = [240, 360]
        .filter((width) => fs.existsSync(path.join(rootDir, base + '-' + width + '.webp')))
        .map((width) => base + '-' + width + '.webp ' + width + 'w');
    if (!candidates.length) return '';
    candidates.push(source + ' 600w');
    return ' srcset="' + escapeHtml(candidates.join(', ')) + '" sizes="(max-width: 560px) 170px, 108px"';
}

function buildCard(name, card) {
    const group = getCardGroup(name);
    const groupLabel = groupLabels[group] || 'Tarot';
    const image = card.image || 'img/tarot/tarot_placeholder.webp';
    const responsiveImageAttrs = responsiveCardImageAttributes(image);
    const meaning = getEditorialTheme(name, card);
    const interpretation = getFirstSentence(seoOverrides[name]?.hubSummary || card.interpretation || '');
    const detail = detailHref(name);

    return `                    <article class="tarot-meaning-card" data-group="${escapeHtml(group)}" data-card="${escapeHtml(name)}">
                        <div class="tarot-meaning-card__image">
                            <img loading="lazy" src="${escapeHtml(image)}"${responsiveImageAttrs} alt="${escapeHtml(name)} tarot karta" width="180" height="300">
                        </div>
                        <div class="tarot-meaning-card__body">
                            <div class="tarot-meaning-card__meta">${escapeHtml(groupLabel)}</div>
                            <h3><a href="${escapeHtml(detail)}">${escapeHtml(name)}</a></h3>
                            <p class="tarot-meaning-card__meaning">${escapeHtml(meaning)}</p>
                            <p>${escapeHtml(interpretation)}</p>
                            <a href="${escapeHtml(detail)}" class="tarot-meaning-card__link">Význam karty</a>
                        </div>
                    </article>`;
}

function buildDetailPage(name, card, relatedCards = []) {
    const group = getCardGroup(name);
    const groupLabel = groupLabels[group] || 'Tarot';
    const image = card.image || 'img/tarot/tarot_placeholder.webp';
    const meaning = getEditorialTheme(name, card);
    const seo = seoOverrides[name] || {};
    const interpretation = seo.summary || editorialSummaries[name] || card.interpretation || getFirstSentence(meaning);
    const sentences = getSentences(interpretation, 4);
    const defaultAngles = getReadingAngles(group, name, meaning);
    const angles = {
        love: seo.love || defaultAngles.love,
        work: seo.work || defaultAngles.work,
        action: seo.action || defaultAngles.action
    };
    const canonical = detailCanonical(name);
    const previewImage = `${siteOrigin}/img/search-preview/tarot-cards/${slugify(name)}.webp`;
    const encodedName = encodeURIComponent(name);
    // CTR: cluster stál na pozici ~8 s CTR 1,07 % — rankování bylo v pořádku, ale
    // snippet sliboval seznam sekcí ("láska, práce, ano/ne") místo odpovědi. Lidé
    // navíc hledají jen jméno karty ("kralovna poharu"), ne slovo "význam".
    // Proto teď titulek nese SKUTEČNÝ význam a popisek je unikátní per kartu.
    const title = `${name}: ${lowerFirst(meaning)} – význam v tarotu`;
    const description = buildDetailDescription(name, meaning, interpretation);
    const yesNoSignal = seo.yesNo || getYesNoSignal(group, name, meaning);
    const relatedLinks = buildRelatedCardLinks(relatedCards);
    const reversedSection = seo.reversed
        ? `<h2>${escapeHtml(name)} obráceně</h2>
                    <p>${escapeHtml(seo.reversed)}</p>`
        : '';
    const exampleSection = seo.example
        ? `<h2>Příklad výkladu karty ${escapeHtml(name)}</h2>
                    <p>${escapeHtml(seo.example)}</p>`
        : '';
    const extraInsightSections = [reversedSection, exampleSection].filter(Boolean).join('\n\n                    ');
    const guideSection = seo.guidePath && /^\/blog\/[a-z0-9-]+\.html$/.test(seo.guidePath)
        ? `<p><a href="${escapeHtml(seo.guidePath)}">${escapeHtml(seo.guideLabel || 'Praktický průvodce touto kartou')}</a></p>`
        : '';
    const reversedFaq = seo.reversed
        ? `\n                <details class="faq-item">
                    <summary>Co znamená ${escapeHtml(name)} obráceně?</summary>
                    <p>${escapeHtml(seo.reversed)}</p>
                </details>`
        : '';
    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${name} tarot význam`,
        description,
        image: assetUrl(image),
        author: { '@type': 'Organization', name: 'Mystická Hvězda', url: siteOrigin },
        publisher: {
            '@type': 'Organization',
            name: 'Mystická Hvězda',
            logo: { '@type': 'ImageObject', url: `${siteOrigin}/img/logo-3d.webp` }
        },
        mainEntityOfPage: canonical,
        inLanguage: 'cs-CZ',
        ...(seo.dateModified ? { dateModified: seo.dateModified } : {}),
        about: [
            { '@type': 'Thing', name: 'Tarot' },
            { '@type': 'Thing', name },
            { '@type': 'Thing', name: groupLabel }
        ]
    };
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Domů', item: `${siteOrigin}/` },
            { '@type': 'ListItem', position: 2, name: 'Význam tarotových karet', item: `${siteOrigin}/tarot-vyznam-karet.html` },
            { '@type': 'ListItem', position: 3, name, item: canonical }
        ]
    };
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: `Co znamená karta ${name} v tarotu?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `${name} nese téma: ${meaning}. Konkrétní výklad vždy závisí na otázce, pozici ve výkladu a dalších kartách.`
                }
            },
            {
                '@type': 'Question',
                name: `Je ${name} dobrá nebo špatná karta?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `Tarotová karta ${name} není sama o sobě dobrá ani špatná. Ukazuje energii situace a praktický směr, se kterým můžeš vědomě pracovat.`
                }
            }
        ]
    };
    if (seo.reversed) {
        faqSchema.mainEntity.push({
            '@type': 'Question',
            name: `Co znamená ${name} obráceně?`,
            acceptedAnswer: {
                '@type': 'Answer',
                text: seo.reversed
            }
        });
    }

    return `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="keywords" content="${escapeHtml(`${name} tarot význam, ${name} tarot, tarot karta ${name}, význam tarotových karet`)}">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#0a0a1a">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:image" content="${escapeHtml(previewImage)}">
    <meta property="og:image:alt" content="${escapeHtml(`${name} tarot karta`)}">
    <meta property="og:locale" content="cs_CZ">
    <meta property="og:site_name" content="Mystická Hvězda">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(previewImage)}">
    <link rel="icon" type="image/svg+xml" href="/img/icons/mh-favicon.svg">
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/img/icon-192.webp">
    <link rel="stylesheet" href="/fonts/local-fonts.css">
    <link rel="stylesheet" href="/css/style.v2.min.css?v=20261018-release-candidate">
    <link rel="stylesheet" href="/css/pages/tarot-meaning-hub.css">
    <link rel="stylesheet" href="/css/atlas-web.css?v=20261020-03-horoscope-day-switcher-atlas">
    <script type="application/ld+json">
${jsonLd([articleSchema, breadcrumbSchema, faqSchema])}
    </script>
    <script src="/js/dist/analytics-init.js" defer></script>
    <script src="/js/dist/analytics.js?v=8" defer></script>
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image:alt" content="${escapeHtml(title)}">
</head>
<body class="atlas-page">
    <a href="#main-content" class="skip-link">Přeskočit na obsah</a>
    <div id="header-placeholder"></div>

    <main id="main-content" tabindex="-1">
        <section class="section section--hero tarot-card-detail-hero">
            <div class="container tarot-card-detail-hero__inner">
                <div class="tarot-card-detail-hero__copy">
                    <nav class="breadcrumb" aria-label="Drobečková navigace">
                        <a href="/">Domů</a> &raquo; <a href="/tarot-vyznam-karet.html">Význam tarotových karet</a> &raquo; ${escapeHtml(name)}
                    </nav>
                    <span class="section__badge">${escapeHtml(groupLabel)}</span>
                    <h1 class="section__title">${escapeHtml(name)} v tarotu: význam karty</h1>
                    <p class="section__text hero__subtitle">${escapeHtml(meaning)}</p>
                    <div class="tarot-card-detail-actions">
                            <a href="/tarot.html?source=tarot_card_detail&amp;card=${encodedName}" class="btn btn--primary">Otevřít tarotový výklad</a>
                    </div>
                </div>
                <div class="tarot-card-detail-hero__image">
                    <img src="${escapeHtml(rootAssetPath(image))}" srcset="${escapeHtml(`${rootAssetPath(image.replace(/\.webp$/i, '-240.webp'))} 240w, ${rootAssetPath(image.replace(/\.webp$/i, '-360.webp'))} 360w, ${rootAssetPath(image.replace(/\.webp$/i, '-480.webp'))} 480w, ${rootAssetPath(image)} 600w`)}" sizes="(max-width: 328px) 70vw, (max-width: 860px) 230px, 300px" alt="${escapeHtml(name)} tarot karta" width="300" height="500">
                </div>
            </div>
        </section>

        <section class="section section--alt">
            <div class="container tarot-card-detail-layout">
                <article class="tarot-card-detail-content">
                    <span class="section__badge">Hlavní výklad</span>
                    <h2>Co znamená karta ${escapeHtml(name)}</h2>
                    ${sentences.map(sentence => `<p>${escapeHtml(sentence)}</p>`).join('\n                    ')}

                    <h2>${escapeHtml(name)} v lásce</h2>
                    <p>${escapeHtml(angles.love)}</p>

                    <h2>${escapeHtml(name)} v práci a rozhodování</h2>
                    <p>${escapeHtml(angles.work)}</p>

                    <h2>${escapeHtml(name)} jako odpověď ano/ne</h2>
                    <p>${escapeHtml(yesNoSignal)}</p>${extraInsightSections ? `\n\n                    ${extraInsightSections}` : ''}

                    <h2>Co si z karty odnést dnes</h2>
                    <p>${escapeHtml(angles.action)}</p>${guideSection ? `\n                    ${guideSection}` : ''}

                </article>

                <aside class="tarot-card-detail-panel" aria-label="Rychlý přehled karty">
                    <h2>Rychlý přehled</h2>
                    <dl>
                        <div><dt>Arkánum</dt><dd>${escapeHtml(groupLabel)}</dd></div>
                        <div><dt>Otázka pro tebe</dt><dd>${escapeHtml(seo.question || 'Kde se toto téma ukazuje právě teď?')}</dd></div>
                    </dl>
                </aside>
            </div>
        </section>

        <section class="section">
            <div class="container">
                <div class="section__header">
                    <span class="section__badge">Související karty</span>
                    <h2 class="section__title">Kam pokračovat dál</h2>
                    <p class="section__text">Propoj význam karty ${escapeHtml(name)} s dalšími kartami ze stejného tarotového okruhu.</p>
                </div>
                <div class="tarot-related-card-grid">
                    ${relatedLinks}
                </div>
            </div>
        </section>

        <section class="section">
            <div class="container u-narrow-center-760">
                <div class="section__header">
                    <span class="section__badge">Časté otázky</span>
                    <h2 class="section__title">${escapeHtml(name)} v tarotu</h2>
                </div>
                <details class="faq-item">
                    <summary>Co znamená karta ${escapeHtml(name)} v tarotu?</summary>
                    <p>${escapeHtml(name)} nese téma: ${escapeHtml(meaning)}. Přesný význam se mění podle otázky, pozice a okolních karet.</p>
                </details>
                <details class="faq-item">
                    <summary>Je ${escapeHtml(name)} dobré nebo špatné znamení?</summary>
                    <p>Karta není rozsudek. Ukazuje energii, se kterou můžeš vědomě pracovat, a pomáhá pojmenovat další krok.</p>
                </details>
                <details class="faq-item">
                    <summary>Jak kartu ${escapeHtml(name)} použít v online výkladu?</summary>
                    <p>Začni jasnou otázkou a nech kartu zasadit do kontextu. Online výklad ti pomůže propojit symbol s konkrétní situací.</p>
                </details>${reversedFaq}
            </div>
        </section>
    </main>

    <div id="footer-placeholder"></div>
    <script src="/js/dist/core.js?v=20261021-footer-support-locale" defer></script>
    <script type="module" src="/js/dist/main.js?v=10"></script>
</body>
</html>
`;
}

function isCurrent(filePath, content) {
    return fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === content;
}

function writeIfChanged(filePath, content) {
    if (isCurrent(filePath, content)) return false;

    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

function generateDetailPages(cards, { checkOnly = false, prune = false } = {}) {
    if (!checkOnly) fs.mkdirSync(detailDir, { recursive: true });
    const entries = Object.entries(cards);
    const desiredFiles = new Set();
    const staleFiles = [];
    const extraFiles = [];
    let changed = 0;

    for (const [index, [name, card]] of entries.entries()) {
        const fileName = detailFileName(name);
        desiredFiles.add(fileName);
        const filePath = path.join(detailDir, fileName);
        const expected = buildDetailPage(name, card, getRelatedCards(entries, index));
        if (checkOnly) {
            if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== expected) {
                staleFiles.push(filePath);
            }
        } else if (writeIfChanged(filePath, expected)) {
            changed += 1;
        }
    }

    if (fs.existsSync(detailDir)) {
        for (const entry of fs.readdirSync(detailDir, { withFileTypes: true })) {
            if (entry.isFile() && entry.name.endsWith('.html') && !desiredFiles.has(entry.name)) {
                const filePath = path.join(detailDir, entry.name);
                if (checkOnly) {
                    extraFiles.push(filePath);
                } else if (prune) {
                    fs.unlinkSync(filePath);
                    changed += 1;
                }
            }
        }
    }

    return { total: desiredFiles.size, changed, staleFiles, extraFiles };
}

function applyAtlasShell(html) {
    let next = html.replace(/<body(?: class="([^"]*)")?>/, (_, classes = '') =>
        `<body class="${[...new Set([...classes.split(/\s+/).filter(Boolean), 'atlas-page'])].join(' ')}">`);
    next = next.replace(/\s*<div class="stars" aria-hidden="true"><\/div>/g, '');
    if (!next.includes('href="/css/atlas-web.css?v=20261020-03-horoscope-day-switcher-atlas"')) {
        next = next.replace('</head>', '    <link rel="stylesheet" href="/css/atlas-web.css?v=20261020-03-horoscope-day-switcher-atlas">\n</head>');
    }
    return next;
}

function main() {
    const checkOnly = process.argv.includes('--check');
    const prune = process.argv.includes('--prune');
    if (checkOnly && prune) throw new Error('Use --check or --prune, not both.');

    const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
    if (!cards || typeof cards !== 'object' || Array.isArray(cards) || !Object.keys(cards).length) {
        throw new Error('data/tarot-cards.json must contain a non-empty card object.');
    }

    const hubCards = Object.fromEntries(Object.entries(cards).map(([name, card]) => [name, {
        image: card.image || 'img/tarot-v2/tarot_card_back.webp',
        meaning: getEditorialTheme(name, card),
        interpretation: getFirstSentence(seoOverrides[name]?.hubSummary || card.interpretation || '')
    }]));
    const hubDataPath = path.join(rootDir, 'data', 'tarot-card-hub.json');
    const expectedHubData = `${JSON.stringify(hubCards, null, 2)}\n`;
    const generatedCards = Object.entries(cards)
        .slice(0, 12)
        .map(([name, card]) => buildCard(name, card))
        .join('\n');

    const page = fs.readFileSync(pagePath, 'utf8');
    const cardsMarkerPattern = /<!-- TAROT_MEANING_CARDS_START -->[\s\S]*?<!-- TAROT_MEANING_CARDS_END -->/;
    const countPattern = /<div id="tarot-card-count" class="tarot-meaning-count" aria-live="polite">.*?<\/div>/;

    if (!cardsMarkerPattern.test(page) || !countPattern.test(page)) {
        throw new Error('tarot-vyznam-karet.html is missing generation markers.');
    }

    const nextPage = applyAtlasShell(page)
        .replace(
            cardsMarkerPattern,
            `<!-- TAROT_MEANING_CARDS_START -->\n${generatedCards}\n                    <!-- TAROT_MEANING_CARDS_END -->`
        )
        .replace(
            countPattern,
            `<div id="tarot-card-count" class="tarot-meaning-count" aria-live="polite">${Math.min(12, Object.keys(cards).length)} z ${Object.keys(cards).length} karet</div>`
        );

    const detailResult = generateDetailPages(cards, { checkOnly, prune });
    if (checkOnly) {
        const staleFiles = [...detailResult.staleFiles];
        if (!isCurrent(hubDataPath, expectedHubData)) staleFiles.push(hubDataPath);
        if (nextPage !== page) staleFiles.push(pagePath);

        if (staleFiles.length || detailResult.extraFiles.length) {
            const stalePreview = staleFiles.slice(0, 15).map((filePath) => path.relative(rootDir, filePath));
            const extraPreview = detailResult.extraFiles.slice(0, 15).map((filePath) => path.relative(rootDir, filePath));
            const summary = [
                `${staleFiles.length} generated file(s) need updates${stalePreview.length ? `: ${stalePreview.join(', ')}` : ''}`,
                `${detailResult.extraFiles.length} unrecognized HTML file(s) are preserved${extraPreview.length ? `: ${extraPreview.join(', ')}` : ''}`
            ].join('; ');
            console.error(`[tarot] Check failed: ${summary}. No files written.`);
            process.exitCode = 1;
            return;
        }

        console.log(`[tarot] Check passed: ${detailResult.total} detail pages, hub and card data are current; no files written.`);
        return;
    }

    const hubDataUpdated = writeIfChanged(hubDataPath, expectedHubData);
    const pageUpdated = writeIfChanged(pagePath, nextPage);
    if (pageUpdated) {
        console.log(`Generated ${Math.min(12, Object.keys(cards).length)} initial cards of ${Object.keys(cards).length} in ${path.relative(rootDir, pagePath)}`);
    }
    console.log(`[tarot] Updated ${detailResult.changed} of ${detailResult.total} detail pages${prune ? ' and pruned reviewed extra pages' : '; extra HTML files were preserved'}; hub ${pageUpdated ? 'updated' : 'unchanged'}, card data ${hubDataUpdated ? 'updated' : 'unchanged'}.`);
}

main();
