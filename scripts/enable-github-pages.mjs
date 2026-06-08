import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const deployConfig = JSON.parse(
  fs.readFileSync(path.join(root, 'landing', 'deploy.json'), 'utf8'),
);
const [owner, repoName] = deployConfig.repo.split('/');

function resolveToken() {
  const fromEnv = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (fromEnv) {
    return fromEnv;
  }
  const remote = spawnSync('git', ['remote', 'get-url', 'origin'], {
    cwd: root,
    encoding: 'utf8',
  });
  const url = (remote.stdout || '').trim();
  const match = url.match(/(?:https:\/\/)(ghp_[^@]+)@/);
  return match?.[1] || null;
}

async function github(method, apiPath, body) {
  const token = resolveToken();
  if (!token) {
    throw new Error('No GitHub token (GITHUB_TOKEN or git remote URL)');
  }
  const response = await fetch(`https://api.github.com${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GitHub API ${method} ${apiPath} -> ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

const payload = {
  build_type: 'legacy',
  source: {
    branch: 'main',
    path: '/docs',
  },
};

let pages;
try {
  pages = await github('GET', `/repos/${owner}/${repoName}/pages`);
} catch {
  pages = null;
}

if (pages?.html_url) {
  if (pages.source?.path === '/docs' && pages.source?.branch === 'main') {
    console.log(`GitHub Pages already enabled: ${pages.html_url}`);
    process.exit(0);
  }
  const updated = await github('PUT', `/repos/${owner}/${repoName}/pages`, payload);
  console.log(`GitHub Pages updated: ${updated.html_url}`);
} else {
  const created = await github('POST', `/repos/${owner}/${repoName}/pages`, payload);
  console.log(`GitHub Pages enabled: ${created.html_url}`);
}
