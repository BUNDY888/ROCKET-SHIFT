/**
 * Убирает фон у фото-значка виджета.
 * node scripts/process-widget-photo.mjs src/assets/widget-billy.png purple
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = process.argv[2] ?? 'src/assets/widget-arnold.png';
const mode = process.argv[3] ?? 'light';
const input = path.isAbsolute(rel) ? rel : path.join(root, rel);
const tempOut = `${input}.processed.png`;

function isBackgroundPixel(r, g, b, a) {
  if (a < 8) return true;
  if (mode === 'purple') {
    const max = Math.max(r, g, b);
    if (max < 40) return true;
    if (b > 90 && b >= r - 25 && b > g + 35) return true;
    if (r > 70 && b > 90 && g < Math.min(r, b) - 25) return true;
    if (b > 140 && b > r + 15 && b > g + 50) return true;
    return false;
  }
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  if (max >= 198 && sat <= 38) return true;
  if (max >= 155 && sat <= 28) return true;
  return false;
}

function markBackgroundByFlood(data, w, h) {
  const bg = new Uint8Array(w * h);
  const q = [];

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (bg[p]) return;
    const i = p * 4;
    if (!isBackgroundPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) return;
    bg[p] = 1;
    q.push(p);
  };

  for (let x = 0; x < w; x++) {
    tryPush(x, 0);
    tryPush(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    tryPush(0, y);
    tryPush(w - 1, y);
  }

  while (q.length > 0) {
    const p = q.pop();
    const x = p % w;
    const y = (p - x) / w;
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }

  for (let p = 0; p < w * h; p++) {
    if (bg[p]) data[p * 4 + 3] = 0;
  }
}

if (!fs.existsSync(input)) {
  console.error('File not found:', input);
  process.exit(1);
}

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

markBackgroundByFlood(data, info.width, info.height);

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  if (a > 0 && isBackgroundPixel(r, g, b, a)) data[i + 3] = 0;
}

const trimmed = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim({ threshold: 12 })
  .png()
  .toBuffer();

const meta = await sharp(trimmed).metadata();
const maxH = 480;
const maxW = 360;
const scale = Math.min(maxW / meta.width, maxH / meta.height, 1);

await sharp(trimmed)
  .resize(Math.round(meta.width * scale), Math.round(meta.height * scale), {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9 })
  .toFile(tempOut);

fs.renameSync(tempOut, input);
console.log('Saved:', input, `(${mode})`);
