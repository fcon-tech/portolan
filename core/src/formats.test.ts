/**
 * The four format contracts (openspec/changes/formats-pass,
 * specs/formats/spec.md): each format is one JSON Schema file under
 * core/schema/ carrying "version": "0.1.0" and a stable $id, and the
 * schema files are the single source the province's real data validates
 * against. The export-document shape pinned here is the one asserted
 * end-to-end in tools/export.test.ts (design D4 + the tools spec's
 * truncation report: format, version, nodes[], edges[], truncated,
 * omitted[]).
 *
 * Wiring note (design D2): the chart schema's trust label $refs the trust
 * vocabulary by $id, so every compile below registers all four schemas —
 * the same wiring core/src/validate.ts owns.
 */
import { test, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020";
import chartJson from "../schema/chart.schema.json";
import trustVocabularyJson from "../schema/trust-vocabulary.schema.json";
import receiptJson from "../schema/receipt.schema.json";
import graphExportJson from "../schema/graph-export.schema.json";
import { ENTRY_KINDS, TRUST_LABELS } from "./types";

interface FormatSchema {
  $schema: string;
  $id: string;
  version: string;
}

const formats: Array<[string, unknown]> = [
  ["the chart entry schema", chartJson],
  ["the trust vocabulary", trustVocabularyJson],
  ["the ship's-log receipt schema", receiptJson],
  ["the adjacency graph export schema", graphExportJson],
];

const ajv = new Ajv2020({ allErrors: true });
// `version` is the D1 format-version annotation on each schema file; ajv
// strict mode rejects unknown keywords unless it is declared as an annotation.
ajv.addKeyword("version");
ajv.addSchema(chartJson);
ajv.addSchema(trustVocabularyJson);
ajv.addSchema(receiptJson);
ajv.addSchema(graphExportJson);

const provinceRoot = join(import.meta.dir, "..", "..");
const provinceIndexPath = join(provinceRoot, ".portolan", "chart", "index.jsonl");
const provinceLogPath = join(provinceRoot, ".portolan", "log.jsonl");
// The province is this repo's own survey (.portolan/ is not tracked): the
// real-data scenarios run where a survey exists and skip honestly elsewhere.
const hasProvince = existsSync(provinceIndexPath) && existsSync(provinceLogPath);

test("every format file is self-identifying: a 0.1.0 version and a stable $id", () => {
  for (const [name, schema] of formats) {
    const meta = schema as FormatSchema;
    expect(meta.version, `${name}: version`).toBe("0.1.0");
    expect(meta.$id, `${name}: $id on the portolan.dev identifier space`).toMatch(
      /^https:\/\/portolan\.dev\//,
    );
    expect(
      meta.$id.includes(meta.version),
      `${name}: the $id is not a function of the version`,
    ).toBe(false);
    expect(meta.$schema, `${name}: draft 2020-12`).toBe(
      "https://json-schema.org/draft/2020-12/schema",
    );
  }
});

test.skipIf(!hasProvince)(
  "every entry of the province's chart index validates against the chart entry schema",
  () => {
    const validate = ajv.compile(chartJson);
    const lines = readFileSync(provinceIndexPath, "utf8")
      .split("\n")
      .filter((line) => line.trim().length > 0);
    expect(lines.length, "the province is surveyed").toBeGreaterThan(0);

    const problems: string[] = [];
    lines.forEach((line, i) => {
      const entry = JSON.parse(line) as Record<string, unknown>;
      const name = `${String(entry.kind)}/${String(entry.id)}`;
      if (!validate(entry)) {
        const detail = (validate.errors ?? [])
          .map((e) => `${e.message} @ ${e.instancePath}`)
          .join("; ");
        problems.push(`line ${i + 1} (${name}): ${detail}`);
      }
    });
    expect(problems, `${problems.length} invalid chart entries`).toEqual([]);
  },
);

test.skipIf(!hasProvince)(
  "every line of the province's ship's log validates against the receipt schema",
  () => {
    const validate = ajv.compile(receiptJson);
    const lines = readFileSync(provinceLogPath, "utf8")
      .split("\n")
      .filter((line) => line.trim().length > 0);
    expect(lines.length, "the ship's log has receipts").toBeGreaterThan(0);

    const problems: string[] = [];
    lines.forEach((line, i) => {
      const receipt = JSON.parse(line) as Record<string, unknown>;
      const name = String(receipt.id);
      if (!validate(receipt)) {
        const detail = (validate.errors ?? [])
          .map((e) => `${e.message} @ ${e.instancePath}`)
          .join("; ");
        problems.push(`line ${i + 1} (${name}): ${detail}`);
      }
    });
    expect(problems, `${problems.length} invalid receipts`).toEqual([]);
  },
);

test("the receipt schema describes exactly what the ship's log writes", () => {
  const validate = ajv.compile(receiptJson);
  const written = {
    id: "r9",
    command: "sweep pattern=CartService",
    scope: "src/",
    outcome: "ok: 3 chunks",
    recordedAt: "2026-09-06T00:00:00.000Z",
    meta: { pass: 3, fail: 0 },
  };
  expect(validate(written), "a full receipt as log.ts writes it").toBe(true);
  expect(
    validate({
      id: "r10",
      command: "symbols name=CartService",
      outcome: "ok: 1 definition",
      recordedAt: "2026-09-06T00:00:00.000Z",
    }),
    "scope and meta are optional",
  ).toBe(true);
  const { outcome: _outcome, ...withoutOutcome } = written;
  expect(validate(withoutOutcome), "a receipt without an outcome").toBe(false);
  expect(validate({ ...written, vibes: "good" }), "a receipt with an invented field").toBe(
    false,
  );
});

test("the trust vocabulary accepts exactly the five closed labels and rejects any other value", () => {
  const validate = ajv.compile(trustVocabularyJson);
  for (const label of ["measured", "charted", "reported", "doubtful", "unsurveyed"]) {
    expect(validate(label), label).toBe(true);
  }
  for (const other of ["guessed", "Measured", "measured ", "", "unsure", null, 42, {}, ["measured"]]) {
    expect(validate(other), JSON.stringify(other)).toBe(false);
  }
});

test("TRUST_LABELS stays pinned to the trust vocabulary schema", () => {
  const vocabulary = trustVocabularyJson as unknown as { enum: string[] };
  const fromSchema: string[] = [...vocabulary.enum];
  const fromTypes: string[] = [...TRUST_LABELS];
  expect(fromSchema, "the closed enumeration").toHaveLength(TRUST_LABELS.length);
  expect(fromTypes.sort()).toEqual(fromSchema.sort());
});

test("ENTRY_KINDS stays pinned to the chart schema's kind $defs", () => {
  const chart = chartJson as unknown as {
    $defs: Record<string, { properties?: { kind?: { const?: string } } }>;
  };
  for (const kind of ENTRY_KINDS) {
    const def = chart.$defs[kind];
    expect(def, `chart schema $defs/${kind}`).toBeDefined();
    expect(def?.properties?.kind?.const, `$defs/${kind} pins its kind`).toBe(kind);
  }
});

test("the graph export schema compiles with ajv and rejects timestamps and derived rollups", () => {
  const exportDocument = {
    format: "portolan-adjacency",
    version: "0.1.0",
    nodes: [
      {
        kind: "vessel",
        id: "web",
        name: "Web frontend",
        paths: ["services/web"],
        anchors: [{ type: "file", path: "services/web/main.ts", line: 1 }],
        trust: "measured",
        stale: false,
      },
    ],
    edges: [
      {
        id: "f-web-db",
        from: "web",
        to: "db",
        anchors: [{ type: "file", path: "services/web/db.ts", line: 7 }],
        trust: "measured",
        stale: false,
      },
    ],
    truncated: false,
    omitted: [],
  };
  const validate = ajv.compile(graphExportJson);

  expect(validate(exportDocument), "the export document shape itself").toBe(true);
  expect(
    validate({ ...exportDocument, generatedAt: "2026-09-06T00:00:00.000Z" }),
    "a generatedAt timestamp: receipts carry the when, not the export",
  ).toBe(false);
  expect(
    validate({ ...exportDocument, vessels: [{ id: "web", edges: 1 }] }),
    "a top-level vessels rollup: one derivation away, not in the document",
  ).toBe(false);
  expect(
    validate({ ...exportDocument, issues: [{ id: "db" }] }),
    "a dangling-endpoint issues[] list: raw edge ids already state the fact",
  ).toBe(false);
});
