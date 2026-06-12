import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const landingDir = path.join(root, 'landing');
const sourceLogo = path.join(landingDir, 'assets', 'rocket-logo.png');
const cli = path.join(root, 'node_modules', 'png2icons', 'png2icons-cli.js');

/** Rocket outline only — transparent background, no solid square. */
async function buildSquareIcon(size) {
  return sharp(sourceLogo)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
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
