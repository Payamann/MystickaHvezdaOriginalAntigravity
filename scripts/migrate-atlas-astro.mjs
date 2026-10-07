import {readdir,readFile,writeFile} from 'node:fs/promises';
import {atlasShell} from './atlas-shell.mjs';
const root = new URL('../', import.meta.url);
const pages = ['partnerska-shoda.html','kalkulacka-cisla-osudu.html'];
for (const group of ['partnerska-shoda','horoskop','numerologie']) {
 for (const name of await readdir(new URL(group+'/',root))) if (name.endsWith('.html')) pages.push(`${group}/${name}`);
}
let changed=0;
for (const page of pages) {
 const file=new URL(page,root);
 const before=await readFile(file,'utf8');
 const numerology=page.startsWith('numerologie/');
 let after=atlasShell(before,numerology?'atlas-content-page atlas-content-detail':'atlas-astro-page','atlas-'+(numerology?'content':'astro')+'.css');
 if(page.startsWith('horoskop/') || page==='partnerska-shoda/index.html') after=after.replace(/(<span class="(?:sign-emoji|sign-card__emoji|icon)">)([^<]+)(<\/span>)/g, (_,open,symbol,close)=>open+symbol.replace(/[\uFE0E\uFE0F]/g,'')+'\uFE0E'+close);
 if (after!==before) {await writeFile(file,after); changed++;}
}
console.log(`[atlas-astro] ${pages.length} pages; changed ${changed}`);
