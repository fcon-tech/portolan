#!/usr/bin/env node
/**
 * Build-time validator for the semantic component investigation contract
 * (captain-atlas 17).
 *
 * Loads a semantic-investigation fixture + its source-card registry, verifies
 * that every curated-note source card points at a REAL checked-in note file
 * (offline resolvability — "the model knows this" is not an invisible source),
 * then delegates to the pure domain validator.
 *
 * Fails (exit 1) on any contract violation. This is the gate that prevents
 * curated-knowledge claims without a resolvable source card, the all-not_assessed
 * escape hatch, <5 concepts, <2 risks, a missing bidirectional overlap pair,
 * etc.
 *
 * Usage: node scripts/validate-semantic-investigation.mjs --input <si.json> [--sources-dir <dir>]
 *   --input       semantic-investigation JSON (the producer-compatible shape)
 *   --sources-dir directory containing sources.json + notes/ (default: input dir)
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validateShape, resolveSourceRef } = require('../src/domain/semantic-investigation');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input' && argv[i + 1]) args.input = path.resolve(argv[++i]);
    else if (a === '--sources-dir' && argv[i + 1]) args.sourcesDir = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.input) {
    console.error('usage: validate-semantic-investigation.mjs --input <si.json> [--sources-dir <dir>]');
    process.exit(args.help ? 0 : 2);
  }
  if (!fs.existsSync(args.input)) {
    console.error(`error: input not found: ${args.input}`);
    process.exit(1);
  }
  let si;
  try {
    si = JSON.parse(fs.readFileSync(args.input, 'utf8'));
  } catch (e) {
    console.error(`error: input is not valid JSON: ${args.input}: ${e.message}`);
    process.exit(1);
  }

  // Resolve the source-card registry + load it into the object so the domain
  // validator's resolveSourceRef can resolve source:<id> refs.
  const sourcesDir = args.sourcesDir || path.dirname(args.input);
  const sourcesPath = si.sources_ref ? path.join(sourcesDir, si.sources_ref) : path.join(sourcesDir, 'sources.json');
  if (!fs.existsSync(sourcesPath)) {
    console.error(`error: source-card registry not found: ${sourcesPath}`);
    process.exit(1);
  }
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
  } catch (e) {
    console.error(`error: source-card registry is not valid JSON: ${sourcesPath}: ${e.message}`);
    process.exit(1);
  }
  si.sources = registry.sources || [];

  // Offline verification that every curated-note card points at a REAL local
  // file. This is the doc-17 rule: curated claims must link to a resolvable
  // source card; a curated note is only resolvable if the note actually exists.
  const missingNotes = [];
  for (const card of si.sources) {
    if (card.kind === 'curated-note' && card.note_path) {
      const noteAbs = path.join(sourcesDir, card.note_path);
      if (!fs.existsSync(noteAbs)) missingNotes.push({ id: card.id, note_path: card.note_path });
    }
  }
  if (missingNotes.length) {
    console.error('error: curated-note source cards point at missing local notes:');
    for (const m of missingNotes) console.error(`  - ${m.id} -> ${m.note_path}`);
    process.exit(1);
  }

  // Run the pure domain validator.
  const violations = validateShape(si);
  if (violations.length) {
    console.error(`\n${violations.length} semantic-investigation violation(s):`);
    for (const v of violations) {
      const at = v.componentId ? ` [${v.componentId}]` : '';
      console.error(`  ✗ ${v.code}${at}: ${v.message}`);
    }
    process.exit(1);
  }

  // Report a compact resolvability summary for each curated claim.
  let curated = 0, resolved = 0;
  for (const c of si.components || []) {
    for (const claim of iterClaims(c)) {
      if (claim.source_boundary === 'curated-knowledge') {
        curated++;
        if (resolveSourceRef(si, claim.source_ref).resolves) resolved++;
      }
    }
  }
  console.error(`semantic-investigation: VALID (${si.components.length} components, ${si.sample.components.length} selected, ${resolved}/${curated} curated claims resolvable)`);
  process.exit(0);
}

function* iterClaims(component) {
  if (component.purpose) yield { source_boundary: component.purpose.source_boundary, source_ref: component.purpose.source_ref };
  for (const c of component.capabilities || []) yield { source_boundary: c.source_boundary, source_ref: c.source_ref };
  for (const c of component.internal_concepts || []) yield { source_boundary: c.source_boundary, source_ref: c.source_ref };
  for (const r of component.risks || []) yield { source_boundary: r.source_boundary, source_ref: r.source_ref };
  for (const s of component.integration_surfaces || []) yield { source_boundary: s.source_boundary, source_ref: s.evidence_ref || s.source_ref };
  for (const rel of component.semantic_relations || []) yield { source_boundary: rel.source_boundary, source_ref: rel.source_ref };
}

main();
