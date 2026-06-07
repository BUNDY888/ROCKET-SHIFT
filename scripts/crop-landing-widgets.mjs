/**
 * Обрезает скрин виджета на обоях — только плитка, фон прозрачный.
 * node scripts/crop-landing-widgets.mjs landing/screenshots/raw/widget-127.png landing/screenshots/widget-127.png
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function isBackgroundPixel(r, g, b, a) {
  if (a < 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  // Обои — светлый беж/серый
  if (max >= 150 && sat <= 48) return true;
  if (max >= 115 && sat <= 32) return true;
  // Тень под плиткой на стене
  if (max >= 65 && max <= 145 && sat <= 28) return true;
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

  while (q.length) {
    const p = q.pop();
    const x = p % w;
    const y = (p - x) / w;
    tryPush(x - 1, y);
    tryPush(x + 1, y);
    tryPush(x, y - 1);
    tryPush(x, y + 1);
  }

  for (let p = 0; p < w * h; p++) {
    if (bg[p]) data[p * 4 + 3] = 0;
  }
}

async function cropWidgetTile(inputPath, outputPath) {
  const input = path.isAbsolute(inputPath) ? inputPath : path.join(root, inputPath);
  const output = path.isAbsolute(outputPath) ? outputPath : path.join(root, outputPath);

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  markBackgroundByFlood(data, info.width, info.height);

  const trimmed = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 8 })
    .png()
    .toBuffer();

  fs.mkdirSync(path.dirname(output), { recursive: true });
  await sharp(trimmed).png({ compressionLevel: 9 }).toFile(output);

  const meta = await sharp(output).metadata();
  console.log(`OK ${path.basename(output)} (${meta.width}x${meta.height})`);
}

const pairs = process.argv.slice(2);
if (pairs.length >= 2 && pairs.length % 2 === 0) {
  for (let i = 0; i < pairs.length; i += 2) {
    await cropWidgetTile(pairs[i], pairs[i + 1]);
  }
} else {
  console.error('Usage: node scripts/crop-landing-widgets.mjs in.png out.png [in2 out2 ...]');
  process.exit(1);
}
