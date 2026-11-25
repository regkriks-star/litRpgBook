import assert from 'node:assert/strict';
import { closeSync, openSync, readSync, readdirSync, statSync } from 'node:fs';
import { assets } from '../src/assets';
import { blessingFrames, drinkingFrames, familyFrames, gateFrames, mouseHeroFrames, tavernServiceFrames } from '../src/ChapterFourArt';
import { duelFrames, templeCastFrames, templeHeroFrames, closeFrames, contactFrames } from '../src/ChapterFiveArt';
import { cityLifeFrames } from '../src/ChapterThreeArt';

function webpSize(file: string): [number, number] {
  const handle = openSync(file, 'r');
  const header = Buffer.alloc(30);
  try { readSync(handle, header, 0, header.length, 0); } finally { closeSync(handle); }
  assert(header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP', `Not a WebP: ${file}`);
  const chunk = header.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return [1 + header.readUIntLE(24, 3), 1 + header.readUIntLE(27, 3)];
  if (chunk === 'VP8 ') {
    assert(header[23] === 0x9d && header[24] === 0x01 && header[25] === 0x2a, `Bad VP8 frame: ${file}`);
    return [header.readUInt16LE(26) & 0x3fff, header.readUInt16LE(28) & 0x3fff];
  }
  if (chunk === 'VP8L') {
    assert(header[20] === 0x2f, `Bad VP8L frame: ${file}`);
    const bits = header.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  throw new Error(`Unsupported WebP chunk ${chunk}: ${file}`);
}

const paths = new Set<string>();
let bytes = 0;
for (const [id, asset] of Object.entries(assets)) {
  assert(!paths.has(asset.path), `Duplicate resource: ${asset.path}`);
  paths.add(asset.path);
  const file = `public/art/${asset.path}`;
  bytes += statSync(file).size;
  const [width, height] = webpSize(file);
  if ('size' in asset) assert.deepEqual([width, height], asset.size, id);
  if ('grid' in asset) assert.deepEqual([width, height], [asset.grid[0] * asset.cell[0], asset.grid[1] * asset.cell[1]], id);
}
for (const path of readdirSync('public/art', { recursive: true })) {
  if (String(path).endsWith('.webp')) assert(paths.has(String(path)), `Unregistered asset: ${path}`);
}
for (const [art, frames] of [['ichiroFamily', familyFrames], ['machLadyMouse', mouseHeroFrames], ['machBlessing', blessingFrames], ['gateReactions', gateFrames], ['tavernDrinking', drinkingFrames], ['tavernService', tavernServiceFrames], ['cityLife', cityLifeFrames], ['chapterFiveDuel', duelFrames], ['chapterFiveCast', templeCastFrames], ['machTemple', templeHeroFrames], ['chapterFiveClose', closeFrames], ['machMageContact', contactFrames]] as const) {
  const asset = assets[art];
  const [sheetW, sheetH] = 'size' in asset ? asset.size : [asset.grid[0] * asset.cell[0], asset.grid[1] * asset.cell[1]];
  for (const [x, y, w, h, ax, ay, scale] of frames) {
    assert(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= sheetW && y + h <= sheetH, `${art}: frame outside source`);
    assert(ax >= x && ax <= x + w && ay >= y && ay <= y + h && scale > 0, `${art}: invalid anchor`);
  }
}
console.log(`${paths.size} WebP assets verified; ${(bytes / 1024 / 1024).toFixed(2)} MiB`);
