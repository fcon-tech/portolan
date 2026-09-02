/**
 * Resurvey-queue tests — the harbor delta of
 * openspec/changes/resurvey-queue (specs/harbor/spec.md), one test per
 * scenario: two drifted vessels become two per-vessel repair proposals with
 * anchors under their own charted paths; a refusal is per-vessel and reopens
 * when the declined vessel's stale-entry count changes; a deleted coast is
 * still proposed, its anchor omitted, never faked; the repair rows rank by
 * direct cross-vessel charted fan-in (the hub outranks the leaf; a detached
 * vessel is proposed, ties broken by vessel id; intra-vessel fairways count
 * for nothing; two computes order identically); per-vessel scope is charged
 * by the staleness report's attribution rule; and the queue's chat post
 * stays complete (no cap) and deterministic. The tools delta's queue-order
 * scenario is proven in core/src/tools/trust-report.test.ts.
 */
import { afterAll, test, expect } from "bun:test";
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeChart } from "../chart-store";
import type { ChartEntry } from "../types";
import { computeProposals, decide, type Proposal } from "./proposals";
import { renderQueueChat } from "./chat-format";
import { trustReport } from "../tools/trust-report";

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
  const target = mkdtempSync(join(tmpdir(), "portolan-resurvey-"));
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

function dangerEntry(id: string, vesselId: string, dirs: Dirs): ChartEntry {
  return {
    kind: "danger",
    id,
    vessel: vesselId,
    category: "shallow",
    note: `mooring near ${dirs[vesselId]} has no depth check.`,
    anchors: [{ type: "file", path: srcFile(dirs, vesselId), line: 2 }],
    trust: "reported",
  };
}

/** Drift: change a file under one vessel's charted paths after the survey. */
function drift(target: string, dir: string): void {
  appendFileSync(join(target, dir, "src", "main.ts"), "\n// a later edit\n");
}

const repairRows = (target: string): Proposal[] =>
  computeProposals(target).proposals.filter((p) => p.kind === "repair");
const rowVessels = (rows: Proposal[]): string[][] => rows.map((r) => r.scope.vessels);

// ---------------------------------------------------------------------------
// "Proposals are computed, not imagined" — drift proposes one repair
// proposal per pending-correction vessel.
// ---------------------------------------------------------------------------

test("resurvey: two drifted vessels become two repair proposals, each naming one vessel with an anchor under its own charted paths", () => {
  const dirs: Dirs = { api: "apps/api", lib: "packages/lib" };
  const target = makeProvince(dirs);
  writeChart(target, [
    vesselEntry("api", dirs),
    vesselEntry("lib", dirs),
    lightEntry("api", dirs),
    lightEntry("lib", dirs),
    fairwayEntry(1, "api", "lib", dirs),
  ]);
  drift(target, dirs.api);
  drift(target, dirs.lib);

  const rows = repairRows(target);
  expect(rows).toHaveLength(2); // one proposal per drifted vessel, not one grouped blob
  const byVessel = new Map<string, Proposal>(rows.map((r) => [r.scope.vessels[0], r]));
  for (const id of ["api", "lib"]) {
    const row = byVessel.get(id);
    expect(row).toBeDefined();
    expect(row!.scope.vessels).toEqual([id]); // names that vessel alone
    // The anchor cites a soundable file under THAT vessel's charted paths.
    expect(row!.anchors).toEqual([{ type: "file", path: srcFile(dirs, id) }]);
    // The estimate states the entries and soundings a re-survey would touch.
    expect(row!.scope.entries).toBeGreaterThan(0);
    expect(row!.scope.soundings).toBe(row!.scope.entries);
    // The evidence carries the vessel and its stale-entry count.
    expect(row!.evidence).toEqual([`vessel/${id}#${row!.scope.entries}`]);
    expect(row!.summary).toContain(id);
  }
});

// ---------------------------------------------------------------------------
// ADDED requirement: the repair queue is fan-in ranked.
// ---------------------------------------------------------------------------

test("resurvey rank: the hub outranks the leaf (fan-in 11 precedes fan-in 1)", () => {
  const dirs: Dirs = { hub: "apps/hub", leaf: "packages/leaf" };
  const target = makeProvince(dirs);
  writeChart(target, [
    vesselEntry("hub", dirs),
    vesselEntry("leaf", dirs),
    lightEntry("hub", dirs),
    lightEntry("leaf", dirs),
    ...Array.from({ length: 11 }, (_, i) => fairwayEntry(i + 1, "leaf", "hub", dirs)),
    fairwayEntry(1, "hub", "leaf", dirs),
  ]);
  drift(target, dirs.hub);
  drift(target, dirs.leaf);

  expect(rowVessels(repairRows(target))).toEqual([["hub"], ["leaf"]]);
});

test("resurvey rank: a detached vessel is proposed, not dropped — fan-in ties break by vessel id", () => {
  const dirs: Dirs = { alpha: "a/alpha", bravo: "b/bravo", charlie: "c/charlie" };
  const target = makeProvince(dirs);
  writeChart(target, [
    vesselEntry("alpha", dirs),
    vesselEntry("bravo", dirs),
    vesselEntry("charlie", dirs),
    lightEntry("alpha", dirs),
    lightEntry("bravo", dirs),
    lightEntry("charlie", dirs),
    fairwayEntry(1, "bravo", "charlie", dirs), // bravo points out; nothing points in
  ]);
  for (const dir of Object.values(dirs)) drift(target, dir);

  // Charlie holds fan-in 1; alpha and bravo hold no incoming cross-vessel
  // fairway, tie at zero, and order by id — none of the three is dropped.
  expect(rowVessels(repairRows(target))).toEqual([["charlie"], ["alpha"], ["bravo"]]);
});

test("resurvey rank: an intra-vessel fairway contributes nothing to the rank", () => {
  const dirs: Dirs = { alpha: "a/alpha", mike: "m/mike", zulu: "z/zulu" };
  const target = makeProvince(dirs);
  writeChart(target, [
    vesselEntry("alpha", dirs),
    vesselEntry("mike", dirs),
    vesselEntry("zulu", dirs),
    lightEntry("alpha", dirs),
    lightEntry("mike", dirs),
    lightEntry("zulu", dirs),
    fairwayEntry(1, "zulu", "zulu", dirs), // zulu's fairway to itself is no fan-in
  ]);
  for (const dir of Object.values(dirs)) drift(target, dir);

  // Were the self-fairway counted, zulu (fan-in 1) would lead; the rank is
  // cross-vessel only, so all three tie at zero and order by vessel id.
  expect(rowVessels(repairRows(target))).toEqual([["alpha"], ["mike"], ["zulu"]]);
});

test("resurvey rank: two computes over an unchanged province order the repair rows identically", () => {
  const dirs: Dirs = { hub: "apps/hub", leaf: "packages/leaf", solo: "tools/solo" };
  const target = makeProvince(dirs);
  writeChart(target, [
    vesselEntry("hub", dirs),
    vesselEntry("leaf", dirs),
    vesselEntry("solo", dirs),
    lightEntry("hub", dirs),
    lightEntry("leaf", dirs),
    lightEntry("solo", dirs),
    fairwayEntry(1, "leaf", "hub", dirs),
    fairwayEntry(2, "leaf", "hub", dirs),
    fairwayEntry(1, "hub", "leaf", dirs),
  ]);
  for (const dir of Object.values(dirs)) drift(target, dir);

  const first = computeProposals(target);
  const second = computeProposals(target);
  expect(second).toEqual(first);
  expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  // The order itself is the rank: fan-in 2, then 1, then the detached 0.
  expect(rowVessels(first.proposals.filter((p) => p.kind === "repair"))).toEqual([
    ["hub"],
    ["leaf"],
    ["solo"],
  ]);
});

// ---------------------------------------------------------------------------
// Per-vessel refusal fingerprints: declining one vessel never hides the
// others; a declined vessel reopens when its stale-entry count changes.
// ---------------------------------------------------------------------------

test("resurvey refusals: declining one vessel's repair leaves the other vessel queued", () => {
  const dirs: Dirs = { api: "apps/api", lib: "packages/lib" };
  const target = makeProvince(dirs);
  writeChart(target, [
    vesselEntry("api", dirs),
    vesselEntry("lib", dirs),
    lightEntry("api", dirs),
    lightEntry("lib", dirs),
    fairwayEntry(1, "api", "lib", dirs),
  ]);
  drift(target, dirs.api);
  drift(target, dirs.lib);

  const rows = repairRows(target);
  expect(rows).toHaveLength(2);
  const apiRow = rows.find((r) => r.scope.vessels[0] === "api")!;
  const libRow = rows.find((r) => r.scope.vessels[0] === "lib")!;
  decide(target, apiRow.fingerprint, "declined");

  const after = repairRows(target);
  expect(rowVessels(after)).toEqual([["lib"]]);
  expect(after[0]!.fingerprint).toBe(libRow.fingerprint); // the refusal did not touch lib's row
});

test("resurvey refusals: a declined vessel reopens when its stale-entry count grows", () => {
  const dirs: Dirs = { api: "apps/api", lib: "packages/lib" };
  const target = makeProvince(dirs);
  const base = [
    vesselEntry("api", dirs),
    vesselEntry("lib", dirs),
    lightEntry("api", dirs),
    lightEntry("lib", dirs),
    fairwayEntry(1, "api", "lib", dirs),
  ];
  writeChart(target, base);
  drift(target, dirs.api);

  const [row] = repairRows(target);
  // Declined at three stale entries: the vessel, its light, the shared fairway.
  expect(row!.evidence).toEqual(["vessel/api#3"]);
  decide(target, row!.fingerprint, "declined");
  expect(repairRows(target)).toEqual([]); // the refusal holds while the drift is unchanged

  // A new survey charts a fourth entry hanging from api; api drifts again.
  writeChart(target, [...base, dangerEntry("d-api-shallow", "api", dirs)]);
  drift(target, dirs.api);

  const reopened = repairRows(target);
  expect(rowVessels(reopened)).toEqual([["api"]]);
  expect(reopened[0]!.evidence).toEqual(["vessel/api#4"]);
  expect(reopened[0]!.fingerprint).not.toBe(row!.fingerprint); // a new proposal, decidable anew
});

// ---------------------------------------------------------------------------
// Anchor honesty: a drifted vessel whose charted paths hold no soundable
// regular file is proposed with its anchor omitted — never faked.
// ---------------------------------------------------------------------------

test("resurvey anchors: a drifted vessel with no soundable regular file under its charted paths is proposed with its anchor omitted", () => {
  const dirs: Dirs = { api: "apps/api", ghost: "ghost" };
  const target = makeProvince(dirs);
  writeChart(target, [
    vesselEntry("api", dirs),
    vesselEntry("ghost", dirs),
    lightEntry("api", dirs),
    lightEntry("ghost", dirs),
  ]);
  rmSync(join(target, dirs.ghost), { recursive: true, force: true }); // the deleted coast
  drift(target, dirs.api);

  const rows = repairRows(target);
  expect(rows).toHaveLength(2); // the ghost is still proposed, never dropped
  const ghostRow = rows.find((r) => r.scope.vessels[0] === "ghost")!;
  expect(ghostRow.anchors).toEqual([]); // omitted, not fabricated
  expect(ghostRow.summary).toContain("ghost"); // it still names the vessel
  const apiRow = rows.find((r) => r.scope.vessels[0] === "api")!;
  expect(apiRow.anchors).toEqual([{ type: "file", path: srcFile(dirs, "api") }]); // the control keeps its anchor
});

// ---------------------------------------------------------------------------
// Scope charged by the staleness report's attribution: a stale fairway
// counts for both its endpoints, so the queue and the report quote one
// number for one vessel.
// ---------------------------------------------------------------------------

test("resurvey scope: per-vessel entries match the report's charge — a stale fairway counts for both endpoints", () => {
  const dirs: Dirs = { api: "apps/api", lib: "packages/lib" };
  const target = makeProvince(dirs);
  writeChart(target, [
    vesselEntry("api", dirs),
    vesselEntry("lib", dirs),
    lightEntry("api", dirs),
    lightEntry("lib", dirs),
    fairwayEntry(1, "api", "lib", dirs),
  ]);
  drift(target, dirs.api);
  drift(target, dirs.lib);

  const report = trustReport(target);
  const charged = new Map<string, number>(
    report.staleness.pendingVessels.map((v) => [v.id, v.entries]),
  );
  expect(charged.get("api")).toBe(3); // the vessel, its light, the shared fairway
  expect(charged.get("lib")).toBe(3);

  const rows = repairRows(target);
  expect(rows).toHaveLength(2);
  for (const row of rows) {
    expect(row.scope.entries).toBe(charged.get(row.scope.vessels[0])!);
    expect(row.scope.soundings).toBe(row.scope.entries);
  }
  expect(rows.every((r) => r.scope.entries === 3)).toBe(true); // each charge includes the shared fairway
});

// ---------------------------------------------------------------------------
// Chat rendering: the queue post stays complete (the design struck the cap)
// and deterministic; an empty queue renders empty (preserved behavior).
// ---------------------------------------------------------------------------

test("resurvey chat: a wide queue renders every row uncapped and deterministically; an empty queue renders empty", () => {
  const dirs: Dirs = Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => {
      const id = `v${String(i + 1).padStart(2, "0")}`;
      return [id, `pkg/${id}`];
    }),
  );
  const target = makeProvince(dirs);
  writeChart(target, [
    ...Object.keys(dirs).map((id) => vesselEntry(id, dirs)),
    ...Object.keys(dirs).map((id) => lightEntry(id, dirs)),
  ]);
  for (const dir of Object.values(dirs)) drift(target, dir);

  const rendered = renderQueueChat(computeProposals(target));
  expect(renderQueueChat(computeProposals(target))).toBe(rendered); // deterministic
  const numbered = rendered.split("\n").filter((line) => /^\d+\. repair — /.test(line));
  expect(numbered).toHaveLength(12); // complete: every repair row is posted
  expect(rendered).toContain("12. repair — "); // past the struck cap of ten
  expect(rendered).toContain("12 expedition proposals");

  expect(renderQueueChat({ proposals: [] })).toBe(""); // a still province posts nothing
});
