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
const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`viewer build missing: ${indexPath}`);
  console.error('Run from the installed portolan-viewer.sh wrapper or run `node scripts/build-static.js` in viewer/.');
  process.exit(2);
}
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

  if (url.pathname === '/favicon.ico') {
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname === '/source') {
    const sourceRoots = url.searchParams.get('repo')
      ? bundleQuery.loadRepoRoots(bundlePath, url.searchParams.get('repo'))
      : repoRoots;
    const filePath = bundleQuery.resolveSourcePath(url.searchParams.get('path') || '', sourceRoots);
    if (!filePath) {
      sendJson(res, 403, { error: 'forbidden or not found' });
      return;
    }
    try {
      const line = url.searchParams.get('line') || '1';
      const body = bundleQuery.readSourceSnippet(filePath, line);
      if ((url.searchParams.get('format') || '').toLowerCase() === 'json') {
        sendJson(res, 200, body);
      } else {
        sendSourceHtml(res, body);
      }
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
    return sendDownloadOnlyFile(path.join(bundlePath, 'hotspots-full.jsonl'), url, res);
  }
  if (url.pathname === '/bundle/landscape-card.json') {
    return sendFile(path.join(bundlePath, 'landscape-card.json'), res);
  }
  if (url.pathname === '/bundle/landscape-report.json') {
    return sendFile(path.join(bundlePath, 'landscape-report.json'), res);
  }
  if (url.pathname === '/bundle/search-index.jsonl') {
    return sendDownloadOnlyFile(path.join(bundlePath, 'search-index.jsonl'), url, res);
  }
  if (url.pathname === '/bundle/symbol-index.jsonl') {
    return sendDownloadOnlyFile(path.join(bundlePath, 'symbol-index.jsonl'), url, res);
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
    return sendOptionalFile(path.join(bundlePath, 'claims.jsonl'), res, '');
  }
  if (url.pathname === '/bundle/claims-import-report.json') {
    return sendOptionalFile(path.join(bundlePath, 'claims-import-report.json'), res, '{}');
  }
  if (url.pathname === '/bundle/atlas-surfaces.json') {
    return sendOptionalFile(path.join(bundlePath, 'atlas-surfaces.json'), res, '{}');
  }
  if (url.pathname === '/bundle/atlas-facts.json') {
    return sendOptionalFile(path.join(bundlePath, 'atlas-facts.json'), res, '{}');
  }
  if (url.pathname === '/bundle/atlas-surface-content.json') {
    return sendOptionalFile(path.join(bundlePath, 'atlas-surface-content.json'), res, '{}');
  }
  if (url.pathname === '/bundle/captain-handoff.json') {
    return sendOptionalFile(path.join(bundlePath, 'captain-handoff.json'), res, '{}');
  }
  if (url.pathname === '/bundle/captain-handoff.md') {
    return sendOptionalFile(path.join(bundlePath, 'captain-handoff.md'), res, '');
  }
  if (url.pathname === '/bundle/promotion-health.jsonl') {
    return sendOptionalFile(path.join(bundlePath, 'promotion-health.jsonl'), res, '');
  }
  if (url.pathname === '/bundle/promoted-facts.jsonl') {
    return sendDownloadOnlyOptionalFile(path.join(bundlePath, 'promoted-facts.jsonl'), url, res, '');
  }
  if (url.pathname === '/bundle/raw-artifacts.jsonl') {
    return sendDownloadOnlyOptionalFile(path.join(bundlePath, 'raw-artifacts.jsonl'), url, res, '');
  }
  if (url.pathname === '/bundle/classified-sources.jsonl') {
    return sendDownloadOnlyOptionalFile(path.join(bundlePath, 'classified-sources.jsonl'), url, res, '');
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

function sendDownloadOnlyFile(filePath, url, res) {
  if (!isExplicitDownload(url)) {
    return sendJson(res, 403, {
      error: 'explicit download required',
      hint: 'Use ?download=1 for raw bundle files, or use /api/* for bounded viewer queries.',
    });
  }
  sendFileDownload(filePath, res);
}

function sendDownloadOnlyOptionalFile(filePath, url, res, fallback) {
  if (!isExplicitDownload(url)) {
    return sendJson(res, 403, {
      error: 'explicit download required',
      hint: 'Use ?download=1 for raw bundle files, or use /api/* for bounded viewer queries.',
    });
  }
  sendOptionalFileDownload(filePath, res, fallback);
}

function isExplicitDownload(url) {
  return url.searchParams.get('download') === '1';
}

function sendFileDownload(filePath, res) {
  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'text/plain',
      'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
      'Content-Length': stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

function sendOptionalFile(filePath, res, fallback) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
      return res.end(fallback);
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });
}

function sendOptionalFileDownload(filePath, res, fallback) {
  fs.stat(filePath, (err, stat) => {
    const ext = path.extname(filePath);
    const headers = {
      'Content-Type': mime[ext] || 'text/plain',
      'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
    };
    if (err) {
      res.writeHead(200, headers);
      return res.end(fallback);
    }
    headers['Content-Length'] = stat.size;
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

function sendSourceHtml(res, body) {
  const rows = body.lines.map((line) => `
    <tr class="${line.highlight ? 'is-highlight' : ''}">
      <th>${line.no}</th>
      <td><code>${escapeHtml(line.text)}</code></td>
    </tr>
  `).join('');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Portolan source snippet</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #101114; color: #ededed; }
    header { position: sticky; top: 0; padding: 16px 18px; background: rgba(16,17,20,.94); border-bottom: 1px solid rgba(255,255,255,.1); }
    strong { display: block; font-size: 14px; font-weight: 650; overflow-wrap: anywhere; }
    span { color: #9fa3b6; font-size: 12px; }
    main { padding: 16px; }
    table { width: 100%; border-collapse: collapse; font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    th { width: 58px; padding: 0 12px 0 0; color: #777d94; text-align: right; user-select: none; vertical-align: top; }
    td { padding: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    tr.is-highlight th, tr.is-highlight td { background: rgba(245,166,35,.16); color: #fff7df; }
    tr.is-highlight th { color: #f5a623; }
  </style>
</head>
<body>
  <header>
    <strong>${escapeHtml(body.path)}</strong>
    <span>lines ${body.startLine}-${body.endLine} of ${body.totalLines}; selected line ${body.line}</span>
  </header>
  <main><table><tbody>${rows}</tbody></table></main>
</body>
</html>`);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

server.listen(port, '127.0.0.1', () => {
  console.log(`Portolan viewer: http://127.0.0.1:${port}/`);
  console.log(`Bundle: ${bundlePath}`);
});
