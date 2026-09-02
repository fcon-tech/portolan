/**
 * Registry-manifest sync check — openspec/changes/distribution-pass
 * ("The registry manifest is committed and version-synced"), tasks 3.1/3.2.
 * These tests cover the check LOGIC only (CI wiring is task 3.2's workflow
 * level, not a unit test):
 *
 * - "A synced manifest passes": equal versions → ok.
 * - "A drifted manifest is caught": differing versions → not ok, naming
 *   both versions; malformed manifest JSON → validation error.
 *
 * The check module (core/src/release/manifest-check.ts) does not exist yet
 * — RED until task 3.1. The official MCP Registry schema arrives from task
 * 1.1 research; until then the schema path is a named constant with an
 * explicit NOT-WRITTEN-YET marker and schema validation against the real
 * schema is marked skip ("awaiting task 1.1").
 */
import { test, expect } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
// NOT-WRITTEN-YET: created by task 3.1 (core/src/release/manifest-check.ts).
import { compareVersions, validateManifest, SERVER_MANIFEST } from "./manifest-check";

const REPO_ROOT = join(import.meta.dir, "..", "..", "..");

test("a synced manifest passes: equal versions are ok", () => {
  const result = compareVersions("0.4.4", "0.4.4");
  expect(result.ok).toBe(true);
});

test("a drifted manifest is caught: the mismatch names both versions", () => {
  const result = compareVersions("0.4.4", "0.4.3");
  expect(result.ok).toBe(false);
  expect(result.message).toContain("0.4.4");
  expect(result.message).toContain("0.4.3");
});

test("a malformed manifest fails validation", () => {
  const errors = validateManifest("this is { not json");
  expect(errors.length).toBeGreaterThan(0);
});

test("validateManifest accepts a minimal well-formed manifest object", () => {
  const errors = validateManifest(
    JSON.stringify({ name: "portolan/server", version: "0.4.4" }),
  );
  expect(errors).toEqual([]);
});

test.skip(
  "the committed server.json validates against the official registry schema",
  () => {
    // NOT-WRITTEN-YET: the schema file is produced by task 1.1 (registry
    // primaries research); the committed manifest by task 3.1.
    const schemaPath = join(REPO_ROOT, "scripts", "mcp-registry.schema.json");
    expect(existsSync(schemaPath)).toBe(true);
    expect(existsSync(SERVER_MANIFEST)).toBe(true);
    const errors = validateManifest(SERVER_MANIFEST);
    expect(errors).toEqual([]);
  },
  "awaiting task 1.1 (official schema) and task 3.1 (committed server.json)",
);
