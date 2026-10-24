import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { MAIN_POLISH_PAGES, polishMainPage } from './atlas-main-polish.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const backup=path.join(root,'.tmp','main-design-polish-before');
let updated=0;
for (const page of MAIN_POLISH_PAGES) {
 const file=path.join(root,page);
 const before=fs.readFileSync(file,'utf8');
 const saved=path.join(backup,page);
 if (!fs.existsSync(saved)) { fs.mkdirSync(path.dirname(saved),{recursive:true}); fs.writeFileSync(saved,before); }
 let next=polishMainPage(before,page);
 if(page==='kontakt.html' && !next.includes('contact-composer')) {
  // The existing extra closing div now closes this composer; its heading and form are one grid item.
  next=next.replace('<h3 class="card__title mb-md">Napište nám</h3>','<div class="contact-composer card">\n<h3 class="card__title mb-md">Napište nám</h3>');
 }
 if (next!==before) {fs.writeFileSync(file,next);updated++;}
}
const shellPath=path.join(root,'scripts','atlas-shell.mjs');
let shell=fs.readFileSync(shellPath,'utf8');
if (!shell.includes("from './atlas-main-polish.mjs'")) {
 shell="import { polishMainPage } from './atlas-main-polish.mjs';\n"+shell;
 shell=shell.replace("return result.replace('</head>',", "return polishMainPage(result.replace('</head>',");
 shell=shell.replace('\n</head>`);','\n</head>`));');
 // The template string contains escaped newlines in source.
 shell=shell.replace('\\n</head>`);','\\n</head>`));');
 fs.writeFileSync(shellPath,shell);
}
// Optional one-time artwork export. Reapplying page styles does not need the original image.
const artArg=process.argv.indexOf('--art-source');
if (artArg>=0) {
 const sourceImage=process.argv[artArg+1];
 if (!sourceImage) throw new Error('--art-source requires an image path');
 await sharp(sourceImage).resize({width:1200}).webp({quality:90}).toFile(path.join(root,'img','atlas','chinese-zodiac-v1.webp'));
}
console.log(`Updated ${updated} main pages; preserved originals in .tmp.`);
