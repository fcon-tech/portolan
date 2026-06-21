#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const bundleDir = process.argv[2];
if (!bundleDir) {
  console.error('usage: validate-atlas-schemas.js <bundle-dir>');
  process.exit(2);
}

const root = path.resolve(__dirname, '..', '..');
const contractsDir = path.join(root, 'harness', 'contracts');

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const schemaFiles = [
  'atlas-surfaces.schema.json',
  'atlas-facts.schema.json',
  'atlas-surface-content.schema.json',
];

function makeAjv() {
  try {
    const mod = require('ajv/dist/2020');
    const Ajv2020 = mod.default || mod;
    return new Ajv2020({
      allErrors: true,
      strict: false,
      validateFormats: false,
    });
  } catch {
    const Ajv = require('ajv');
    return new Ajv({
      allErrors: true,
      schemaId: 'auto',
      validateSchema: false,
      unknownFormats: 'ignore',
    });
  }
}

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

if (failed) {
  process.exit(1);
}

console.error(`validate-atlas-schemas: ok (${path.resolve(bundleDir)})`);
