import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const landingDir = path.join(root, 'landing');
const deployConfig = JSON.parse(
  fs.readFileSync(path.join(landingDir, 'deploy.json'), 'utf8'),
);
const { repo, tag, installerName } = deployConfig;
const [owner, repoName] = repo.split('/');
const installerPath = path.join(root, 'release', installerName);
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    ...opts,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

function runCapture(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    shell: false,
    ...opts,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}\n${result.stderr || ''}`);
  }
  return (result.stdout || '').trim();
}

function resolveGit() {
  const localGit = path.join(root, '.tools', 'MinGit', 'cmd', 'git.exe');
  if (fs.existsSync(localGit)) {
    return localGit;
  }
  const bundled = spawnSync(
    'powershell',
    ['-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'scripts', 'ensure-mingit.ps1')],
    { cwd: root, encoding: 'utf8' },
  );
  const fromScript = (bundled.stdout || '').trim().split(/\r?\n/).pop();
  if (fromScript && fs.existsSync(fromScript)) {
    return fromScript;
  }
  return 'git';
}

async function githubRequest(method, apiPath, { json, rawBody, headers = {} } = {}) {
  if (!token) {
    throw new Error('GITHUB_TOKEN is not set');
  }
  const response = await fetch(`https://api.github.com${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...headers,
    },
    body: json ? JSON.stringify(json) : rawBody,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${method} ${apiPath} -> ${response.status}: ${text}`);
  }
  const type = response.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

async function ensureRelease(installerFile) {
  let release;
  try {
    release = await githubRequest('GET', `/repos/${repo}/releases/tags/${tag}`);
  } catch {
    release = await githubRequest('POST', `/repos/${repo}/releases`, {
      json: {
        tag_name: tag,
        name: `Rocket Shift ${deployConfig.tag.replace(/^v/, '')} beta`,
        body: 'Windows installer. Beta — бесплатно. Вопросы: rocketshiftapp@gmail.com',
        draft: false,
        prerelease: true,
      },
    });
  }

  const assets = await githubRequest('GET', `/repos/${repo}/releases/${release.id}/assets`);
  const existing = assets.find((asset) => asset.name === installerName);
  if (existing) {
    await githubRequest('DELETE', `/repos/${repo}/releases/assets/${existing.id}`);
  }

  const uploadUrl = `https://uploads.github.com/repos/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(installerName)}`;
  const body = fs.readFileSync(installerFile);
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(body.length),
    },
    body,
  });
  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`Upload failed: ${uploadResponse.status}: ${text}`);
  }

  return release.html_url;
}

function pushWithGit(gitExe) {
  const remote = `https://${token}@github.com/${repo}.git`;
  if (!fs.existsSync(path.join(root, '.git'))) {
    run(gitExe, ['init', '-b', 'main']);
  }
  run(gitExe, ['config', 'user.email', 'rocketshiftapp@gmail.com']);
  run(gitExe, ['config', 'user.name', 'Rocket Shift']);
  run(gitExe, ['add', '-A']);
  const status = runCapture(gitExe, ['status', '--porcelain']);
  if (status) {
    run(gitExe, ['commit', '-m', 'Rocket Shift 1.0.0 beta']);
  }
  const removeRemote = spawnSync(gitExe, ['remote', 'remove', 'origin'], {
    cwd: root,
    stdio: 'ignore',
  });
  void removeRemote;
  run(gitExe, ['remote', 'add', 'origin', remote]);
  run(gitExe, ['push', '-u', 'origin', 'main', '--force']);
}

console.log('1/3 Preparing landing site...');
run(process.execPath, ['scripts/prepare-landing-deploy.mjs', '--site-only']);

if (!fs.existsSync(installerPath)) {
  console.error(`Installer missing: ${installerPath}`);
  console.error('Run: npm run build:installer');
  process.exit(1);
}

if (!token) {
  console.error('');
  console.error('Need GitHub token to push code and create Release.');
  console.error('Create one: https://github.com/settings/tokens/new');
  console.error('Scope: repo (full control of private repositories)');
  console.error('');
  console.error('Then in PowerShell:');
  console.error('  $env:GITHUB_TOKEN="ghp_..."');
  console.error('  npm run publish:beta');
  process.exit(1);
}

const gitExe = resolveGit();
console.log('2/3 Pushing code to GitHub...');
pushWithGit(gitExe);

console.log('3/3 Uploading installer to GitHub Release...');
const releaseUrl = await ensureRelease(installerPath);

console.log('');
console.log('Done.');
console.log(`Repo: https://github.com/${repo}`);
console.log(`Release: ${releaseUrl}`);
console.log(`Download: https://github.com/${repo}/releases/download/${tag}/${installerName}`);
console.log('');
console.log('Next: upload landing-site/ to Cloudflare Pages (Upload assets).');
console.log('Folder: ' + path.join(root, 'landing-site'));
