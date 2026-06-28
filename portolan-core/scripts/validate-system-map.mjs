#!/usr/bin/env node
/**
 * Thin CLI validator for a generated system-map.json.
 * Layer 1: JSON Schema (ajv 2020-12) against schema/system-map.schema.json.
 * Layer 2: semantic invariants via domain/atlas-validate (canonical).
 * Composition root — schema lives in <repo-root>/schema. Exits 1 on any failure.
 *
 * Usage: node validate-system-map.mjs <system-map.json>
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validateSystemMap } = require('../src/domain/atlas-validate.js');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function makeAjv() {
  try {
    const mod = require('ajv/dist/2020');
    const Ajv2020 = mod.default || mod;
    return new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  } catch (e) {
    const Ajv = require('ajv');
    return new Ajv({ allErrors: true, schemaId: 'auto', validateSchema: false, unknownFormats: 'ignore' });
  }
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function main() {
  const mapPath = process.argv[2];
  if (!mapPath) {
    console.error('usage: validate-system-map.mjs <system-map.json>');
    process.exit(2);
  }
  const root = path.resolve(__dirname, '..', '..');

  const errors = [];

  let systemMap;
  try {
    systemMap = readJSON(mapPath);
  } catch (e) {
    console.error('validate-system-map: cannot read/parse ' + mapPath + ': ' + e.message);
    process.exit(1);
  }

  // Layer 1: JSON Schema.
  try {
    const schema = readJSON(path.join(root, 'schema', 'system-map.schema.json'));
    const ajv = makeAjv();
    const validate = ajv.compile(schema);
    const ok = validate(systemMap);
    if (!ok) {
      for (const err of validate.errors || []) {
        errors.push('schema: ' + (err.instancePath || '/') + ' ' + err.message);
      }
    }
  } catch (e) {
    errors.push('schema load error: ' + e.message);
  }

  // Layer 2: semantic invariants (canonical domain module).
  const semantic = validateSystemMap(systemMap);
  errors.push.apply(errors, semantic.errors);

  if (errors.length > 0) {
    for (const e of errors) console.error('validate-system-map: ' + e);
    process.exit(1);
  }
  console.error('validate-system-map: ok (' + path.resolve(mapPath) + ')');
}

main();
