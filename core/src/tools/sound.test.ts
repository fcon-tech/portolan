/**
 * Soundings tests — one section per tasks.md item, each test named for the
 * living openspec/specs/tools scenario it proves.
 */
import { test, expect, afterEach } from "bun:test";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import type { FairwayEntry, VesselEntry } from "../types";
import { appendReceipt } from "./log";
import { findBinary } from "./shared";
import * as sound from "./sound";
import { SoundingError, soundAnchor, soundEdge, soundingResult } from "./sound";
import * as portolan from "../index";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

// rg backs the sound.edge reference means; those tests skip where rg is absent.
const rgPresent = findBinary("rg") !== undefined;

// ---------------------------------------------------------------------------
// The fixture province: harbor (the target vessel), tug (declares the
// dependency in its manifest), convoy (manifest-silent, references harbor in
// its files), ghost (neither declares nor references).
// ---------------------------------------------------------------------------

function makeProvince(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-sound-"));
  targets.push(target);
  mkdirSync(join(target, "harbor"), { recursive: true });
  mkdirSync(join(target, "tug"), { recursive: true });
  mkdirSync(join(target, "convoy", "deep"), { recursive: true });
  mkdirSync(join(target, "ghost"), { recursive: true });

  writeFileSync(
    join(target, "harbor", "harbor.ts"),
    [
      "// the harbor module",
      "export function moor(vessel: string): string {",
      "  return `moored:${vessel}`;",
      "}",
    ].join("\n") + "\n",
  );
  writeFileSync(
    join(target, "tug", "package.json"),
    [
      "{",
      '  "name": "tug",',
      '  "version": "1.0.0",',
      '  "dependencies": {',
      '    "harbor-service": "^1.0.0"',
      "  }",
      "}",
    ].join("\n") + "\n",
  );
  writeFileSync(
    join(target, "tug", "tug.ts"),
    ["// the tug pulls on its own", "export function pull(): number {", "  return 1;", "}"].join("\n") + "\n",
  );
  writeFileSync(
    join(target, "convoy", "convoy.ts"),
    [
      "// convoy moves goods",
      'import { moor } from "../harbor/harbor";',
      "export function sail(): string {",
      '  return moor("nerva");',
      "}",
    ].join("\n") + "\n",
  );
  writeFileSync(
    join(target, "convoy", "deep", "ref.ts"),
    "// deep reference: the convoy plan mentions harbor\n",
  );
  writeFileSync(
    join(target, "ghost", "ghost.ts"),
    ['// the ghost vessel drifts alone', 'export const NAME = "ghost";'].join("\n") + "\n",
  );
  return target;
}

const harbor: VesselEntry = {
  kind: "vessel",
  id: "harbor",
  name: "harbor-service",
  paths: ["harbor"],
  anchors: [{ type: "file", path: "harbor/harbor.ts", line: 1 }],
  trust: "measured",
};
const tug: VesselEntry = {
  kind: "vessel",
  id: "tug",
  name: "tug",
  behavior: "Pulls other vessels.",
  paths: ["tug"],
  anchors: [{ type: "manifest", path: "tug/package.json", key: "name" }],
  trust: "charted",
};
const convoy: VesselEntry = {
  kind: "vessel",
  id: "convoy",
  name: "convoy",
  paths: ["convoy"],
  anchors: [{ type: "file", path: "convoy/convoy.ts", line: 1 }],
  trust: "measured",
};
const ghost: VesselEntry = {
  kind: "vessel",
  id: "ghost",
  name: "ghost",
  paths: ["ghost"],
  anchors: [{ type: "file", path: "ghost/ghost.ts", line: 1 }],
  trust: "unsurveyed",
};

const tugFairway: FairwayEntry = {
  kind: "fairway",
  id: "fw-tug-harbor",
  from: "tug",
  to: "harbor",
  anchors: [{ type: "manifest", path: "tug/package.json", key: "dependencies.harbor-service" }],
  trust: "charted",
};
const convoyFairway: FairwayEntry = {
  kind: "fairway",
  id: "fw-convoy-harbor",
  from: "convoy",
  to: "harbor",
  anchors: [{ type: "file", path: "convoy/convoy.ts", line: 2 }],
  trust: "measured",
};
const ghostFairway: FairwayEntry = {
  kind: "fairway",
  id: "fw-ghost-harbor",
  from: "ghost",
  to: "harbor",
  anchors: [{ type: "file", path: "ghost/ghost.ts", line: 1 }],
  trust: "reported",
};

// ---------------------------------------------------------------------------
// 1. Verdict shape
// ---------------------------------------------------------------------------

test("a confirmed result cannot be constructed without anchored evidence", () => {
  let err: unknown;
  try {
    soundingResult("confirmed", [], "confirmed: nothing");
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(SoundingError);
  expect((err as SoundingError).message).toContain("confirmed");
  expect((err as SoundingError).message).toContain("evidence");

  // The verdict vocabulary is closed: garbage verdicts are rejected too.
  try {
    soundingResult("probably" as never, [], "x");
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(SoundingError);
  expect((err as SoundingError).message).toContain("vocabulary");

  // Evidence must be anchored: a bare finding without an anchor is refused.
  try {
    soundingResult("confirmed", [{ found: "somewhere", anchor: { type: "file" } as never }], "x");
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(SoundingError);
  expect((err as SoundingError).message).toContain("anchor");

  // Refuted and unconfirmed results construct with their (possibly empty)
  // evidence lists; only confirmed requires evidence.
  expect(soundingResult("refuted", [], "refuted").verdict).toBe("refuted");
  expect(soundingResult("unconfirmed", [], "unconfirmed").verdict).toBe("unconfirmed");
});

/** Determinism harness (tasks.md 1.2): same sounding, unchanged target, deep-compare. */
function assertSameSoundingTwice<T>(run: () => T): T {
  const first = run();
  const second = run();
  expect(second).toEqual(first);
  expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  return first;
}

test("repeated sound.anchor runs agree on verdict and evidence", () => {
  const target = makeProvince();
  appendReceipt(target, { command: "sweep pattern=harbor", scope: "harbor/", outcome: "ok: 1 chunk" });

  const confirmed = assertSameSoundingTwice(() =>
    soundAnchor(target, {
      anchor: { type: "file", path: "harbor/harbor.ts", line: 3 },
      content: "  return `moored:${vessel}`;",
    }),
  );
  expect(confirmed.verdict).toBe("confirmed");

  const refutedFile = assertSameSoundingTwice(() =>
    soundAnchor(target, { anchor: { type: "file", path: "harbor/wreck.ts", line: 1 } }),
  );
  expect(refutedFile.verdict).toBe("refuted");

  const confirmedReceipt = assertSameSoundingTwice(() =>
    soundAnchor(target, { anchor: { type: "receipt", id: "r1" } }),
  );
  expect(confirmedReceipt.verdict).toBe("confirmed");
});

test.skipIf(!rgPresent)("repeated sound.edge runs agree on verdict and evidence", () => {
  const target = makeProvince();

  const confirmed = assertSameSoundingTwice(() =>
    soundEdge(target, { fairway: tugFairway, source: tug, target: harbor }),
  );
  expect(confirmed.verdict).toBe("confirmed");

  const unconfirmed = assertSameSoundingTwice(() =>
    soundEdge(target, { fairway: ghostFairway, source: ghost, target: harbor }),
  );
  expect(unconfirmed.verdict).toBe("unconfirmed");
});

// ---------------------------------------------------------------------------
// 2. sound.anchor — file anchors
// ---------------------------------------------------------------------------

test("a truthful anchor is confirmed with the content found at the cited location", () => {
  const target = makeProvince();
  const result = soundAnchor(target, {
    anchor: { type: "file", path: "harbor/harbor.ts", line: 3 },
    content: "  return `moored:${vessel}`;",
  });

  expect(result.verdict).toBe("confirmed");
  expect(result.evidence.length).toBeGreaterThan(0);
  expect(result.evidence[0]!.found).toContain("return `moored:${vessel}`;");
  expect(result.evidence[0]!.anchor).toEqual({ type: "file", path: "harbor/harbor.ts", line: 3 });
  expect(result.report).toContain("harbor/harbor.ts:3");

  // A multi-line range with a matching multi-line citation confirms too.
  const multi = soundAnchor(target, {
    anchor: { type: "file", path: "harbor/harbor.ts", line: 2 },
    endLine: 3,
    content: ["export function moor(vessel: string): string {", "  return `moored:${vessel}`;"].join("\n"),
  });
  expect(multi.verdict).toBe("confirmed");

  // Pure re-indentation is not drift: lines compare trimmed per side.
  const reindented = soundAnchor(target, {
    anchor: { type: "file", path: "harbor/harbor.ts", line: 3 },
    content: "return `moored:${vessel}`;",
  });
  expect(reindented.verdict).toBe("confirmed");
});

test("a fabricated file is refuted naming the cited path", () => {
  const target = makeProvince();
  const result = soundAnchor(target, {
    anchor: { type: "file", path: "harbor/wreck.ts", line: 1 },
  });

  expect(result.verdict).toBe("refuted");
  expect(result.evidence[0]!.found).toContain("harbor/wreck.ts");
  expect(result.evidence[0]!.found).toContain("does not exist");
  expect(result.evidence[0]!.anchor).toEqual({ type: "file", path: "harbor/wreck.ts", line: 1 });
  expect(result.report).toContain("harbor/wreck.ts");
});

test("content drift is refuted showing what the range actually holds", () => {
  const target = makeProvince();
  const result = soundAnchor(target, {
    anchor: { type: "file", path: "harbor/harbor.ts", line: 3 },
    content: "  return `sunk:${vessel}`;",
  });

  expect(result.verdict).toBe("refuted");
  expect(result.evidence[0]!.found).toContain("return `moored:${vessel}`;");
  expect(result.evidence[0]!.found).toContain("harbor/harbor.ts:3");
  expect(result.report).toContain("drift");
});

test("an out-of-range line is refuted naming the file and its actual length", () => {
  const target = makeProvince();

  const beyond = soundAnchor(target, {
    anchor: { type: "file", path: "harbor/harbor.ts", line: 999 },
  });
  expect(beyond.verdict).toBe("refuted");
  expect(beyond.report).toContain("harbor/harbor.ts");
  expect(beyond.report).toContain("999");
  expect(beyond.report).toContain("4 line");

  // A range whose end runs past the file is out of range as well.
  const rangeEnd = soundAnchor(target, {
    anchor: { type: "file", path: "harbor/harbor.ts", line: 3 },
    endLine: 9,
    content: "anything",
  });
  expect(rangeEnd.verdict).toBe("refuted");
  expect(rangeEnd.report).toContain("4 line");
});

test("a file-only citation confirms existence; escaping paths refute", () => {
  const target = makeProvince();

  const exists = soundAnchor(target, { anchor: { type: "file", path: "harbor/harbor.ts" } });
  expect(exists.verdict).toBe("confirmed");
  expect(exists.evidence[0]!.found).toContain("4 line");

  const escape = soundAnchor(target, { anchor: { type: "file", path: "../outside.ts", line: 1 } });
  expect(escape.verdict).toBe("refuted");
  expect(escape.report).toContain("escapes the target root");
});

test("malformed sounding inputs fail loudly instead of guessing a verdict", () => {
  const target = makeProvince();

  let err: unknown;
  try {
    soundAnchor(target, {
      anchor: { type: "file", path: "harbor/harbor.ts" },
      content: "cited content without a cited line",
    });
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(SoundingError);
  expect((err as SoundingError).message).toContain("needs a cited line");

  try {
    soundAnchor(target, {
      anchor: { type: "file", path: "harbor/harbor.ts", line: 4 },
      endLine: 2,
    });
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(SoundingError);
  expect((err as SoundingError).message).toContain("inverted");
});

// ---------------------------------------------------------------------------
// 2. sound.anchor — manifest-key and receipt anchors
// ---------------------------------------------------------------------------

test("a live manifest key is confirmed with its value", () => {
  const target = makeProvince();
  const result = soundAnchor(target, {
    anchor: { type: "manifest", path: "tug/package.json", key: "dependencies.harbor-service" },
  });

  expect(result.verdict).toBe("confirmed");
  expect(result.evidence[0]!.found).toContain('"^1.0.0"');
  expect(result.evidence[0]!.anchor).toEqual({
    type: "manifest",
    path: "tug/package.json",
    key: "dependencies.harbor-service",
  });
});

test("a dead manifest key is refuted, showing the keys that are present", () => {
  const target = makeProvince();
  const result = soundAnchor(target, {
    anchor: { type: "manifest", path: "tug/package.json", key: "dependencies.ghost" },
  });

  expect(result.verdict).toBe("refuted");
  expect(result.evidence[0]!.found).toContain("dependencies.ghost");
  expect(result.evidence[0]!.found).toContain("dependencies.harbor-service");

  // A manifest that is not there refutes too.
  const missing = soundAnchor(target, {
    anchor: { type: "manifest", path: "convoy/package.json", key: "name" },
  });
  expect(missing.verdict).toBe("refuted");
  expect(missing.report).toContain("convoy/package.json");
});

test("a receipt anchor resolves by id, and a dead receipt is refuted naming the id", () => {
  const target = makeProvince();
  appendReceipt(target, { command: "sweep pattern=harbor", scope: "harbor/", outcome: "ok: 1 chunk" });

  const live = soundAnchor(target, { anchor: { type: "receipt", id: "r1" } });
  expect(live.verdict).toBe("confirmed");
  expect(live.evidence[0]!.found).toContain("sweep pattern=harbor");
  expect(live.evidence[0]!.found).toContain("ok: 1 chunk");
  expect(live.evidence[0]!.anchor).toEqual({ type: "receipt", id: "r1" });

  const dead = soundAnchor(target, { anchor: { type: "receipt", id: "r99" } });
  expect(dead.verdict).toBe("refuted");
  expect(dead.report).toContain("r99");
  expect(dead.evidence[0]!.found).toContain("r99");
});

// ---------------------------------------------------------------------------
// 3. sound.edge
// ---------------------------------------------------------------------------

test.skipIf(!rgPresent)(
  "a manifest-declared fairway is confirmed citing the manifest file and key",
  () => {
    const target = makeProvince();
    const result = soundEdge(target, { fairway: tugFairway, source: tug, target: harbor });

    expect(result.verdict).toBe("confirmed");
    expect(result.from).toBe("tug");
    expect(result.to).toBe("harbor");
    expect(result.means.map((m) => m.means)).toEqual(["manifest", "references"]);
    expect(result.means[0]!.found).toBe(true);
    expect(result.evidence).toContainEqual({
      found: expect.stringContaining("harbor-service"),
      anchor: { type: "manifest", path: "tug/package.json", key: "dependencies.harbor-service" },
    });
    expect(result.report).toContain("tug/package.json#dependencies.harbor-service");
  },
);

test.skipIf(!rgPresent)(
  "a manifest-silent, source-referenced fairway is confirmed citing file paths and lines",
  () => {
    const target = makeProvince();
    const result = soundEdge(target, { fairway: convoyFairway, source: convoy, target: harbor });

    expect(result.verdict).toBe("confirmed");
    // The convoy has no manifest: that means is honestly negative...
    expect(result.means[0]!.found).toBe(false);
    expect(result.means[0]!.report).toContain("manifest");
    // ...while its files reference the target vessel.
    expect(result.means[1]!.found).toBe(true);
    const refAnchors = result.means[1]!.evidence.map((e) => e.anchor);
    expect(refAnchors).toEqual([
      { type: "file", path: "convoy/convoy.ts", line: 2 },
      { type: "file", path: "convoy/deep/ref.ts", line: 1 },
    ]);
    const first = result.means[1]!.evidence[0]!;
    expect(first.found).toContain('../harbor/harbor"');
    expect(result.report).toContain("convoy/convoy.ts:2");
  },
);

test.skipIf(!rgPresent)(
  "no deterministic support is unconfirmed, not disproved",
  () => {
    const target = makeProvince();
    const result = soundEdge(target, { fairway: ghostFairway, source: ghost, target: harbor });

    expect(result.verdict).toBe("unconfirmed");
    expect(result.evidence).toEqual([]);
    expect(result.means.map((m) => m.found)).toEqual([false, false]);

    // Each means reports its own negative result: what was checked.
    expect(result.means[0]!.report).toContain("manifest");
    expect(result.means[0]!.report).toContain("ghost");
    expect(result.means[1]!.report).toContain("sweep");
    expect(result.means[1]!.report).toContain("0 referencing lines");

    // And nowhere does the output claim the fairway is absent.
    const everything = JSON.stringify(result);
    expect(everything).not.toMatch(/does not exist|doesn't exist|absent|disprov|nonexistent|no such/i);
    expect(result.report).toContain("unconfirmed");
  },
);

test("sound.edge refuses entries that do not belong together", () => {
  const target = makeProvince();
  let err: unknown;
  try {
    soundEdge(target, { fairway: tugFairway, source: convoy, target: harbor });
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(SoundingError);
  expect((err as SoundingError).message).toContain("fw-tug-harbor");
});

// ---------------------------------------------------------------------------
// 4. Read-only invariants
// ---------------------------------------------------------------------------

/** Snapshot the whole tree: relative path → content hash (perimeter-test style). */
function snapshotTree(root: string): Map<string, string> {
  const snap = new Map<string, string>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      snap.set(
        relative(root, abs),
        createHash("sha256").update(readFileSync(abs)).digest("hex"),
      );
    }
  };
  walk(root);
  return snap;
}

/** A written chart over the province, including a fabricated danger anchor. */
function writeProvinceChart(target: string): ReturnType<typeof portolan.writeChart> {
  return portolan.writeChart(target, [
    harbor,
    tug,
    convoy,
    ghost,
    tugFairway,
    convoyFairway,
    ghostFairway,
    {
      kind: "light",
      id: "l-moor",
      vessel: "harbor",
      name: "export function moor()",
      anchors: [{ type: "file", path: "harbor/harbor.ts", line: 2 }],
      trust: "measured",
    },
    {
      kind: "danger",
      id: "d-wreck",
      vessel: "harbor",
      category: "rock",
      note: "a fabricated citation the sounding must refute but not repair",
      anchors: [{ type: "file", path: "harbor/wreck.ts", line: 1 }],
      trust: "doubtful",
    },
  ]);
}

test.skipIf(!rgPresent)(
  "every verdict kind leaves the chart and the whole target byte-identical",
  () => {
    const target = makeProvince();
    appendReceipt(target, { command: "sweep pattern=harbor", scope: "harbor/", outcome: "ok: 1 chunk" });
    writeProvinceChart(target);

    const entries = portolan.readChart(target);
    const byId = new Map(entries.map((e) => [`${e.kind}/${e.id}`, e]));
    const vesselOf = (id: string): VesselEntry => byId.get(`vessel/${id}`) as VesselEntry;
    const fairwayOf = (id: string): FairwayEntry => byId.get(`fairway/${id}`) as FairwayEntry;

    const before = snapshotTree(target);
    expect(before.has(".portolan/chart/index.jsonl")).toBe(true);

    // The battery: confirmed, refuted, and unconfirmed soundings.
    const results = [
      soundAnchor(target, { anchor: { type: "file", path: "harbor/harbor.ts", line: 3 }, content: "  return `moored:${vessel}`;" }),
      soundAnchor(target, { anchor: { type: "receipt", id: "r1" } }),
      soundAnchor(target, { anchor: { type: "manifest", path: "tug/package.json", key: "dependencies.harbor-service" } }),
      soundEdge(target, { fairway: fairwayOf("fw-tug-harbor"), source: vesselOf("tug"), target: vesselOf("harbor") }),
      soundEdge(target, { fairway: fairwayOf("fw-convoy-harbor"), source: vesselOf("convoy"), target: vesselOf("harbor") }),
      soundAnchor(target, { anchor: { type: "file", path: "harbor/wreck.ts", line: 1 } }),
      soundAnchor(target, { anchor: { type: "file", path: "harbor/harbor.ts", line: 3 }, content: "  return `sunk:${vessel}`;" }),
      soundAnchor(target, { anchor: { type: "file", path: "harbor/harbor.ts", line: 999 } }),
      soundAnchor(target, { anchor: { type: "manifest", path: "tug/package.json", key: "dependencies.ghost" } }),
      soundAnchor(target, { anchor: { type: "receipt", id: "r99" } }),
      soundEdge(target, { fairway: fairwayOf("fw-ghost-harbor"), source: vesselOf("ghost"), target: vesselOf("harbor") }),
    ];
    const verdicts = new Set(results.map((r) => r.verdict));
    expect(verdicts).toEqual(new Set(["confirmed", "refuted", "unconfirmed"]));

    // Nothing was written: the whole target tree is byte-identical.
    expect(snapshotTree(target)).toEqual(before);
  },
);

test("a refuted sounding leaves the entry and its trust label untouched", () => {
  const target = makeProvince();
  writeProvinceChart(target);
  const before = portolan.readChart(target);
  const indexBefore = readFileSync(join(target, ".portolan", "chart", "index.jsonl"), "utf8");

  // The danger entry cites a fabricated file; the sounding refutes it...
  const result = soundAnchor(target, { anchor: { type: "file", path: "harbor/wreck.ts", line: 1 } });
  expect(result.verdict).toBe("refuted");

  // ...and repairs nothing: entry, trust label, staleness, and bytes unchanged.
  const after = portolan.readChart(target);
  expect(after).toEqual(before);
  const danger = after.find((e) => e.id === "d-wreck")!;
  expect(danger.trust).toBe("doubtful");
  expect(danger.stale).toBe(false);
  expect(readFileSync(join(target, ".portolan", "chart", "index.jsonl"), "utf8")).toBe(indexBefore);
});

// ---------------------------------------------------------------------------
// 4.2 API surface
// ---------------------------------------------------------------------------

test("the sounding surface exposes no chart-write or trust-mutation path", () => {
  // The module surface is exactly the sounding entry points — nothing else.
  expect(Object.keys(sound).sort()).toEqual(
    ["SOUNDING_VERDICTS", "SoundingError", "soundAnchor", "soundEdge", "soundingResult"].sort(),
  );

  // And it is exported additively from the public surface, taking the
  // target root plus asserted inputs — no store handle to call.
  expect(typeof portolan.soundAnchor).toBe("function");
  expect(typeof portolan.soundEdge).toBe("function");
  expect(portolan.soundAnchor.length).toBe(2);
  expect(portolan.soundEdge.length).toBe(2);

  // The sounding module never imports the chart store's write path: the
  // store's only writers are writeChart and refreshStaleness, and neither
  // name (nor the module) appears in the sounding source at all.
  const source = readFileSync(join(import.meta.dir, "sound.ts"), "utf8");
  expect(source).not.toContain("writeChart");
  expect(source).not.toContain("writeFilesAtomically");
  expect(source).not.toContain("refreshStaleness");
  expect(source).not.toContain("chart-store");

  // Verdicts are not trust labels: no sounding result carries one, so no
  // sounding output can be mistaken for (or used as) a trust change.
  const target = makeProvince();
  appendReceipt(target, { command: "sweep pattern=harbor", outcome: "ok" });
  const results = [
    soundAnchor(target, { anchor: { type: "file", path: "harbor/harbor.ts", line: 3 }, content: "  return `moored:${vessel}`;" }),
    soundAnchor(target, { anchor: { type: "receipt", id: "r1" } }),
    soundAnchor(target, { anchor: { type: "file", path: "harbor/wreck.ts", line: 1 } }),
    soundAnchor(target, { anchor: { type: "receipt", id: "r99" } }),
  ];
  for (const result of results) {
    expect("trust" in result).toBe(false);
    expect(JSON.stringify(result)).not.toContain('"trust"');
  }
});

test("an in-target symlink pointing outside the target is refuted as an escape", () => {
  const target = makeProvince();
  const secretDir = mkdtempSync(join(tmpdir(), "portolan-outside-"));
  targets.push(secretDir);
  writeFileSync(join(secretDir, "secret.txt"), "outside content\n");
  symlinkSync(join(secretDir, "secret.txt"), join(target, "harbor", "link.txt"));

  const result = soundAnchor(target, { anchor: { type: "file", path: "harbor/link.txt", line: 1 } });
  expect(result.verdict).toBe("refuted");
  expect(result.evidence[0]!.found).toContain("escapes the target root");
});
