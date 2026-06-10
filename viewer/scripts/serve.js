#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const args = process.argv.slice(2);
let bundlePath = '';
let port = 4173;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--bundle' && args[i + 1]) {
    bundlePath = path.resolve(args[++i]);
  } else if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[++i], 10);
  }
}

if (!bundlePath || !fs.existsSync(bundlePath)) {
  console.error('usage: npm run serve -- --bundle <bundle-dir> [--port 4173]');
  process.exit(2);
}

const distDir = path.join(__dirname, '..', 'dist');
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.jsonl': 'application/json',
};

let repoRoots = [];
function loadRepoRoots() {
  const reposFile = path.join(bundlePath, 'repos.json');
  if (!fs.existsSync(reposFile)) return [];
  try {
    const repos = JSON.parse(fs.readFileSync(reposFile, 'utf8'));
    return repos.map((r) => path.resolve(r.path));
  } catch {
    return [];
  }
}
repoRoots = loadRepoRoots();

function isPathUnderRoot(filePath, root) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(filePath);
  return resolved === resolvedRoot || resolved.startsWith(resolvedRoot + path.sep);
}

function isUnderRepoRoot(filePath) {
  const resolved = path.resolve(filePath);
  return repoRoots.some((root) => isPathUnderRoot(resolved, root));
}

function isReadableRepoFile(filePath) {
  let stats;
  try {
    stats = fs.lstatSync(filePath);
  } catch {
    return false;
  }
  if (stats.isSymbolicLink()) return false;
  if (!stats.isFile()) return false;
  let realPath;
  try {
    realPath = fs.realpathSync(filePath);
  } catch {
    return false;
  }
  return isUnderRepoRoot(realPath);
}

function resolveSourcePath(requestPath) {
  if (!requestPath || typeof requestPath !== 'string') return null;
  const raw = requestPath.trim();
  if (!raw || raw.includes('\0')) return null;

  if (path.isAbsolute(raw)) {
    const resolved = path.resolve(raw);
    if (!isUnderRepoRoot(resolved)) return null;
    return isReadableRepoFile(resolved) ? resolved : null;
  }

  for (const root of repoRoots) {
    const candidate = path.resolve(root, raw);
    if (!isPathUnderRoot(candidate, root)) continue;
    if (isReadableRepoFile(candidate)) {
      return candidate;
    }
  }
  return null;
}

function readSourceSnippet(filePath, lineNum) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const total = lines.length;
  const center = Math.min(Math.max(parseInt(lineNum, 10) || 1, 1), total || 1);
  const radius = 20;
  const start = Math.max(1, center - radius);
  const end = Math.min(total, center + radius);
  const snippet = [];
  for (let i = start; i <= end; i++) {
    snippet.push({
      no: i,
      text: lines[i - 1] ?? '',
      highlight: i === center,
    });
  }
  return { path: filePath, line: center, startLine: start, endLine: end, totalLines: total, lines: snippet };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);

  if (url.pathname === '/source') {
    const filePath = resolveSourcePath(url.searchParams.get('path') || '');
    if (!filePath) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'forbidden or not found' }));
    }
    try {
      const line = url.searchParams.get('line') || '1';
      const body = readSourceSnippet(filePath, line);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(body));
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'read failed' }));
    }
  }

  if (url.pathname === '/bundle/manifest.json') {
    return sendFile(path.join(bundlePath, 'manifest.json'), res);
  }
  if (url.pathname === '/bundle/hotspots.jsonl') {
    return sendFile(path.join(bundlePath, 'hotspots.jsonl'), res);
  }
  if (url.pathname === '/bundle/gaps.jsonl') {
    return sendFile(path.join(bundlePath, 'gaps.jsonl'), res);
  }
  if (url.pathname === '/bundle/graph-slice.json') {
    return sendFile(path.join(bundlePath, 'graph-slice.json'), res);
  }
  if (url.pathname === '/bundle/repos.json') {
    return sendFile(path.join(bundlePath, 'repos.json'), res);
  }

  const distResolved = path.resolve(distDir) + path.sep;
  let filePath = path.resolve(
    distDir,
    url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '')
  );
  if (!filePath.startsWith(distResolved)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  sendFile(filePath, res);
});

function sendFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });
}

server.listen(port, '127.0.0.1', () => {
  console.log(`Portolan viewer: http://127.0.0.1:${port}/`);
  console.log(`Bundle: ${bundlePath}`);
});
