/**
 * C4 family assignment + family metadata. Pure functions.
 * Single responsibility: assign a deterministic C4 family to a component from
 * its role/kind, using the spec's priority order (Feature 3: C4 View).
 *
 * Priority order (when multiple rules match): data-systems > compute-processing
 * > platform-governance > packaging-runtime > coordination-community >
 * integration-services > unknown.
 */
'use strict';

const C4_FAMILY_RULES = [
  {
    family: 'data-systems',
    roles: [
      'storage', 'database', 'warehouse', 'filesystem', 'metastore',
      'indexing', 'query', 'data-serving', 'distributed-nosql-store',
      'sql-warehouse', 'distributed-filesystem', 'search-index',
      'data-warehouse', 'data-lake',
    ],
    kinds: ['storage', 'database'],
  },
  {
    family: 'compute-processing',
    roles: [
      'batch', 'stream', 'workflow', 'scheduler', 'engine', 'execution',
      'transformation', 'job', 'stream-batch-processing', 'distributed-compute',
      'batch-processing', 'workflow-orchestration',
    ],
    kinds: ['processing', 'compute'],
  },
  {
    family: 'platform-governance',
    roles: [
      'security', 'policy', 'release', 'governance', 'observability',
      'compatibility', 'enterprise-control', 'security-governance',
      'coordinator', 'cluster-coordinator',
    ],
    kinds: ['security', 'governance'],
  },
  {
    family: 'packaging-runtime',
    roles: [
      'package-build', 'distribution', 'image', 'deploy', 'runtime',
      'installer', 'environment', 'packaging', 'build-runtime-support',
      'daemon-service-support', 'runtime-support', 'version-selection',
    ],
    kinds: ['package', 'deployment', 'runtime', 'packaging'],
  },
  {
    family: 'coordination-community',
    roles: [
      'coordination', 'registry', 'community', 'mailing-list',
      'contribution', 'project-governance', 'ecosystem-integrator',
    ],
    kinds: ['coordinator'],
  },
  {
    family: 'integration-services',
    roles: [
      'connector', 'plugin', 'adapter', 'client', 'api', 'gateway',
      'integration', 'legacy-rdbms-hadoop-transfer', 'service',
    ],
    kinds: ['integration', 'service'],
  },
];

const FAMILY_META = {
  'data-systems': {
    display_name: 'Data systems',
    purpose: 'Storage, database, warehouse, filesystem, metastore, and data-serving roles.',
    grouping_reason:
      'Components with storage/database/warehouse/indexing/query/data-serving roles.',
  },
  'compute-processing': {
    display_name: 'Compute / processing',
    purpose: 'Batch, stream, workflow, scheduler, engine, and execution roles.',
    grouping_reason:
      'Components with batch/stream/workflow/scheduler/engine/execution roles.',
  },
  'platform-governance': {
    display_name: 'Platform / governance',
    purpose: 'Security, policy, release, governance, observability, and compatibility roles.',
    grouping_reason:
      'Components with security/policy/release/governance/observability/compatibility roles.',
  },
  'packaging-runtime': {
    display_name: 'Packaging / runtime',
    purpose: 'Package build, distribution, image, deploy, runtime, and installer roles.',
    grouping_reason:
      'Components with package-build/distribution/image/deploy/runtime/installer roles.',
  },
  'coordination-community': {
    display_name: 'Coordination / community',
    purpose: 'Coordination services, registries, community, and project-governance surfaces.',
    grouping_reason:
      'Components with coordination/registry/community/contribution/governance roles.',
  },
  'integration-services': {
    display_name: 'Integration / services',
    purpose: 'Connectors, plugins, adapters, clients, APIs, and cross-system integration.',
    grouping_reason:
      'Components with connector/plugin/adapter/client/api/integration roles.',
  },
  'unknown': {
    display_name: 'Unclassified',
    purpose: 'Components with insufficient local evidence for a confident C4 family.',
    grouping_reason: 'No local role/kind signal matched a known C4 family.',
  },
};

function normalizeRole(role) {
  return String(role || '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
}

function assignC4Family(target) {
  const role = normalizeRole((target && target.role));
  const kind = String((target && target.kind) || '').toLowerCase();
  // Direct role/kind match in priority order.
  for (const rule of C4_FAMILY_RULES) {
    if (rule.roles.includes(role) || rule.kinds.includes(kind)) {
      return rule.family;
    }
  }
  // Substring fallback: role contains a family keyword.
  for (const rule of C4_FAMILY_RULES) {
    for (const kw of rule.roles) {
      if (role.includes(kw)) return rule.family;
    }
  }
  return 'unknown';
}

module.exports = { C4_FAMILY_RULES, FAMILY_META, normalizeRole, assignC4Family };
