#!/usr/bin/env node
/**
 * Thin CLI validator for atlas producer artifacts against harness contracts.
 * Validates atlas-surfaces.json, atlas-facts.json, atlas-surface-content.json
 * against the draft 2020-12 schemas in <repo-root>/harness/contracts. Exits 1
 * on any failure. Composition root (schema files live in the repo root).
 *
 * Usage: node validate-atlas-schemas.mjs <bundle-dir>
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
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
  const bundleDir = process.argv[2];
  if (!bundleDir) {
    console.error('usage: validate-atlas-schemas.mjs <bundle-dir>');
    process.exit(2);
  }
  const root = path.resolve(__dirname, '..', '..');
  const contractsDir = path.join(root, 'harness', 'contracts');

  const schemaFiles = [
    'atlas-surfaces.schema.json',
    'atlas-facts.schema.json',
    'atlas-surface-content.schema.json',
  ];

  const ajv = makeAjv();
  for (const schemaFile of schemaFiles) {
    const schema = readJSON(path.join(contractsDir, schemaFile));
    ajv.addSchema(schema, schemaFile);
  }

  const validations = [
    ['atlas-surfaces.schema.json', 'atlas-surfaces.json'],
    ['atlas-facts.schema.json', 'atlas-facts.json'],
    ['atlas-surface-content.schema.json', 'atlas-surface-content.json'],
  ];

  let failed = false;
  for (const [schemaFile, artifactFile] of validations) {
    const artifactPath = path.join(bundleDir, artifactFile);
    const validate = ajv.getSchema(schemaFile);
    if (!validate) {
      console.error(`validate-atlas-schemas: schema not loaded: ${schemaFile}`);
      failed = true;
      continue;
    }
    const ok = validate(readJSON(artifactPath));
    if (!ok) {
      failed = true;
      console.error(`validate-atlas-schemas: ${artifactFile} does not match ${schemaFile}`);
      for (const err of validate.errors || []) {
        console.error(`  ${err.instancePath || '/'} ${err.message}`);
      }
    }
  }

  if (failed) process.exit(1);
  console.error(`validate-atlas-schemas: ok (${path.resolve(bundleDir)})`);
}

main();
