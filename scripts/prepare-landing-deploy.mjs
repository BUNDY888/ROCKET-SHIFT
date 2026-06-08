import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const landingDir = path.join(root, 'landing');
const downloadDir = path.join(landingDir, 'download');
const docsMode = process.argv.includes('--docs');
const siteOnly = process.argv.includes('--site-only') || docsMode;
const siteOutDir = docsMode ? path.join(root, 'docs') : path.join(root, 'landing-site');

const deployConfig = JSON.parse(
  fs.readFileSync(path.join(landingDir, 'deploy.json'), 'utf8'),
);
const { repo, tag, installerName, customDomain } = deployConfig;
const installerSrc = path.join(root, 'release', installerName);
const downloadUrl = `https://github.com/${repo}/releases/download/${tag}/${installerName}`;

const requiredScreenshots = [
  'main-dashboard.png',
  'histogram.png',
  'tasks.png',
  'focus.png',
  'goals.png',
  'month.png',
  'week.png',
  'close-day.png',
  'desktop.png',
  'widget-icons.png',
  'widget-14.png',
  'widget-28.png',
  'widget-55.png',
  'widget-127.png',
];

const skipWhenCopyingSite = new Set(['download']);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function checkFile(relPath) {
  const full = path.join(landingDir, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing landing asset: landing/${relPath}`);
  }
}

function copyLandingSite() {
  if (fs.existsSync(siteOutDir)) {
    fs.rmSync(siteOutDir, { recursive: true, force: true });
  }

  function copyDir(src, dest) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      if (skipWhenCopyingSite.has(entry.name)) {
        continue;
      }
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyDir(landingDir, siteOutDir);
  fs.writeFileSync(path.join(siteOutDir, '.nojekyll'), '');
  if (customDomain) {
    fs.writeFileSync(path.join(siteOutDir, 'CNAME'), `${customDomain}\n`);
  }
}

checkFile('assets/rocket-logo.png');
for (const name of requiredScreenshots) {
  checkFile(path.join('screenshots', name));
}

if (siteOnly) {
  copyLandingSite();
  console.log('OK landing site ready (no installer)');
  console.log(`Output folder: ${docsMode ? 'docs/' : 'landing-site/'}`);
  console.log(`Download button points to: ${downloadUrl}`);
  if (docsMode) {
    const siteUrl = customDomain ? `https://${customDomain}/` : `https://github.com/${repo}/`;
    console.log(`Site URL: ${siteUrl}`);
    console.log('Commit docs/ and push to main — Pages serves /docs automatically.');
  } else {
    console.log('Create GitHub Release first if the download link returns 404.');
  }
  process.exit(0);
}

ensureDir(downloadDir);

if (!fs.existsSync(installerSrc)) {
  console.error(`Installer not found: ${installerSrc}`);
  console.error('Run: npm run build:installer');
  process.exit(1);
}

const installerDest = path.join(downloadDir, installerName);
fs.copyFileSync(installerSrc, installerDest);

const sizeMb = (fs.statSync(installerDest).size / (1024 * 1024)).toFixed(1);
console.log('OK landing ready for deploy (with local installer copy)');
console.log(`Installer: landing/download/${installerName} (${sizeMb} MB)`);
console.log(`Public download URL: ${downloadUrl}`);

