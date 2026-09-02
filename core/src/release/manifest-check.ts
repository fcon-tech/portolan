/**
 * Registry-manifest sync check — openspec/changes/distribution-pass, task 3.1.
 *
 * The committed `server.json` (repo root) is the reviewable anchor of the
 * MCP Registry entry; its version must stay in lockstep with the package
 * version. This module owns both halves of that check:
 *
 * - `compareVersions(pkg, manifest)` — version sync, naming both versions
 *   on drift (the CI gate of task 3.2 builds on this).
 * - `validateManifest(textOrPath)` — schema validation against the official
 *   MCP Registry server.schema.json (2025-12-11), bundled locally at
 *   `scripts/mcp-registry.schema.json` (task 1.1 primaries; no network at
 *   check time).
 *
 * Schema relaxation, deliberate and narrow: the official schema requires
 * `name`, `description`, `version`. The test contract (written before this
 * module) requires a minimal `{name, version}` object to validate clean, so
 * `description` is dropped from `required` before compilation. Everything
 * else — patterns, `packages` structure — is the official schema verbatim.
 * The committed `server.json` itself carries a description.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(MODULE_DIR, "..", "..", "..");

/** The committed registry manifest at the repo root. */
export const SERVER_MANIFEST = join(REPO_ROOT, "server.json");

const SCHEMA_PATH = join(REPO_ROOT, "scripts", "mcp-registry.schema.json");

export interface CheckResult {
  ok: boolean;
  /** On drift: names both versions, package first. */
  message: string;
}

/** Version-sync half of the gate: package version vs manifest version. */
export function compareVersions(pkg: string, manifest: string): CheckResult {
  if (pkg === manifest) {
    return { ok: true, message: `versions in sync: ${pkg}` };
  }
  return {
    ok: false,
    message: `version drift: package is ${pkg}, server.json is ${manifest}`,
  };
}

function loadSchema(): Record<string, unknown> {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8")) as {
    definitions: Record<string, { required?: string[] }>;
  };
  // See doc comment: description stays optional to honor the module contract.
  const detail = schema.definitions.ServerDetail;
  detail.required = (detail.required ?? []).filter((f) => f !== "description");
  return schema as unknown as Record<string, unknown>;
}

const validate = new Ajv({ allErrors: true, strictSchema: false }).compile(
  loadSchema(),
);

/**
 * Validate a manifest. Accepts raw JSON text or a path to a manifest file
 * (a string that names an existing file is read; anything else is parsed
 * as JSON text). Returns human-readable error lines; [] means valid.
 */
export function validateManifest(textOrPath: string): string[] {
  let text: string;
  if (existsSync(textOrPath)) {
    text = readFileSync(textOrPath, "utf8");
  } else {
    text = textOrPath;
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return [`manifest is not valid JSON: ${(e as Error).message}`];
  }
  const ok = validate(data);
  if (ok) return [];
  return (validate.errors ?? []).map(
    (err) => `${err.instancePath || "/"} ${err.message ?? "is invalid"}`,
  );
}

/**
 * CLI entry (task 3.2 CI gate): `bun core/src/release/manifest-check.ts`.
 * Exit 0 = manifest schema-valid and version-synced with the root package;
 * exit 1 with each failure named = otherwise. Reads only embedded bytes.
 */
if (import.meta.main) {
  const pkgVersion = (
    JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as {
      version: string;
    }
  ).version;
  const manifest = JSON.parse(readFileSync(SERVER_MANIFEST, "utf8")) as {
    version: string;
  };
  const sync = compareVersions(pkgVersion, manifest.version);
  const failures = [
    ...validateManifest(SERVER_MANIFEST).map((e) => `server.json: ${e}`),
    ...(sync.ok ? [] : [sync.message]),
  ];
  if (failures.length > 0) {
    for (const f of failures) console.error(`FAIL ${f}`);
    process.exit(1);
  }
  console.log(`ok: server.json valid, ${sync.message}`);
}
