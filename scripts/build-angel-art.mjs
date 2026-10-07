import fs from 'node:fs/promises';
import sharp from 'sharp';

const names = ['abundance','guidance','healing','love','nature','peace','purpose','strength','back'];
await fs.mkdir('img/atlas/angels-v1', { recursive:true });
const tiles = [];
for (let index = 0; index < names.length; index++) {
  const name = names[index];
  const target = `img/atlas/angels-v1/${name}.webp`;
  await sharp(`docs/tarot-deck-v2/angel-art-v1/${name}.png`)
    .resize(600,1000,{fit:'contain',background:'#0b1929'})
    .webp({quality:85}).toFile(target);
  const metadata = await sharp(target).metadata();
  if (metadata.width !== 600 || metadata.height !== 1000) throw new Error(`Invalid dimensions: ${name}`);
  tiles.push({ input:await sharp(target).resize(180,300).png().toBuffer(), left:(index%3)*188, top:Math.floor(index/3)*308 });
}
await sharp({create:{width:564,height:924,channels:3,background:'#0b1929'}})
  .composite(tiles).png().toFile('docs/visual-legacy-review/angel-art-contact-sheet.png');
console.log('Verified 9 angel assets at 600x1000.');
