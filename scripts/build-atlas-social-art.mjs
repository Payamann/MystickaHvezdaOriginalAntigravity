import sharp from 'sharp';
import {mkdir,readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const source=new URL('docs/tarot-deck-v2/social-art-v1/',root);
const target=new URL('img/atlas/social-v1/',root);
await mkdir(target,{recursive:true});
const manifest=JSON.parse(await readFile(new URL('manifest.json',source),'utf8'));
for(const item of manifest.assets) {
 const input=await readFile(new URL(item.original,source));
 const meta=await sharp(input).metadata();
 const dest=new URL(item.name+'.webp',target);
 await sharp(input).resize({width:1080,withoutEnlargement:true}).webp({quality:85}).toFile(fileURLToPath(dest));
 console.log(`${item.name}: ${meta.width}x${meta.height}; ${Math.round((await stat(dest)).size/1024)} kB`);
}
