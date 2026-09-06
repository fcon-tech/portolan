/**
 * Charter receipt tests — openspec/changes/expedition-charter task 1.1
 * (RED before implementation): the ship's-log markers for charter start,
 * charter outcome, flares, and chart writes — all inside `meta`, so every
 * receipt stays valid against the formats-pass receipt schema whose `meta`
 * is free-form — and the arithmetic that reads them back.
 *
 * Pinned module contract (core/src/harbor/charter.ts):
 *
 *   Flare    { id: string; vessel: string; reason: string;
 *              evidence: string; recordedAt: string }
 *   Charter  { id: string; vessels: string[]; entries: number }
 *   Overreach { vessel: string; entries: number }
 *
 *   openFlares(log: Receipt[]): Flare[]
 *       every receipt whose meta.kind === "flare", in log order.
 *   latestCharter(log: Receipt[]): Charter | undefined
 *       the most recent charter START receipt (meta.kind === "charter");
 *       an outcome receipt never shadows a start.
 *   charterOverreach(log: Receipt[], charter: Charter): Overreach[]
 *       per out-of-charter vessel, the entry count its chart-write
 *       receipts (command "chart.write") recorded AFTER the charter's
 *       start receipt (receipt ids are monotonic) wrote — aggregated per
 *       vessel, sorted by vessel id; in-charter vessels are never listed,
 *       and receipts that are not chart writes contribute nothing even
 *       when their meta names vessels.
 *   flareClosed(flare, history, ...) -> boolean — a decision, accepted or
 *       declined, on a repair proposal for the flare's vessel recorded in
 *       the harbor history AFTER the flare's receipt closes it; undecided
 *       keeps proposing. Proven at the queue level in flares.test.ts.
 *
 *   Receipt markers (meta is free-form; the schema never rejects them):
 *     charter start    meta: { kind: "charter", vessels: string[], entries: number }
 *     charter outcome  meta: { kind: "charter-outcome", charter: <start receipt id> }
 *     flare            meta: { kind: "flare", vessel, reason, evidence }
 *     chart write      meta: { vessels: Record<vesselId, entryCount> }  (design D2)
 */
import { afterAll, test, expect } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020";
import receiptSchemaJson from "../../schema/receipt.schema.json";
import { appendReceipt, logFile, readReceipts, type Receipt } from "../tools/log";
import { charterOverreach, latestCharter, openFlares } from "./charter";

const targets: string[] = [];
afterAll(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

function makeTarget(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-charter-"));
  targets.push(target);
  return target;
}

/** Every line of the log as stored, validated against the receipt schema. */
function storedReceipts(target: string): Receipt[] {
  const lines = readFileSync(logFile(target), "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0);
  return lines.map((line) => JSON.parse(line) as Receipt);
}

function receiptSchemaValidator(): (doc: unknown) => boolean {
  const ajv = new Ajv2020({ allErrors: true });
  ajv.addKeyword("version");
  return ajv.compile(receiptSchemaJson);
}

// ---------------------------------------------------------------------------
// Task 1.1 — the markers ride `meta` and stay schema-valid; the module
// reads them back as a Charter and as Flares.
// ---------------------------------------------------------------------------

test("charter, outcome, flare, and chart-write markers ride meta and validate against the formats-pass receipt schema", () => {
  const target = makeTarget();
  const start = appendReceipt(target, {
    command: "log.append",
    scope: "api",
    outcome: "charter recorded: vessels api · 3 entries",
    meta: { kind: "charter", vessels: ["api"], entries: 3 },
  });
  const outcome = appendReceipt(target, {
    command: "log.append",
    scope: "api",
    outcome: "charter kept: no overreach",
    meta: { kind: "charter-outcome", charter: start.id },
  });
  const flare = appendReceipt(target, {
    command: "log.append",
    scope: "tug",
    outcome: "flare filed: moor() has no timeout",
    meta: { kind: "flare", vessel: "tug", reason: "moor() has no timeout", evidence: "harbor/harbor.ts:2" },
  });
  appendReceipt(target, {
    command: "chart.write",
    scope: "packages/lib",
    outcome: "ok: 4 entries",
    meta: { vessels: { lib: 4 } },
  });

  // The whole log, markers included, validates against the versioned
  // receipt schema — meta is free-form there, so the formats-pass suite
  // keeps validating the full log.jsonl.
  const validate = receiptSchemaValidator();
  for (const receipt of storedReceipts(target)) {
    expect(validate(receipt), `receipt ${receipt.id} against receipt.schema.json`).toBe(true);
  }

  // The markers are readable arithmetic, not prose: the charter start is a
  // Charter, the flare is a Flare.
  const log = readReceipts(target);
  expect(latestCharter(log)).toEqual({ id: start.id, vessels: ["api"], entries: 3 });
  expect(openFlares(log)).toEqual([
    {
      id: flare.id,
      vessel: "tug",
      reason: "moor() has no timeout",
      evidence: "harbor/harbor.ts:2",
      recordedAt: flare.recordedAt,
    },
  ]);
  expect(outcome.id).toBe("r2"); // the pair: start, then outcome
});

test("latestCharter reads the most recent charter start; an outcome receipt never shadows it", () => {
  const target = makeTarget();
  const first = appendReceipt(target, {
    command: "log.append",
    outcome: "charter recorded",
    meta: { kind: "charter", vessels: ["api"], entries: 3 },
  });
  appendReceipt(target, {
    command: "log.append",
    outcome: "charter kept",
    meta: { kind: "charter-outcome", charter: first.id },
  });
  const second = appendReceipt(target, {
    command: "log.append",
    outcome: "charter recorded",
    meta: { kind: "charter", vessels: ["lib", "tug"], entries: 7 },
  });

  expect(latestCharter(readReceipts(target))).toEqual({
    id: second.id,
    vessels: ["lib", "tug"],
    entries: 7,
  });
});

test("openFlares lists every flare receipt in log order and nothing else", () => {
  const target = makeTarget();
  appendReceipt(target, { command: "sweep pattern=tug", outcome: "ok: 1 chunk" });
  const first = appendReceipt(target, {
    command: "log.append",
    outcome: "flare filed",
    meta: { kind: "flare", vessel: "tug", reason: "light cites a moved export", evidence: "tug/tug.ts:2" },
  });
  appendReceipt(target, { command: "chart.write", outcome: "ok: 1 entry", meta: { vessels: { tug: 1 } } });
  const second = appendReceipt(target, {
    command: "log.append",
    outcome: "flare filed",
    meta: { kind: "flare", vessel: "harbor", reason: "fairway is unanchored", evidence: "harbor/harbor.ts:3" },
  });

  expect(openFlares(readReceipts(target))).toEqual([
    {
      id: first.id,
      vessel: "tug",
      reason: "light cites a moved export",
      evidence: "tug/tug.ts:2",
      recordedAt: first.recordedAt,
    },
    {
      id: second.id,
      vessel: "harbor",
      reason: "fairway is unanchored",
      evidence: "harbor/harbor.ts:3",
      recordedAt: second.recordedAt,
    },
  ]);
});

// ---------------------------------------------------------------------------
// Task 1.1 — charterOverreach: out-of-charter chart writes by vessel and
// entry count; in-charter writes, writes that predate the charter, and
// receipts that are not chart writes never count.
// ---------------------------------------------------------------------------

test("charterOverreach lists out-of-charter chart writes by vessel and count, aggregated and sorted by vessel id", () => {
  const target = makeTarget();
  // A write from before the charter: outside it, but not its overreach.
  appendReceipt(target, {
    command: "chart.write",
    outcome: "ok: 2 entries",
    meta: { vessels: { ghost: 2 } },
  });
  const charter = appendReceipt(target, {
    command: "log.append",
    outcome: "charter recorded",
    meta: { kind: "charter", vessels: ["api"], entries: 3 },
  });
  appendReceipt(target, { command: "chart.write", outcome: "ok: 1 entry", meta: { vessels: { tug: 1 } } });
  appendReceipt(target, { command: "chart.write", outcome: "ok: 2 entries", meta: { vessels: { api: 2 } } }); // in-charter
  appendReceipt(target, { command: "chart.write", outcome: "ok: 4 entries", meta: { vessels: { lib: 4 } } });
  appendReceipt(target, { command: "chart.write", outcome: "ok: 2 entries", meta: { vessels: { tug: 2 } } }); // aggregates
  // Not a chart write: its meta names vessels, but it receipts a sweep.
  appendReceipt(target, { command: "sweep pattern=tug", outcome: "ok: 9 chunks", meta: { vessels: { ghost: 9 } } });

  const log = readReceipts(target);
  expect(latestCharter(log)).toEqual({ id: charter.id, vessels: ["api"], entries: 3 });
  expect(charterOverreach(log, { id: charter.id, vessels: ["api"], entries: 3 })).toEqual([
    { vessel: "lib", entries: 4 },
    { vessel: "tug", entries: 3 }, // 1 + 2 across two writes
  ]);
});

// ---------------------------------------------------------------------------
// Design D4 — absence reads as absence: a log written before this change
// holds no charter or flare receipts, and that is an empty section, never
// an error.
// ---------------------------------------------------------------------------

test("a log with no charter or flare receipts reads as absence, never an error", () => {
  const target = makeTarget();
  mkdirSync(join(target, ".portolan"), { recursive: true });
  writeFileSync(logFile(target), "");

  const empty = readReceipts(target);
  expect(openFlares(empty)).toEqual([]);
  expect(latestCharter(empty)).toBeUndefined();

  appendReceipt(target, { command: "sweep pattern=api", outcome: "ok: 1 chunk" });
  const ordinary = readReceipts(target);
  expect(openFlares(ordinary)).toEqual([]);
  expect(latestCharter(ordinary)).toBeUndefined();
});
