import {readdir,readFile,writeFile} from 'node:fs/promises';
import {atlasShell} from './atlas-shell.mjs';
const root=new URL('../',import.meta.url);
const pages=['andelske-karty.html'];
for(const name of await readdir(new URL('andelske-karty/',root))) if(name.endsWith('.html')) pages.push('andelske-karty/'+name);
let changed=0;
for(const page of pages) {
 const file=new URL(page,root), before=await readFile(file,'utf8');
 const detail=page!=='andelske-karty.html';
 const after=atlasShell(before,detail?'atlas-content-page atlas-content-detail':'atlas-angel-page',detail?'atlas-content.css':'atlas-angels.css');
 if(after!==before) {await writeFile(file,after);changed++;}
}
console.log(`[atlas-angels] ${pages.length} pages; changed ${changed}`);
