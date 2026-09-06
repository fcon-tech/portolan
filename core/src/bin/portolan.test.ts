/**
 * Dispatcher acceptance tests — the `portolan` bin (openspec/changes/
 * distribution-pass, tasks.md 2.2), one test per spec scenario:
 *
 * - "serve matches the in-repo server" / "A clean environment installs and
 *   runs": `portolan serve --target <province>` answers tools/list with the
 *   fifteen Portolan tool names (TOOL_NAMES from the registry — the same
 *   list the repository-launched server serves).
 * - "The CLIs stay reachable": `portolan chartroom render --target …` and
 *   `portolan harbor propose --target … --format chat` route to the
 *   existing CLIs and behave as they do (exit 0, their output markers).
 * - "A non-MCP consumer obtains and validates the export" (formats-pass,
 *   task 4.1, specs/formats/spec.md): `portolan export --target …` prints
 *   the chartExport document as JSON on stdout and it validates against
 *   graph-export.schema.json; a province with no Chart exits nonzero with
 *   an empty stdout and an honest stderr. The CLI writes no ship's-log
 *   receipt — receipts are the served tools' discipline (design D6: the
 *   CLI rides the builder, and the builder appends nothing).
 * - (implicit routing contract) an unknown subcommand exits nonzero and
 *   names the valid subcommands.
 */
import { afterAll, test, expect } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Ajv2020 from "ajv/dist/2020";
import graphExportJson from "../../schema/graph-export.schema.json";
import trustVocabularyJson from "../../schema/trust-vocabulary.schema.json";
import { TOOL_NAMES } from "../server/registry";
import { writeChart } from "../chart-store";
import { readReceipts } from "../tools/log";
import type { ChartEntry } from "../types";

const REPO_ROOT = join(import.meta.dir, "..", "..", "..");
// The bin the published package exposes; in-repo it is this dispatcher.
const DISPATCHER = join(REPO_ROOT, "core", "src", "bin", "portolan.ts");

const targets: string[] = [];
afterAll(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

/** A minimal province with a charted vessel, enough for chartroom + harbor. */
function makeChartedProvince(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-dispatch-"));
  targets.push(target);
  mkdirSync(join(target, "apps", "api"), { recursive: true });
  writeFileSync(join(target, "apps", "api", "package.json"), '{ "name": "@prov/api" }\n');
  writeFileSync(join(target, "apps", "api", "server.ts"), "export const answer = 42;\n");
  const entries: ChartEntry[] = [
    {
      kind: "vessel",
      id: "api",
      name: "apps/api",
      behavior: "serves the answer",
      paths: ["apps/api"],
      anchors: [{ type: "manifest", path: "apps/api/package.json", key: "name" }],
      trust: "charted",
    },
  ];
  writeChart(target, entries);
  return target;
}

/** Strict-ajv validator over the published schemas, as export.test.ts wires it. */
function exportSchemaValidator(): (doc: unknown) => boolean {
  const ajv = new Ajv2020({ allErrors: true });
  // D1: `version` is the schema-file version annotation ajv strict must know.
  ajv.addKeyword("version");
  ajv.addSchema(trustVocabularyJson);
  ajv.addSchema(graphExportJson);
  return ajv.compile(graphExportJson);
}

// Scenario: serve matches the in-repo server / A clean environment installs and runs
test("portolan serve answers tools/list with the fifteen Portolan tool names", async () => {
  const target = makeChartedProvince();
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [DISPATCHER, "serve", "--target", target],
  });
  const client = new Client({ name: "dispatcher-test", version: "0.0.0" });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    expect(listed.tools.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
  } finally {
    await client.close();
  }
});

// Scenario: The CLIs stay reachable (chartroom)
test("portolan chartroom render routes to the chartroom CLI", () => {
  const target = makeChartedProvince();
  const run = spawnSync(process.execPath, [DISPATCHER, "chartroom", "render", "--target", target], {
    encoding: "utf8",
  });
  expect(run.status).toBe(0);
  expect(run.stdout).toContain("chart-room.html written");
});

// Scenario: The CLIs stay reachable (harbor)
test("portolan harbor propose routes to the harbor CLI", () => {
  const target = makeChartedProvince();
  const run = spawnSync(
    process.execPath,
    [DISPATCHER, "harbor", "propose", "--target", target, "--format", "chat"],
    { encoding: "utf8" },
  );
  expect(run.status).toBe(0);
  // The machine format is parseable JSON — same behavior as the harbor CLI.
  const json = spawnSync(
    process.execPath,
    [DISPATCHER, "harbor", "propose", "--target", target, "--format", "json"],
    { encoding: "utf8" },
  );
  expect(json.status).toBe(0);
  expect(() => JSON.parse(json.stdout)).not.toThrow();
});

// Scenario: A non-MCP consumer obtains and validates the export (formats-pass)
test("portolan export prints a self-describing document that validates against the graph export schema", () => {
  const target = makeChartedProvince();
  const run = spawnSync(process.execPath, [DISPATCHER, "export", "--target", target], {
    encoding: "utf8",
  });
  expect(run.status).toBe(0);

  const doc: unknown = JSON.parse(run.stdout);
  expect(
    exportSchemaValidator()(doc),
    "the CLI document against the graph export schema",
  ).toBe(true);
  const self = doc as { format: string; version: string };
  expect(self.format).toBe("portolan-adjacency");
  // The named version is the schema version the document was produced against.
  expect(self.version).toBe((graphExportJson as unknown as { version: string }).version);
});

test("portolan export on a province with no Chart exits nonzero, stdout empty, stderr honest", () => {
  const target = mkdtempSync(join(tmpdir(), "portolan-dispatch-"));
  targets.push(target);
  const run = spawnSync(process.execPath, [DISPATCHER, "export", "--target", target], {
    encoding: "utf8",
  });
  expect(run.status).not.toBe(0);
  expect(run.stdout, "no document on the error path").toBe("");
  expect(run.stderr).toMatch(/no chart/i);
});

test("the CLI export writes no ship's-log receipt — the province's log stays untouched", () => {
  const target = makeChartedProvince();
  expect(readReceipts(target)).toEqual([]); // empty log before the call

  const run = spawnSync(process.execPath, [DISPATCHER, "export", "--target", target], {
    encoding: "utf8",
  });
  expect(run.status).toBe(0);

  // Receipts are the served tool's discipline; the CLI rides the builder,
  // and the builder appends nothing (design D6).
  expect(readReceipts(target)).toEqual([]);
  expect(existsSync(join(target, ".portolan", "log.jsonl"))).toBe(false);
});

test("an unknown subcommand exits nonzero naming the valid subcommands", () => {
  const target = makeChartedProvince();
  const run = spawnSync(process.execPath, [DISPATCHER, "voyage", "--target", target], {
    encoding: "utf8",
  });
  expect(run.status).not.toBe(0);
  for (const sub of ["serve", "export", "chartroom", "harbor"]) {
    expect(run.stderr).toContain(sub);
  }
});
