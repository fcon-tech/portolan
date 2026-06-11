#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const bundleQuery = require('./bundle-query');

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

const repoRoots = bundleQuery.loadRepoRoots(bundlePath);

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);

  if (url.pathname.startsWith('/api/')) {
    try {
      const result = bundleQuery.handleHttpPath(url.pathname, url.searchParams, bundlePath);
      if (!result) {
        sendJson(res, 404, { error: 'unknown api path' });
        return;
      }
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 500, { error: err.message || 'query failed' });
    }
    return;
  }

  if (url.pathname === '/source') {
    const filePath = bundleQuery.resolveSourcePath(url.searchParams.get('path') || '', repoRoots);
    if (!filePath) {
      sendJson(res, 403, { error: 'forbidden or not found' });
      return;
    }
    try {
      const line = url.searchParams.get('line') || '1';
      const body = bundleQuery.readSourceSnippet(filePath, line);
      sendJson(res, 200, body);
    } catch {
      sendJson(res, 500, { error: 'read failed' });
    }
    return;
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
  if (url.pathname === '/bundle/hotspots-full.jsonl') {
    return sendFile(path.join(bundlePath, 'hotspots-full.jsonl'), res);
  }
  if (url.pathname === '/bundle/landscape-card.json') {
    return sendFile(path.join(bundlePath, 'landscape-card.json'), res);
  }
  if (url.pathname === '/bundle/landscape-report.json') {
    return sendFile(path.join(bundlePath, 'landscape-report.json'), res);
  }
  if (url.pathname === '/bundle/search-index.jsonl') {
    return sendFile(path.join(bundlePath, 'search-index.jsonl'), res);
  }
  if (url.pathname === '/bundle/symbol-index.jsonl') {
    return sendFile(path.join(bundlePath, 'symbol-index.jsonl'), res);
  }
  if (url.pathname === '/bundle/map-bridge/evidence-index.jsonl') {
    return sendFile(path.join(bundlePath, 'map-bridge', 'evidence-index.jsonl'), res);
  }
  if (url.pathname === '/bundle/repo-profiles.json') {
    return sendFile(path.join(bundlePath, 'repo-profiles.json'), res);
  }
  if (url.pathname === '/bundle/relationships.jsonl') {
    return sendFile(path.join(bundlePath, 'relationships.jsonl'), res);
  }
  if (url.pathname === '/bundle/claims.jsonl') {
    return sendFile(path.join(bundlePath, 'claims.jsonl'), res);
  }
  if (url.pathname === '/bundle/claims-import-report.json') {
    return sendFile(path.join(bundlePath, 'claims-import-report.json'), res);
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
