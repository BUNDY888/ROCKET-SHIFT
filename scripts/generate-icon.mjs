import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(root, 'build');
const publicDir = path.join(root, 'public');
const sourcePath = path.join(buildDir, 'icon-source.png');
const outLogo = path.join(buildDir, 'rocket-logo.png');
const outPng = path.join(buildDir, 'icon.png');
const outIco = path.join(buildDir, 'icon.ico');
const publicLogo = path.join(publicDir, 'rocket-logo.png');
const appLogo = path.join(root, 'src', 'assets', 'rocket-logo.png');
const cli = path.join(root, 'node_modules', 'png2icons', 'png2icons-cli.js');

function isRocketLine(r, g, b, a) {
  if (a < 16) return false;
  return r >= 190 && g >= 190 && b >= 190;
}

async function buildTransparentRocket(maxSize = 512) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error('Missing build/icon-source.png');
  }

  const { data, info } = await sharp(sourcePath)
    .resize(maxSize, maxSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (!isRocketLine(r, g, b, data[i + 3])) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    } else {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
}

function buildIco(pngPath) {
  const outBase = path.join(buildDir, '_icon_tmp');
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
  fs.mkdirSync(buildDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  const rocket = await buildTransparentRocket(512);
  fs.writeFileSync(outLogo, rocket);
  fs.writeFileSync(outPng, rocket);
  fs.writeFileSync(publicLogo, rocket);
  fs.mkdirSync(path.dirname(appLogo), { recursive: true });
  fs.writeFileSync(appLogo, rocket);
  fs.writeFileSync(outIco, buildIco(outPng));

  await sharp(rocket).resize(16, 16).png().toFile(path.join(buildDir, 'tray-16.png'));
  await sharp(rocket).resize(32, 32).png().toFile(path.join(buildDir, 'tray-32.png'));

  console.log('OK', outLogo, publicLogo, outIco);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
