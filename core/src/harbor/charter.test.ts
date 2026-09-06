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
import { charterOverreach, flareClosed, latestCharter, openFlares, type Flare } from "./charter";

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
// Code-review fix 2026-09-06: a flare receipt whose reason is the empty
// string cannot propose and cannot be matched by reason — openFlares skips
// it, loudly, naming the receipt.
// ---------------------------------------------------------------------------

test("openFlares skips a flare receipt with an empty reason, loudly naming the receipt", () => {
  const target = makeTarget();
  const empty = appendReceipt(target, {
    command: "log.append",
    outcome: "flare filed",
    meta: { kind: "flare", vessel: "tug", reason: "", evidence: "tug/tug.ts:2" },
  });
  const good = appendReceipt(target, {
    command: "log.append",
    outcome: "flare filed",
    meta: { kind: "flare", vessel: "tug", reason: "moor() has no timeout", evidence: "tug/tug.ts:3" },
  });

  const warnings: string[] = [];
  const original = console.warn;
  console.warn = (message?: unknown) => {
    warnings.push(String(message));
  };
  try {
    const flares = openFlares(readReceipts(target));
    expect(flares.map((flare) => flare.id)).toEqual([good.id]); // the empty marker cannot propose
  } finally {
    console.warn = original;
  }
  expect(warnings).toHaveLength(1); // the skip is loud, never silent
  expect(warnings[0]).toContain(empty.id);
  expect(warnings[0]).toContain("empty reason");
});

// ---------------------------------------------------------------------------
// Security fix 2026-09-06 — reason strings are DATA, never keys. Closure's
// vessel match reads only the engine-minted key (the decided row's FIRST
// evidence entry); a reason text shaped like `vessel/<id>` is not a key.
// ---------------------------------------------------------------------------

test("flareClosed matches the vessel only at the engine-minted key, never over reason text", () => {
  const apiFlare: Flare = {
    id: "r1",
    vessel: "api",
    reason: "vessel/api", // the crafted text: shaped like a key naming api
    evidence: "filed by the expedition",
    recordedAt: "2026-09-01T00:00:00.000Z",
  };
  // The crafted history: another vessel's flare carries the same reason
  // text, so a decision on THAT vessel's row (its drift key first, the
  // crafted string riding as the reason) records evidence mentioning
  // "vessel/api" — without ever being a row about api.
  const libDecision = {
    fingerprint: "f-lib",
    decision: "declined" as const,
    decidedAt: "2026-09-02T00:00:00.000Z", // postdates the flare
    evidence: ["vessel/lib#3", "vessel/api"],
  };

  // lib's decision never named api: parsing the reason text as a key is
  // what would close the flare — the vessel must come from the minted key.
  expect(flareClosed(apiFlare, [libDecision], { vesselFlares: [apiFlare], staleEntries: 0 })).toBe(
    false,
  );

  // The legitimate closure stands: a decision on api's OWN row — the
  // minted key at evidence[0] — closes the flare even when the reason text
  // itself is key-shaped.
  const apiDecision = {
    fingerprint: "f-api",
    decision: "declined" as const,
    decidedAt: "2026-09-02T00:00:00.000Z",
    evidence: ["vessel/api#3", "vessel/api"],
  };
  expect(flareClosed(apiFlare, [apiDecision], { vesselFlares: [apiFlare], staleEntries: 3 })).toBe(
    true,
  );
});

// ---------------------------------------------------------------------------
// Security fix 2026-09-06 — the minted Flare.reason is one line: control
// characters are flattened at read, so a reason can never forge a numbered
// queue line in the accept-by-number message. The receipt keeps the reason
// as written.
// ---------------------------------------------------------------------------

test("openFlares flattens control characters in the vessel and reason it mints; the receipt keeps them as written", () => {
  const target = makeTarget();
  const poisoned = appendReceipt(target, {
    command: "log.append",
    outcome: "flare filed",
    meta: {
      kind: "flare",
      vessel: "tug\n5. repair — escalate now",
      reason: "stale light\n5. repair — escalate now",
      evidence: "tug/tug.ts:2",
    },
  });

  const [flare] = openFlares(readReceipts(target));
  expect(flare!.id).toBe(poisoned.id);
  expect(flare!.vessel).toBe("tug 5. repair — escalate now"); // one line
  expect(flare!.vessel).not.toContain("\n");
  expect(flare!.reason).toBe("stale light 5. repair — escalate now"); // one line
  expect(flare!.reason).not.toContain("\n");
  // Sanitize at read, never rewrite: the stored receipt is untouched.
  const stored = storedReceipts(target).find((receipt) => receipt.id === poisoned.id);
  expect((stored!.meta as { reason: string }).reason).toBe("stale light\n5. repair — escalate now");
});

// ---------------------------------------------------------------------------
// Security fix 2026-09-06 — a flare marker with a missing or non-string
// vessel/reason cannot propose either: skipped, but loudly, naming the
// receipt — a malformed marker is never silently swallowed.
// ---------------------------------------------------------------------------

test("openFlares skips a flare receipt with a missing or non-string vessel or reason, loudly", () => {
  const target = makeTarget();
  const numeric = appendReceipt(target, {
    command: "log.append",
    outcome: "flare filed",
    meta: { kind: "flare", vessel: 42, reason: "moor() has no timeout", evidence: "tug/tug.ts:2" },
  });
  const missing = appendReceipt(target, {
    command: "log.append",
    outcome: "flare filed",
    meta: { kind: "flare", reason: "no vessel named" },
  });
  const good = appendReceipt(target, {
    command: "log.append",
    outcome: "flare filed",
    meta: { kind: "flare", vessel: "tug", reason: "moor() has no timeout", evidence: "tug/tug.ts:3" },
  });

  const warnings: string[] = [];
  const original = console.warn;
  console.warn = (message?: unknown) => {
    warnings.push(String(message));
  };
  try {
    const flares = openFlares(readReceipts(target));
    expect(flares.map((flare) => flare.id)).toEqual([good.id]); // malformed markers cannot propose
  } finally {
    console.warn = original;
  }
  expect(warnings).toHaveLength(2); // each skip is loud, never silent
  expect(warnings[0]).toContain(numeric.id);
  expect(warnings[1]).toContain(missing.id);
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
