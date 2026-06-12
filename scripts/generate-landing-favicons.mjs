import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const landingDir = path.join(root, 'landing');
const sourceLogo = path.join(landingDir, 'assets', 'rocket-logo.png');
const cli = path.join(root, 'node_modules', 'png2icons', 'png2icons-cli.js');

/** Purple zone color from app scale (72%+). */
const CIRCLE_FILL = '#8e24aa';
const ROCKET_RATIO = 0.58;

function isRocketLine(r, g, b, a) {
  if (a < 16) return false;
  return r >= 190 && g >= 190 && b >= 190;
}

/** White rocket outline on transparent background (source PNG has black fill). */
async function extractRocketOutline(pixelSize) {
  const { data, info } = await sharp(sourceLogo)
    .resize(pixelSize, pixelSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isRocketLine(r, g, b, data[i + 3])) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    } else {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function buildSquareIcon(size) {
  const radius = size / 2;
  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${radius}" cy="${radius}" r="${radius}" fill="${CIRCLE_FILL}"/>
    </svg>`,
  );

  const rocketSize = Math.round(size * ROCKET_RATIO);
  const rocket = await extractRocketOutline(rocketSize);

  return sharp(circleSvg)
    .composite([{ input: rocket, gravity: 'center' }])
    .png()
    .toBuffer();
}

function buildIco(pngPath) {
  const outBase = path.join(landingDir, '_favicon_tmp');
  execFileSync(process.execPath, [cli, pngPath, outBase, '-icop', '-i'], {
    cwd: root,
    stdio: 'pipe',
  });
  const icoPath = `${outBase}.ico`;
  const buf = fs.readFileSync(icoPath);
  fs.unlinkSync(icoPath);
  return buf;
}

async function main() {
  if (!fs.existsSync(sourceLogo)) {
    throw new Error(`Missing ${sourceLogo}`);
  }

  const tmp256 = path.join(landingDir, '_favicon-256.png');
  const icon256 = await buildSquareIcon(256);
  fs.writeFileSync(tmp256, icon256);
  fs.writeFileSync(path.join(landingDir, 'favicon.ico'), buildIco(tmp256));

  const sizes = [
    ['favicon-16x16.png', 16],
    ['favicon-32x32.png', 32],
    ['favicon-192x192.png', 192],
    ['apple-touch-icon.png', 180],
  ];

  for (const [name, size] of sizes) {
    const buf = await buildSquareIcon(size);
    fs.writeFileSync(path.join(landingDir, name), buf);
  }

  fs.unlinkSync(tmp256);
  console.log('OK landing favicons generated');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
