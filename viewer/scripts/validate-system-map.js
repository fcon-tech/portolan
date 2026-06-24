#!/usr/bin/env node
/**
 * CLI validator for a generated Portolan system map.
 *
 * Two layers:
 *  1. JSON Schema validation against schema/system-map.schema.json (ajv 2020-12).
 *  2. Semantic checks (delegated to system-map/validate.js): the invariants
 *     JSON Schema cannot express.
 *
 * Exits 1 on any failure.
 */
const fs = require('fs');
const path = require('path');
const { validateSystemMap } = require('./system-map/validate');

const mapPath = process.argv[2];
if (!mapPath) {
  console.error('usage: validate-system-map.js <system-map.json>');
  process.exit(2);
}

const root = path.resolve(__dirname, '..', '..');

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function makeAjv() {
  try {
    const mod = require('ajv/dist/2020');
    const Ajv2020 = mod.default || mod;
    return new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  } catch {
    const Ajv = require('ajv');
    return new Ajv({ allErrors: true, schemaId: 'auto', validateSchema: false, unknownFormats: 'ignore' });
  }
}

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

// Layer 2: semantic invariants (shared, unit-tested module).
const semantic = validateSystemMap(systemMap);
errors.push.apply(errors, semantic.errors);

if (errors.length > 0) {
  for (const e of errors) {
    console.error('validate-system-map: ' + e);
  }
  process.exit(1);
}

console.error('validate-system-map: ok (' + path.resolve(mapPath) + ')');
