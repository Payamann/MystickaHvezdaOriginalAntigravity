import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const art = {
  astrolab: ['img/atlas/tools-v1/01-astrolab.webp', 1200, 800],
  moon: ['img/atlas/tools-v1/02-mesicni-krajina.webp', 1200, 800],
  notebook: ['img/atlas/tools-v1/03-numerologicky-zapisnik.webp', 1200, 800],
  runes: ['img/atlas/tools-v1/04-runove-kameny.webp', 1200, 800],
  crystal: ['img/atlas/tools-v1/05-kristalova-koule.webp', 1200, 800],
  forest: ['img/atlas/tools-v1/06-lesni-kruh.webp', 1200, 800],
  cups: ['img/atlas/social-v1/01-dva-hrnky.webp', 1080, 1080],
  gate: ['img/atlas/social-v1/02-zahradni-branka.webp', 1080, 1080],
  leaf: ['img/atlas/social-v1/03-posledni-list.webp', 1080, 1080],
  steps: ['img/atlas/social-v1/04-prvni-schody.webp', 1080, 1080],
  cat: ['img/atlas/social-v1/05-kocka-u-okna.webp', 1080, 1080],
  watering: ['img/atlas/social-v1/06-zalevani.webp', 1080, 1080],
  heron: ['img/atlas/social-v1/07-volavka.webp', 1080, 1080],
  mirror: ['img/atlas/social-v1/08-zrcadlo.webp', 1080, 1080],
  pomegranate: ['img/atlas/social-v1/09-granatove-jablko.webp', 1080, 1080],
  owl: ['img/atlas/social-v1/10-sova.webp', 1080, 1080],
  fool: ['img/tarot-v2/tarot_blazen.webp', 600, 1000, true],
  lovers: ['img/tarot-v2/tarot_milenci.webp', 600, 1000, true],
  star: ['img/tarot-v2/tarot_hvezda.webp', 600, 1000, true],
  luna: ['img/tarot-v2/tarot_luna.webp', 600, 1000, true],
  sun: ['img/tarot-v2/tarot_slunce.webp', 600, 1000, true],
  judgement: ['img/tarot-v2/tarot_soud.webp', 600, 1000, true],
  tower: ['img/tarot-v2/tarot_vez.webp', 600, 1000, true],
  cupAce: ['img/tarot-v2/tarot_eso_poharu.webp', 600, 1000, true],
  wandAce: ['img/tarot-v2/tarot_eso_holi.webp', 600, 1000, true],
  swordAce: ['img/tarot-v2/tarot_eso_mecu.webp', 600, 1000, true],
  pentacleAce: ['img/tarot-v2/tarot_eso_pentaklu.webp', 600, 1000, true],
};

const mappings = [
  ['retrograde-venus-2026-co-cekat-v-lasce', 'cups', 'Dva hrnky jako obraz vztahů a vzájemnosti'],
  ['uplnek-v-panne-ritual-a-vyklad-pro-kazde-znameni', 'moon', 'Malovaná měsíční krajina'],
  ['uplnek-v-kozorohovi-ritual-a-vyznam', 'moon', 'Měsíční krajina pro téma úplňku'],
  ['merkur-v-retrograde-co-to-znamena-pro-vase-znameni', 'astrolab', 'Astroláb pro orientaci v astrologických cyklech'],
  ['stir-muz-a-panna-zena-kompatibilita', 'cups', 'Dva hrnky jako obraz partnerské souhry'],
  ['co-je-synastrie-jak-funguje-partnerska-astrologie', 'astrolab', 'Astroláb jako symbol partnerské astrologie'],
  ['5-znaku-ze-potkavate-svou-spriznenou-dusi', 'cups', 'Dva hrnky jako obraz setkání a vzájemnosti'],
  ['jak-zjistit-sve-logo-a-sestici-v-numerologii', 'notebook', 'Numerologický zápisník pro výpočet čísel'],
  ['ascendent-vs-slunecni-znameni-jaky-je-rozdil', 'astrolab', 'Mosazný astroláb pro Slunce a ascendent'],
  ['andelska-cisla-333-444-555', 'notebook', 'Zápisník s číselnými symboly'],
  ['jak-cist-natalni-kartu-pruvodce', 'astrolab', 'Astroláb pro čtení natální karty'],
  ['lilith-v-natalni-karte', 'mirror', 'Malované zrcadlo jako obraz sebepoznání'],
  ['runovy-vyklad-doma-pruvodce', 'runes', 'Runové kameny na tmavé látce'],
  ['pluto-ve-vodnari-2024-2043', 'gate', 'Zahradní branka jako symbol proměny a nového směru'],
  ['mesicni-znak-natalni-karta', 'moon', 'Měsíční krajina pro téma lunárního znamení'],
  ['cinsky-horoskop-2026-rok-ohniveho-kone', 'sun', 'Kůň na malované tarotové kartě Slunce'],
  ['jak-funguji-andelske-karty', 'heron', 'Volavka v tiché krajině jako obraz chvíle k zamyšlení'],
  ['co-je-aura-jak-ji-videt-cist-cistit', 'mirror', 'Malované zrcadlo jako obraz všímavosti k sobě'],
  ['attachment-styly-vzorce-ve-vztazich', 'mirror', 'Malované zrcadlo jako symbol vztahových vzorců'],
  ['biorytmy-proc-se-vam-nedari', 'cat', 'Kočka odpočívající u okna jako obraz času na odpočinek'],
  ['co-znamenaji-pohary-v-tarotu', 'cupAce', 'Tarotová karta Eso pohárů'],
  ['hulkove-karty-tarot-vyznam', 'wandAce', 'Tarotová karta Eso holí'],
  ['iluze-spriznene-duse-karmicke-vztahy', 'cups', 'Dva hrnky jako obraz vzájemnosti ve vztahu'],
  ['karta-hvezda-tarot-vyznam', 'star', 'Tarotová karta Hvězda'],
  ['karta-mesic-tarot-vyznam', 'luna', 'Tarotová karta Luna'],
  ['karta-slunce-tarot-vyznam', 'sun', 'Tarotová karta Slunce'],
  ['karta-soudce-tarot-vyznam', 'judgement', 'Tarotová karta Soud'],
  ['keltsky-kriz-tarot-rozlozeni', 'star', 'Karta Hvězda z balíčku pro tarotový rozklad'],
  ['lekce-padajici-veze-tarot', 'tower', 'Tarotová karta Věž'],
  ['mecove-karty-tarot-vyznam', 'swordAce', 'Tarotová karta Eso mečů'],
  ['mistrovska-cisla-numerologie', 'notebook', 'Malovaný numerologický zápisník'],
  ['numerologie-jmena-krizni-jmeno', 'notebook', 'Zápisník pro zkoumání numerologie jména'],
  ['numerologie-kompatibilita-partneru', 'cups', 'Dva hrnky jako obraz partnerské souhry'],
  ['osobni-rok-numerologie-2026', 'notebook', 'Numerologický zápisník pro osobní rok'],
  ['panna-a-beran-partnerska-shoda', 'cups', 'Dva hrnky jako obraz setkání odlišných povah'],
  ['pentagramy-tarot-penize-kariera', 'pentacleAce', 'Tarotová karta Eso pentaklů'],
  ['proc-vam-to-v-lasce-nevyhcazi', 'mirror', 'Zrcadlo jako symbol pohledu na vztahové vzorce'],
  ['saturuv-navrat-29-rok-zivota', 'steps', 'Malované schody jako obraz životního přechodu'],
  ['skryty-kod-biorytmu-energeticke-cykly', 'leaf', 'List na větvi jako obraz proměnlivých přírodních cyklů'],
  ['tajemstvi-12-astrologickych-domu', 'astrolab', 'Mosazný astroláb pro téma astrologických domů'],
  ['uzel-osudu-severni-jizni-uzel', 'gate', 'Zahradní branka jako symbol volby dalšího směru'],
  ['vyklad-tarotu-pro-zacatecniky', 'fool', 'Tarotová karta Blázen pro první seznámení s tarotem'],
  ['zaklady-sedmi-caker-anatomie', 'watering', 'Péče o rostlinu jako obraz všímavosti k sobě'],
  ['zakon-pritazlivosti-chyby', 'steps', 'Schody jako obraz konkrétních kroků směrem k cíli'],
  ['zivotni-cislo-odhaleni-kodu-vasi-duse', 'notebook', 'Numerologický zápisník pro životní číslo'],
  ['andelska-cisla-1111', 'notebook', 'Numerologický zápisník s číselnými symboly'],
  ['andelske-cislo-222-vyznam', 'notebook', 'Numerologický zápisník pro význam čísla 222'],
  ['cakrove-leceni-navod', 'watering', 'Jemná péče o rostlinu jako obraz každodenní čakrové praxe'],
  ['chiron-raneny-lecitel-natalni-karta', 'mirror', 'Zrcadlo jako symbol sebepoznání a tématu Chirona'],
  ['ctyri-zivly-astrologie-ohen-zeme-vzduch-voda', 'astrolab', 'Astroláb pro zkoumání čtyř živlů v astrologii'],
  ['feng-shui-doma-energie-penizy-laska', 'gate', 'Zahradní branka jako obraz proudění a uspořádání prostoru'],
  ['jak-se-pripravit-na-uplnek', 'moon', 'Měsíční krajina pro přípravu na úplněk'],
  ['karta-blazen-tarot-vyznam', 'fool', 'Tarotová karta Blázen'],
  ['karta-milenci-tarot-vyznam', 'lovers', 'Tarotová karta Milenci'],
  ['letani-ve-snu-vyznam', 'heron', 'Volavka v letu jako obraz snu o létání'],
  ['letni-laska-astrologie-znameni', 'cups', 'Dva hrnky jako obraz letního vztahu'],
  ['lvi-sezona-2026', 'pomegranate', 'Granátové jablko v teplém světle pro období Lva'],
  ['minuly-zivot-znameni-vzpominky', 'gate', 'Zahradní branka jako symbol vzpomínek a minulých cest'],
  ['novy-mesic-ritual-zacatecnici', 'moon', 'Noční měsíční krajina pro rituál novoluní'],
  ['opakujici-se-sny-co-znamenaji', 'cat', 'Kočka u nočního okna jako obraz opakujících se snů'],
  ['osobni-mesic-numerologie-vypocet', 'notebook', 'Numerologický zápisník pro výpočet osobního měsíce'],
  ['pruvodce-energie-ochrana', 'mirror', 'Zrcadlo jako symbol vědomých hranic a ochrany energie'],
  ['psychologie-snu-stici-stromy', 'owl', 'Sova v noční krajině jako obraz stínových snů'],
  ['retrogradni-merkur-pruvodce', 'astrolab', 'Astroláb pro orientaci v retrográdním Merkuru'],
  ['rozpoznejte-svou-astrologickou-signaturu', 'astrolab', 'Astroláb pro Slunce, Měsíc a ascendent'],
  ['runy-severska-magie-v-modernim-svete', 'runes', 'Runové kameny na tmavé látce'],
  ['saturnuv-navrat-krize-tricitky', 'steps', 'První schody jako obraz přechodu během Saturnova návratu'],
  ['shamansko-kolo-totemove-zvire', 'forest', 'Lesní kruh pro téma šamanského kola a totemového zvířete'],
  ['silove-zvire-jak-najit', 'forest', 'Lesní kruh jako místo setkání se silovým zvířetem'],
  ['tajemstvi-kristalove-koule-scrying', 'crystal', 'Malovaná křišťálová koule pro praxi scryingu'],
  ['tajemstvi-snilku-jak-rozklivovat-nocni-vzazy', 'owl', 'Sova v noční krajině jako průvodce symbolikou snů'],
  ['zatmeni-slunce-a-mesice-2026', 'moon', 'Měsíční krajina pro zatmění Slunce a Měsíce'],
  ['zatmeni-slunce-srpen-2026-lev', 'moon', 'Měsíční krajina pro zatmění Slunce ve Lvu'],
  ['znameni-zverokruhu-a-penize', 'pomegranate', 'Granátové jablko jako symbol hojnosti a vztahu k penězům'],
];

const placeholders = new Set([
  '<img class="mh-inline-7b60e3b660">',
  '<img class="mh-inline-b9aae3ed11">',
  '<img class="mh-inline-b586547132">',
  '<img class="mh-inline-a4c4f1d496">',
  '<img class="mh-inline-5f382bdb05">',
  '<img class="mh-inline-549ab2e562">',
  '<img class="mh-inline-c1e2471b53">',
  '<img class="mh-inline-a8af1d35fe">',
]);

function articleTag(assetPath, width, height, alt, isCard) {
  const cardClass = isCard ? ' atlas-blog-art--card' : '';
  return `<img src="../${assetPath}" alt="${alt}" width="${width}" height="${height}" loading="lazy" decoding="async" class="blog-featured-image atlas-blog-art${cardClass}">`;
}

function replaceArticleImage(html, replacement, slug) {
  if (html.includes(replacement)) return html;

  let matched = false;
  const next = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const isPlaceholder = placeholders.has(tag);
    const isLegacy = /\.\.\/img\/(?:hero-3d|crystal-ball-3d|tarot-back|icon-[\w-]+|blog-astrology)\.webp/.test(tag);
    if (matched || (!isPlaceholder && !isLegacy)) return tag;
    matched = true;
    return replacement;
  });

  if (!matched) {
    // Some editorial pages were published without a hero illustration.
    const contentMarker = /<div\b[^>]*class="blog-content"[^>]*>|<article\b[^>]*>/;
    if (contentMarker.test(html) && !/class="[^"]*blog-featured-image/.test(html)) {
      return html.replace(contentMarker, (marker) => `${replacement}\n${marker}`);
    }
    throw new Error(`${slug}: expected article image or editorial content container was not found`);
  }
  return next;
}

const indexPath = path.join(ROOT, 'data', 'blog-index.json');
const blogIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const indexBySlug = new Map(blogIndex.map((post) => [post.slug, post]));
const hubPath = path.join(ROOT, 'blog.html');
let hubHtml = fs.readFileSync(hubPath, 'utf8');
const fallbackPath = path.join(ROOT, 'server/data/blog-posts.js');
let fallbackSource = fs.readFileSync(fallbackPath, 'utf8');

for (const [slug, artKey, alt] of mappings) {
  const [assetPath, width, height, isCard = false] = art[artKey];
  if (!fs.existsSync(path.join(ROOT, assetPath))) throw new Error(`Missing artwork: ${assetPath}`);
  const articlePath = path.join(ROOT, 'blog', `${slug}.html`);
  let html = fs.readFileSync(articlePath, 'utf8');
  html = replaceArticleImage(html, articleTag(assetPath, width, height, alt, isCard), slug);

  const schemaImage = `"image": "https://www.mystickahvezda.cz/${assetPath}"`;
  if (!html.includes(schemaImage)) {
    const replaced = html.replace(/"image":\s*"https:\/\/www\.mystickahvezda\.cz\/img\/[^\"]+"/, schemaImage);
    if (replaced === html) throw new Error(`${slug}: BlogPosting.image was not found`);
    html = replaced;
  }
  fs.writeFileSync(articlePath, html, 'utf8');

  const post = indexBySlug.get(slug);
  if (!post) throw new Error(`${slug}: missing in data/blog-index.json`);
  post.featured_image = assetPath;
  // Keep the static hub (available before JS loads) aligned with the live index.
  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hubPattern = new RegExp(`(<a\\b[^>]*href="blog/${escapedSlug}\\.html"[^>]*>[\\s\\S]*?<img\\b[^>]*src=")[^"]+`,'g');
  hubHtml = hubHtml.replace(hubPattern, `$1${assetPath}`);
  // Existing fallback generator records must not reintroduce the old art.
  const fallbackPattern = new RegExp(`(slug: '${escapedSlug}'[\\s\\S]*?featured_image: ')[^']+`);
  fallbackSource = fallbackSource.replace(fallbackPattern, `$1../${assetPath}`);
}

fs.writeFileSync(indexPath, `${JSON.stringify(blogIndex, null, 2)}\n`, 'utf8');
fs.writeFileSync(hubPath, hubHtml, 'utf8');
fs.writeFileSync(fallbackPath, fallbackSource, 'utf8');
console.log(`[atlas-blog-art] updated ${mappings.length} articles and blog index entries`);
