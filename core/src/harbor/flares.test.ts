/**
 * Flare queue tests — the harbor delta of
 * openspec/changes/expedition-charter (specs/harbor/spec.md: ADDED "A
 * flare is filed, honored, and closed"; MODIFIED "Proposals are computed,
 * not imagined" gains its fourth input), one test per scenario: a filed
 * flare becomes a repair proposal for the vessel it names, citing the
 * flare's reason; drift and a flare on one vessel yield the single
 * per-vessel row carrying both evidences; multiple flares on one vessel
 * fold into that row (filter-plus-concat, no join layer); an undecided
 * flare proposes in every computed queue; a decision — accepted or
 * declined — on a repair proposal for the vessel recorded after the
 * flare's receipt closes it, and it proposes nothing further; a decision
 * recorded before the flare's receipt closes nothing.
 *
 * Pinned queue contract (core/src/harbor/proposals.ts, the fourth input):
 *
 *   Open flares are read from the ship's log (meta.kind "flare", via
 *   openFlares in ./charter) and contribute one repair row per named
 *   vessel, per-vessel keyed like every repair row:
 *     flare alone:               evidence = [<flare.reason>]
 *     drift + flare, one vessel: the SINGLE row folds both evidences
 *                                (["vessel/<id>#<count>", <reason>])
 *     several flares, one vessel: one row, every reason carried
 *   The kind stays "repair" — flare rows rank, take decisions, and (night
 *   watch) auto-execute like any repair; no separate policy, no new tool.
 *   Closure is arithmetic over the harbor history: a decision postdating
 *   the flare's receipt closes it. A still province — no drift, no gap,
 *   no landscape change, no open flare — stays empty.
 *
 * Conventions mirror resurvey.test.ts. Flare receipts are hand-written
 * log lines with a fixed recordedAt so "after the flare's receipt" is
 * deterministic against decisions appended now.
 */
import { afterAll, test, expect } from "bun:test";
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeChart } from "../chart-store";
import type { ChartEntry } from "../types";
import { computeProposals, decide, type Proposal } from "./proposals";

const targets: string[] = [];
afterAll(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// The fixture province: one source file per charted vessel, nothing else on
// disk (no manifests, so the landscape — and new-land with it — stays empty
// and every queue below is repair rows alone).
// ---------------------------------------------------------------------------

type Dirs = Record<string, string>;

function makeProvince(vessels: Dirs): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-flares-"));
  targets.push(target);
  for (const dir of Object.values(vessels)) {
    mkdirSync(join(target, dir, "src"), { recursive: true });
    writeFileSync(join(target, dir, "src", "main.ts"), `// ${dir}\nexport const main = "${dir}";\n`);
  }
  return target;
}

const srcFile = (dirs: Dirs, id: string) => `${dirs[id]}/src/main.ts`;

function vesselEntry(id: string, dirs: Dirs): ChartEntry {
  return {
    kind: "vessel",
    id,
    name: dirs[id],
    behavior: `serves ${dirs[id]}`,
    paths: [dirs[id]],
    anchors: [{ type: "file", path: srcFile(dirs, id), line: 1 }],
    trust: "charted",
  };
}

function lightEntry(id: string, dirs: Dirs): ChartEntry {
  return {
    kind: "light",
    id: `l-${id}`,
    vessel: id,
    name: `export const main (${dirs[id]})`,
    anchors: [{ type: "file", path: srcFile(dirs, id), line: 2 }],
    trust: "measured",
  };
}

function fairwayEntry(n: number, from: string, to: string, dirs: Dirs): ChartEntry {
  return {
    kind: "fairway",
    id: `fw-${from}-${to}-${n}`,
    from,
    to,
    anchors: [{ type: "file", path: srcFile(dirs, to), line: 1 }],
    trust: "reported",
  };
}

/** Drift: change a file under one vessel's charted paths after the survey. */
function drift(target: string, dir: string): void {
  appendFileSync(join(target, dir, "src", "main.ts"), "\n// a later edit\n");
}

/** File a flare the way an expedition does: a ship's-log receipt in meta. */
function fileFlare(target: string, id: string, vessel: string, reason: string): void {
  mkdirSync(join(target, ".portolan"), { recursive: true });
  appendFileSync(
    join(target, ".portolan", "log.jsonl"),
    `${JSON.stringify({
      id,
      command: "log.append",
      scope: vessel,
      outcome: `flare filed: ${reason}`,
      recordedAt: "2026-09-01T00:00:00.000Z", // fixed: decisions appended now postdate it
      meta: { kind: "flare", vessel, reason, evidence: "filed by the expedition" },
    })}\n`,
  );
}

/** Hand-write a harbor-history decision with a fixed decidedAt. */
function writeDecision(
  target: string,
  fingerprint: string,
  decision: "accepted" | "declined",
  decidedAt: string,
): void {
  mkdirSync(join(target, ".portolan", "harbor"), { recursive: true });
  appendFileSync(
    join(target, ".portolan", "harbor", "history.jsonl"),
    `${JSON.stringify({ fingerprint, decision, decidedAt })}\n`,
  );
}

const repairRows = (target: string): Proposal[] =>
  computeProposals(target).proposals.filter((p) => p.kind === "repair");

const completeBase = (dirs: Dirs): ChartEntry[] => [
  vesselEntry("api", dirs),
  vesselEntry("lib", dirs),
  lightEntry("api", dirs),
  lightEntry("lib", dirs),
  fairwayEntry(1, "api", "lib", dirs),
];

// ---------------------------------------------------------------------------
// Scenario: A flare becomes a repair proposal.
// ---------------------------------------------------------------------------

test("charter flare: a filed flare becomes a repair proposal for its vessel, citing the flare's reason", () => {
  const dirs: Dirs = { api: "apps/api", lib: "packages/lib" };
  const target = makeProvince(dirs);
  writeChart(target, completeBase(dirs));
  computeProposals(target); // the still baseline (snapshot; the queue is empty)
  const reason = "lib's light cites a moved export";
  fileFlare(target, "r1", "lib", reason);

  const rows = repairRows(target);
  expect(rows).toHaveLength(1); // one repair row for the one named vessel
  expect(rows[0]!.kind).toBe("repair"); // flare rows are repair rows, like any repair
  expect(rows[0]!.scope.vessels).toEqual(["lib"]);
  expect(rows[0]!.evidence).toEqual([reason]); // the stated reason is the evidence
  expect(rows[0]!.summary).toContain(reason);
  // Deterministic: the same flare computes the same row twice.
  expect(repairRows(target)[0]!.fingerprint).toBe(rows[0]!.fingerprint);
});

// ---------------------------------------------------------------------------
// Scenario: A vessel named by both drift and a flare yields one row.
// ---------------------------------------------------------------------------

test("charter flare: drift and a flare on one vessel yield the single per-vessel row carrying both evidences", () => {
  const dirs: Dirs = { api: "apps/api", lib: "packages/lib" };
  const target = makeProvince(dirs);
  writeChart(target, completeBase(dirs));
  drift(target, dirs.api);
  const reason = "api's fairway anchor is stale";
  fileFlare(target, "r1", "api", reason);

  const rows = repairRows(target);
  expect(rows).toHaveLength(1); // the single per-vessel row, not two rows for api
  expect(rows[0]!.scope.vessels).toEqual(["api"]);
  expect(rows[0]!.evidence).toHaveLength(2);
  expect(rows[0]!.evidence).toContain("vessel/api#3"); // the drift, charged as always
  expect(rows[0]!.evidence).toContain(reason); // and the flare's stated reason
});

// ---------------------------------------------------------------------------
// Design D1 — multiple flares on one vessel fold by filter-plus-concat.
// ---------------------------------------------------------------------------

test("charter flare: several flares on one vessel fold into the single row carrying every reason", () => {
  const dirs: Dirs = { api: "apps/api", lib: "packages/lib" };
  const target = makeProvince(dirs);
  writeChart(target, completeBase(dirs));
  computeProposals(target); // still baseline
  fileFlare(target, "r1", "api", "the shared fairway has no measured anchor");
  fileFlare(target, "r2", "api", "api's behavior line is stale");

  const rows = repairRows(target);
  expect(rows).toHaveLength(1); // folded, not one row per flare
  expect(rows[0]!.scope.vessels).toEqual(["api"]);
  expect(rows[0]!.evidence).toHaveLength(2);
  expect(rows[0]!.evidence).toContain("the shared fairway has no measured anchor");
  expect(rows[0]!.evidence).toContain("api's behavior line is stale");
});

// ---------------------------------------------------------------------------
// Scenario: An undecided flare keeps proposing.
// ---------------------------------------------------------------------------

test("charter flare: an undecided flare keeps proposing in every computed queue", () => {
  const dirs: Dirs = { api: "apps/api", lib: "packages/lib" };
  const target = makeProvince(dirs);
  writeChart(target, completeBase(dirs));
  computeProposals(target); // still baseline
  const reason = "lib's light cites a moved export";
  fileFlare(target, "r1", "lib", reason);

  expect(repairRows(target).map((r) => r.scope.vessels)).toEqual([["lib"]]);

  // The province moves on — drift appears elsewhere — and the undecided
  // flare's row is still computed, alongside the new drift row.
  drift(target, dirs.api);
  expect(repairRows(target).map((r) => r.scope.vessels)).toEqual([["lib"], ["api"]]);
});

// ---------------------------------------------------------------------------
// Scenario: A decision closes the flare — declined, then accepted; either
// closes the flare outright, and it proposes nothing further.
// ---------------------------------------------------------------------------

test("charter flare: a declined decision on the row closes the flare — it proposes nothing further", () => {
  const dirs: Dirs = { api: "apps/api", lib: "packages/lib" };
  const target = makeProvince(dirs);
  writeChart(target, completeBase(dirs));
  drift(target, dirs.api);
  const reason = "api's fairway anchor is stale";
  fileFlare(target, "r1", "api", reason);

  const [merged] = repairRows(target);
  expect(merged!.evidence).toHaveLength(2); // the drift-and-flare row
  decide(target, merged!.fingerprint, "declined");
  expect(computeProposals(target).proposals).toEqual([]); // closed and filtered

  // The drift grows: a fresh repair row computes, but the closed flare
  // contributes nothing to it — the reason is gone from the evidence.
  drift(target, dirs.api);
  const reopened = repairRows(target);
  expect(reopened.map((r) => r.scope.vessels)).toEqual([["api"]]);
  expect(reopened[0]!.evidence).toEqual(["vessel/api#4"]);
});

test("charter flare: an accepted decision closes the flare too — acceptance is not a refusal, closure is", () => {
  const dirs: Dirs = { api: "apps/api", lib: "packages/lib" };
  const target = makeProvince(dirs);
  writeChart(target, completeBase(dirs));
  computeProposals(target); // still baseline
  const reason = "lib's light cites a moved export";
  fileFlare(target, "r1", "lib", reason);

  const [row] = repairRows(target);
  expect(row!.evidence).toEqual([reason]);
  decide(target, row!.fingerprint, "accepted");
  // An acceptance never filters a queue row — closure must remove the
  // flare's contribution, or the accepted row would recompute forever.
  expect(computeProposals(target).proposals).toEqual([]);
});

// ---------------------------------------------------------------------------
// Design D1 — closure needs a decision AFTER the flare's receipt.
// ---------------------------------------------------------------------------

test("charter flare: a decision recorded before the flare's receipt does not close it", () => {
  const dirs: Dirs = { api: "apps/api", lib: "packages/lib" };
  const target = makeProvince(dirs);
  writeChart(target, completeBase(dirs));
  drift(target, dirs.api);

  // The Governor declined api's drift row before any flare existed.
  const [driftRow] = repairRows(target);
  expect(driftRow!.evidence).toEqual(["vessel/api#3"]);
  writeDecision(target, driftRow!.fingerprint, "declined", "2026-08-30T00:00:00.000Z");

  // The flare is filed later — the earlier refusal neither filters its
  // folded row (a different fingerprint) nor closes the flare.
  const reason = "api's fairway anchor is stale";
  fileFlare(target, "r1", "api", reason);

  const rows = repairRows(target);
  expect(rows).toHaveLength(1);
  expect(rows[0]!.evidence).toHaveLength(2);
  expect(rows[0]!.evidence).toContain("vessel/api#3");
  expect(rows[0]!.evidence).toContain(reason);
});
