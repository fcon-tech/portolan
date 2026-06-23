#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const [bundleDirArg, outDirArg] = process.argv.slice(2);

if (!bundleDirArg || !outDirArg) {
  console.error('usage: scripts/export-bigtop-gh-pages-demo.mjs <bigtop-bundle-dir> <docs/site/bigtop/data>');
  process.exit(2);
}

const bundleDir = path.resolve(bundleDirArg);
const outDir = path.resolve(outDirArg);

function readJson(file, fallback = null) {
  const fp = path.join(bundleDir, file);
  if (!fs.existsSync(fp)) return fallback;
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function readJsonl(file, limit = Infinity) {
  const fp = path.join(bundleDir, file);
  if (!fs.existsSync(fp)) return [];
  const rows = [];
  const text = fs.readFileSync(fp, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      continue;
    }
    if (rows.length >= limit) break;
  }
  return rows;
}

function sanitizeText(value) {
  if (typeof value !== 'string') return value;
  return value
    .replaceAll('/home/fall_out_bug/projects/bigtop-landscape/repos/', '')
    .replaceAll('/home/fall_out_bug/projects/bigtop-landscape/', '')
    .replaceAll('/tmp/portolan-bigtop-20260623-full-proof/', '')
    .replaceAll('/tmp/', '')
    .replaceAll('/home/fall_out_bug/', '');
}

function sanitizeDeep(value) {
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (!value || typeof value !== 'object') return sanitizeText(value);
  return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, sanitizeDeep(val)]));
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function roleGroup(role = '') {
  const normalized = role.toLowerCase();
  if (/(workflow|stream|compute|batch|orchestration)/.test(normalized)) return 'compute';
  if (/(nosql|warehouse|storage|filesystem|cache|search|data|sql)/.test(normalized)) return 'data';
  if (/(governance|security|platform|integrator|infra)/.test(normalized)) return 'platform';
  if (/(coordination|resource|scheduler|management)/.test(normalized)) return 'control';
  return 'service';
}

function publicComponent(component) {
  const counts = component.counts || {};
  const profile = component.profile || {};
  return sanitizeDeep({
    id: component.target_id || component.id,
    label: component.label || component.target_id || component.id,
    repo_id: component.repo_id || '',
    role: component.role || 'component',
    group: roleGroup(component.role || ''),
    lifecycle: component.lifecycle || '',
    summary: component.summary || '',
    files: num(profile.file_count),
    findings: num(counts.findings),
    medium: num(counts.severities?.medium),
    info: num(counts.severities?.info),
    relationships: num(counts.relationship_records),
    manifest_in: num(counts.inbound_manifest_deps),
    manifest_out: num(counts.outbound_manifest_deps),
    languages: (profile.primary_languages || []).slice(0, 5),
    surfaces: (component.surface_routes || []).map((surface) => ({
      label: surface.label,
      state: surface.state,
      kind: surface.kind,
      url: surface.url,
      evidence_state: surface.evidence_state,
    })),
    signals: component.signals || {},
    top_findings: (component.top_findings || []).slice(0, 6).map((finding) => ({
      id: finding.id,
      kind: finding.kind,
      severity: finding.severity,
      summary: finding.summary,
      evidence_state: finding.evidence_state,
    })),
    inbound_targets: (component.inbound_targets || []).slice(0, 16),
    outbound_targets: (component.outbound_targets || []).slice(0, 16),
  });
}

const atlasFacts = readJson('atlas-facts.json', {});
const manifest = readJson('manifest.json', {});
const landscapeReport = readJson('landscape-report.json', {});
const components = (atlasFacts.components || [])
  .map(publicComponent)
  .sort((a, b) => b.files - a.files);

const componentByRepo = new Map(components.map((component) => [component.repo_id, component]));
const relationships = readJsonl('relationships.jsonl')
  .filter((relationship) => Array.isArray(relationship.repos) && relationship.repos.length > 1)
  .map((relationship) => ({
    id: relationship.id,
    type: relationship.type,
    summary: sanitizeText(relationship.summary || ''),
    component: relationship.detail?.component || '',
    repo_ids: relationship.repos,
    repos: relationship.repos
      .map((repoId) => componentByRepo.get(repoId)?.id || repoId)
      .filter(Boolean),
    labels: relationship.repos
      .map((repoId) => componentByRepo.get(repoId)?.label)
      .filter(Boolean),
    count: relationship.repos.length,
    evidence_state: relationship.evidence_state || '',
    producer: relationship.producer || '',
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 80);

const hotspots = readJsonl('hotspots.jsonl', 160).map((hotspot) => sanitizeDeep({
  id: hotspot.id,
  kind: hotspot.kind,
  severity: hotspot.severity,
  summary: hotspot.summary,
  repo_id: hotspot.repo_id,
  path: hotspot.paths?.[0] || hotspot.path || '',
  line: hotspot.line || hotspot.locations?.[0]?.line || null,
  evidence_state: hotspot.evidence_state,
  producer: hotspot.producer,
}));

const totals = components.reduce(
  (acc, component) => {
    acc.files += component.files;
    acc.findings += component.findings;
    acc.medium += component.medium;
    acc.relationship_records += component.relationships;
    if (component.surfaces.some((surface) => surface.state === 'missing')) acc.components_with_missing_surface += 1;
    return acc;
  },
  {
    repos: components.length,
    files: 0,
    findings: 0,
    medium: 0,
    relationship_records: 0,
    components_with_missing_surface: 0,
  },
);

const groups = components.reduce((acc, component) => {
  acc[component.group] = (acc[component.group] || 0) + 1;
  return acc;
}, {});

const demo = sanitizeDeep({
  schema_version: '0.1.0',
  generated_at: new Date().toISOString(),
  source_bundle: path.basename(bundleDir),
  title: 'Apache Bigtop landscape atlas',
  subtitle: 'A public Portolan demo over a large OSS ecosystem: repositories, roles, shared dependencies, risk signals, and drill-down paths.',
  totals,
  groups,
  narrative: [
    {
      title: 'Bigtop behaves like a platform portfolio, not one repository.',
      body: 'The atlas separates ecosystem integrator, compute engines, data systems, coordination services, and governance surfaces so a captain can inspect the shape before reading code.',
    },
    {
      title: 'Shared dependencies are the clearest cross-repo connective tissue.',
      body: 'The demo highlights high-fanout libraries such as jackson-databind, guava, commons-cli, jetty-server, and slf4j-api as navigation anchors across the landscape.',
    },
    {
      title: 'Unknown runtime topology remains visible.',
      body: 'Static evidence can map repositories, manifests, configuration, docs, trackers, and duplicated/debt-prone files. Live deployment, secrets, vendor config, and runtime calls are intentionally marked as unknown here.',
    },
  ],
  components,
  relationships,
  hotspots,
  report_sections: (landscapeReport.sections || []).slice(0, 8).map((section) => ({
    id: section.id,
    title: section.title,
    summary: section.summary || section.body || '',
  })),
  manifest: {
    generated_at: manifest.generated_at || '',
    source: manifest.source || '',
    schema_version: manifest.schema_version || '',
  },
});

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'bigtop-demo.json'), `${JSON.stringify(demo, null, 2)}\n`);

const serialized = fs.readFileSync(path.join(outDir, 'bigtop-demo.json'), 'utf8');
const forbidden = ['/home/fall_out_bug', '/tmp/', 'projects/bigtop-landscape'];
const leaked = forbidden.filter((needle) => serialized.includes(needle));
if (leaked.length) {
  console.error(`refusing to export demo with leaked local paths: ${leaked.join(', ')}`);
  process.exit(1);
}

console.log(`exported ${components.length} components, ${relationships.length} relationships, ${hotspots.length} hotspots to ${outDir}`);
