#!/usr/bin/env node
/**
 * In-process MCP smoke: spawn bundle-query-mcp.js and call one tool.
 */
const { spawn } = require('child_process');
const path = require('path');

function rpc(id, method, params) {
  return JSON.stringify({ jsonrpc: '2.0', id, method, params });
}

function notification(method, params) {
  return JSON.stringify({ jsonrpc: '2.0', method, params });
}

function runSmoke(bundleDir) {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'bundle-query-mcp.js');
    const child = spawn(process.execPath, [serverPath], {
      env: { ...process.env, PORTOLAN_BUNDLE_DIR: bundleDir },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
    });

    const send = (line) => {
      child.stdin.write(`${line}\n`);
    };

    send(
      rpc(1, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'portolan-mcp-smoke', version: '0.1.0' },
      })
    );
    send(notification('notifications/initialized', {}));
    send(rpc(2, 'tools/list', {}));
    send(
      rpc(3, 'tools/call', {
        name: 'portolan_query_hotspots',
        arguments: { kind: 'duplication', limit: 3 },
      })
    );
    child.stdin.end();

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`mcp server exited ${code}`));
        return;
      }
      const lines = stdout.trim().split('\n').filter(Boolean);
      const responses = lines.map((l) => JSON.parse(l));
      const init = responses.find((r) => r.id === 1);
      const list = responses.find((r) => r.id === 2);
      const call = responses.find((r) => r.id === 3);
      if (!init?.result?.serverInfo?.name) {
        reject(new Error('initialize failed'));
        return;
      }
      if (!list?.result?.tools?.length) {
        reject(new Error('tools/list empty'));
        return;
      }
      const text = call?.result?.content?.[0]?.text;
      if (!text) {
        reject(new Error('tools/call missing content'));
        return;
      }
      const payload = JSON.parse(text);
      if (!payload.schema_version || !Array.isArray(payload.records)) {
        reject(new Error('invalid bundle-query result'));
        return;
      }
      resolve(payload);
    });
  });
}

if (require.main === module) {
  const bundle = process.argv[2];
  if (!bundle) {
    process.stderr.write('usage: node bundle-query-mcp-smoke-client.js <bundle-dir>\n');
    process.exit(2);
  }
  runSmoke(bundle)
    .then(() => {
      process.stdout.write('bundle-query-mcp-smoke-client: ok\n');
    })
    .catch((err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
}

module.exports = { runSmoke };
