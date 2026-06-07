import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import rcedit from 'rcedit';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const exe = path.join(root, 'release', 'win-unpacked', 'Rocket Shift.exe');
const ico = path.join(root, 'build', 'icon.ico');

if (!fs.existsSync(exe)) {
  console.error('Build exe first: npm run build:dir');
  process.exit(1);
}
if (!fs.existsSync(ico)) {
  console.error('Generate icon first: npm run generate:icon');
  process.exit(1);
}

await rcedit(exe, {
  icon: ico,
  'version-string': {
    FileDescription: 'Rocket Shift',
    ProductName: 'Rocket Shift',
    InternalFilename: 'Rocket Shift',
    OriginalFilename: 'Rocket Shift.exe',
  },
});

const bundledIco = path.join(root, 'release', 'win-unpacked', 'app-icon.ico');
fs.copyFileSync(ico, bundledIco);
console.log('Icon applied to:', exe);
console.log('Bundled shortcut icon:', bundledIco);
