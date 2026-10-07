import sharp from 'sharp';
import {readFile,mkdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const source=new URL('docs/tarot-deck-v2/tool-art-v1/',root);
const target=new URL('img/atlas/tools-v1/',root);
await mkdir(target,{recursive:true});
const manifest=JSON.parse(await readFile(new URL('manifest.json',source),'utf8'));
for(const item of manifest.assets) {
 const dest=new URL(item.name+'.webp',target);
 await sharp(await readFile(new URL(item.original,source))).resize({width:1200,withoutEnlargement:true}).webp({quality:83}).toFile(fileURLToPath(dest));
 console.log(`${item.name}: ${Math.round((await stat(dest)).size/1024)} kB`);
}
