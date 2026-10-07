import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root = fileURLToPath(new URL('../', import.meta.url));
const excluded = new Set(['docs','node_modules','templates','components','social-media-agent','server','tests','tmp','coverage','production-release-v2','test-results','playwright-report','buildartefacts','tmp_email_previews']);
async function files(dir) {
  const result=[];
  for (const entry of await fs.readdir(dir,{withFileTypes:true})) {
    if(entry.name.startsWith('.')||excluded.has(entry.name))continue;
    const p=path.join(dir,entry.name);
    if(entry.isDirectory())result.push(...await files(p));
    else if(/\.html?$/i.test(entry.name))result.push(p);
  }
  return result;
}
const metadata = new Map(); let changed=0, images=0;
for(const file of await files(root)) {
  const html=await fs.readFile(file,'utf8'); let after='', cursor=0;
  for(const match of html.matchAll(/<img\b[^>]*>/gi)) {
    let tag=match[0]; const src=tag.match(/\bsrc="([^"]+)"/)?.[1];
    if(src && (!/\bwidth=/.test(tag)||!/\bheight=/.test(tag)) && !/^(?:https?:|data:|blob:)/i.test(src)) {
      const clean=decodeURIComponent(src.split(/[?#]/)[0]);
      const asset=clean.startsWith('/')?path.join(root,clean.slice(1)):path.resolve(path.dirname(file),clean);
      if(asset.startsWith(root)) {
        try {
          if(!metadata.has(asset))metadata.set(asset,await sharp(asset).metadata());
          const meta=metadata.get(asset);
          if(meta.width&&meta.height) {
            if(!/\bwidth=/.test(tag))tag=tag.replace(/\s*\/?>$/,` width="${meta.width}">`);
            if(!/\bheight=/.test(tag))tag=tag.replace(/\s*\/?>$/,` height="${meta.height}">`);
            images++;
          }
        } catch { /* Dynamic or unsupported source: leave its layout unchanged. */ }
      }
    }
    after+=html.slice(cursor,match.index)+tag;cursor=match.index+match[0].length;
  }
  after+=html.slice(cursor);
  if(after!==html){await fs.writeFile(file,after);changed++;}
}
console.log(`Image dimensions: ${images} images updated in ${changed} pages.`);
