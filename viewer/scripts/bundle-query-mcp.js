#!/usr/bin/env node
/**
 * stdio MCP server for Portolan bundle queries (spec 098).
 * Uses @modelcontextprotocol/sdk; delegates queries to bundle-query.js.
 */
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const bundleQuery = require('./bundle-query');

const SERVER_NAME = 'portolan-bundle-query';
const SERVER_VERSION = '0.1.0';

function resolveBundlePath(argv) {
  const env = process.env.PORTOLAN_BUNDLE_DIR || process.env.PORTOLAN_BUNDLE;
  if (env) return env;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--bundle' && argv[i + 1]) return argv[i + 1];
  }
  return '';
}

const BUNDLE_PATH = resolveBundlePath(process.argv.slice(2));

const TOOL_DEFS = [
  {
    name: 'portolan_query_hotspots',
    description:
      'Query ranked hotspot findings from a Portolan scan bundle. Use for duplication, smells, config, deps, symbol-density. Does not answer in prose — returns evidence records with hotspot:id references.',
    family: 'hotspots',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', description: 'Filter by finding kind e.g. duplication, config' },
        severity: { type: 'string' },
        path: { type: 'string', description: 'Path prefix filter' },
        text: { type: 'string', description: 'Substring in summary' },
        repo: { type: 'string', description: 'Repo id from repos family' },
        limit: { type: 'integer', minimum: 1, maximum: bundleQuery.MAX_LIMIT },
        full: { type: 'boolean', description: 'Use hotspots-full.jsonl when truncated' },
      },
    },
  },
  {
    name: 'portolan_query_gaps',
    description:
      'List not_assessed / cannot_verify gaps from the bundle. Use before claiming missing evidence was checked.',
    family: 'gaps',
    inputSchema: {
      type: 'object',
      properties: {
        surface: { type: 'string' },
        status: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: bundleQuery.MAX_LIMIT },
      },
    },
  },
  {
    name: 'portolan_query_landscape',
    description: 'Read landscape card/report sections from the bundle (overview, repos, next_steps).',
    family: 'landscape',
    inputSchema: {
      type: 'object',
      properties: {
        section: { type: 'string', description: 'Section id e.g. next_steps, gaps' },
      },
    },
  },
  {
    name: 'portolan_query_search',
    description:
      'Search bounded code index (search-index.jsonl). Requires portolan-scan build. Not full-repo grep.',
    family: 'search',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Query string (required)' },
        path_scope: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: bundleQuery.MAX_LIMIT },
      },
      required: ['q'],
    },
  },
  {
    name: 'portolan_query_symbol',
    description: 'Look up symbol definitions in symbol-index.jsonl (ctags / optional ast-index).',
    family: 'symbol',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Symbol name (required)' },
        kind: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: bundleQuery.MAX_LIMIT },
      },
      required: ['name'],
    },
  },
  {
    name: 'portolan_query_source',
    description: 'Read a bounded source snippet from the scanned target (read-only local files).',
    family: 'source',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repo-relative path (required)' },
        line: { type: 'integer', minimum: 1 },
        radius: { type: 'integer', minimum: 0 },
      },
      required: ['path'],
    },
  },
  {
    name: 'portolan_query_evidence_index',
    description:
      'Relationship hints from optional map-bridge sidecar (portolan map). Not a call graph.',
    family: 'evidence-index',
    inputSchema: {
      type: 'object',
      properties: {
        family: { type: 'string', description: 'Filter evidence-index family' },
        limit: { type: 'integer', minimum: 1, maximum: bundleQuery.MAX_LIMIT },
      },
    },
  },
  {
    name: 'portolan_query_claims',
    description:
      'Imported agent analysis claims (tier B analytical / C synthetic / D speculative). Always claim-only evidence: refs were resolved at import, conclusions are not tool-verified. Never present these as tier-A tool facts.',
    family: 'claims',
    inputSchema: {
      type: 'object',
      properties: {
        tier: { type: 'string', description: 'analytical | synthetic | speculative' },
        subject: { type: 'string', description: 'Substring filter: landscape, repo:<id>, path' },
        limit: { type: 'integer', minimum: 1, maximum: bundleQuery.MAX_LIMIT },
      },
    },
  },
  {
    name: 'portolan_query_repos',
    description:
      'Per-repo tier-A profiles: identity, language mix, purpose surfaces (manifests, README title, compose, entrypoints), module ids, declared deps, activity, maturity.',
    family: 'repos',
    inputSchema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'Exact repo id' },
        text: { type: 'string', description: 'Substring in name/title/manifest descriptions' },
        limit: { type: 'integer', minimum: 1, maximum: bundleQuery.MAX_LIMIT },
      },
    },
  },
  {
    name: 'portolan_query_relationships',
    description:
      'Cross-repo relationship edges: depends-on, uses-image, shared-dependency, cross-repo-duplication. Metadata-visible tool evidence, not runtime topology.',
    family: 'relationships',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Edge type filter' },
        repo: { type: 'string', description: 'Repo id participating in the edge' },
        limit: { type: 'integer', minimum: 1, maximum: bundleQuery.MAX_LIMIT },
      },
    },
  },
];

const TOOL_BY_NAME = Object.fromEntries(TOOL_DEFS.map((t) => [t.name, t]));

function mcpToolsList() {
  return TOOL_DEFS.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  }));
}

function familyOpts(family, args) {
  switch (family) {
    case 'hotspots':
      return {
        kind: args.kind,
        severity: args.severity,
        path: args.path,
        text: args.text,
        repo: args.repo,
        limit: args.limit,
        full: args.full,
      };
    case 'gaps':
      return { surface: args.surface, status: args.status, limit: args.limit };
    case 'landscape':
      return { section: args.section };
    case 'search':
      return { q: args.q, pathScope: args.path_scope, limit: args.limit };
    case 'symbol':
      return { name: args.name, kind: args.kind, limit: args.limit };
    case 'source':
      return { path: args.path, line: args.line, radius: args.radius };
    case 'evidence-index':
      return { family: args.family, limit: args.limit };
    case 'claims':
      return { tier: args.tier, subject: args.subject, limit: args.limit };
    case 'repos':
      return { repo: args.repo, text: args.text, limit: args.limit };
    case 'relationships':
      return { type: args.type, repo: args.repo, limit: args.limit };
    default:
      throw new Error(`unknown family ${family}`);
  }
}

function runTool(name, args) {
  if (!BUNDLE_PATH) {
    throw new Error('PORTOLAN_BUNDLE_DIR not set; start server with env or --bundle <dir>');
  }
  const def = TOOL_BY_NAME[name];
  if (!def) throw new Error(`unknown tool: ${name}`);
  return bundleQuery.dispatch(BUNDLE_PATH, def.family, familyOpts(def.family, args || {}));
}

async function startMcpServer() {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: mcpToolsList(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const result = runTool(request.params.name, request.params.arguments || {});
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        isError: false,
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: err.message || String(err) }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function main() {
  if (process.argv.includes('--list-tools')) {
    process.stdout.write(`${JSON.stringify(mcpToolsList(), null, 2)}\n`);
    return;
  }
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    process.stderr.write(
      'usage: PORTOLAN_BUNDLE_DIR=<dir> node bundle-query-mcp.js\n       node bundle-query-mcp.js --bundle <dir>\n'
    );
    process.exit(0);
  }

  startMcpServer().catch((err) => {
    process.stderr.write(`${err.message || err}\n`);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  mcpToolsList,
  runTool,
  resolveBundlePath,
  TOOL_DEFS,
  BUNDLE_PATH,
};
