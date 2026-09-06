#!/usr/bin/env bun
/**
 * External-consumer acceptance — openspec/changes/formats-pass, task 6.2
 * (specs/formats/spec.md, "A non-MCP consumer obtains and validates the
 * export"; design D6: consumable without the MCP server).
 *
 * This script is the bet's proof, written as a consumer would write it: it
 * imports NOTHING from `core/src` — only the schema files (the contracts)
 * and ajv from node_modules, wired exactly as `docs/formats.md` prescribes
 * (draft 2020-12, strict, `version` registered as a keyword, the trust
 * vocabulary registered before compiling the graph export). It obtains the
 * adjacency document the no-server way — `portolan export` as a subprocess
 * — then validates it and asserts the self-description: the format name
 * and the schema version the document was produced against, the version
 * read from the schema file itself (design D1).
 *
 * Exit 0 means: schemas + docs alone consume the export. Any other outcome
 * exits nonzero naming what failed. An optional target — the province root
 * — is taken from argv[2]; the default is this repository's own province.
 * The repo root (dispatcher location and default target) is resolved from
 * this file's own location, never from the working directory, so the
 * script runs identically from a clean directory.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020";
import trustVocabulary from "../core/schema/trust-vocabulary.schema.json";
import graphExport from "../core/schema/graph-export.schema.json";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const targetRoot = process.argv[2] ?? REPO_ROOT;

function fail(message: string): never {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

// 1. Obtain the document through the CLI — the path a consumer without the
// server takes (docs/formats.md: "No server is needed").
const dispatcher = join(REPO_ROOT, "core", "src", "bin", "portolan.ts");
const run = spawnSync(process.execPath, [dispatcher, "export", "--target", targetRoot], {
  encoding: "utf8",
});
if (run.error !== undefined) {
  fail(`the portolan CLI could not be launched: ${run.error.message}`);
}
if (run.status !== 0) {
  fail(`portolan export exited ${run.status}: ${(run.stderr ?? "").trim()}`);
}

// 2. Parse the document.
let doc: unknown;
try {
  doc = JSON.parse(run.stdout);
} catch (e) {
  fail(`portolan export did not print JSON: ${(e as Error).message}`);
}

// 3. Validate — the docs/formats.md registration, verbatim in wiring:
// strict draft 2020-12, `version` as a keyword, trust vocabulary by $id.
const ajv = new Ajv2020();
ajv.addKeyword("version"); // the schemas' own version annotation — unknown to strict ajv
ajv.addSchema(trustVocabulary); // $ref'd by $id; register it before compiling
const validate = ajv.compile(graphExport);
if (!validate(doc)) {
  fail(
    `the export does not validate against graph-export.schema.json:\n` +
      ajv.errorsText(validate.errors, { separator: "\n  " }),
  );
}

// 4. The self-description: the format a consumer dispatches on, and the
// schema version the document names — the schema file's own `version`
// (design D1: the version lives in the schema file).
const schema = graphExport as { version: string; properties: { format: { const: string } } };
const self = doc as { format: string; version: string; nodes: unknown[]; edges: unknown[] };
if (self.format !== schema.properties.format.const) {
  fail(`the document names format ${JSON.stringify(self.format)}, expected ${schema.properties.format.const}`);
}
if (self.version !== schema.version) {
  fail(`the document names schema version ${self.version}, expected the schema file's ${schema.version}`);
}

console.log(
  `ok: ${self.nodes.length} nodes, ${self.edges.length} edges — ` +
    `format ${self.format} v${self.version} validates against the schemas alone ` +
    `(graph-export ${schema.version} + trust-vocabulary ${trustVocabulary.version}), no core source imported`,
);
