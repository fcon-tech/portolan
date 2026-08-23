import { test, expect, afterEach } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { diffNotices, renderNotices } from "./notices";
import { refreshStaleness } from "./staleness";
import { readChart, writeChart, NOTICES_FILE } from "./chart-store";
import { chartDir } from "./chart-io";
import type { ChartEntry, IndexedEntry } from "./types";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

const vessel: ChartEntry = {
  kind: "vessel",
  id: "web",
  name: "Web frontend",
  behavior: "Serves the SPA.",
  paths: ["pkg"],
  anchors: [{ type: "file", path: "pkg/main.ts", line: 1 }],
  trust: "charted",
};

const light: ChartEntry = {
  kind: "light",
  id: "l-users",
  vessel: "web",
  name: "GET /api/users",
  anchors: [{ type: "file", path: "pkg/router.ts", line: 42 }],
  trust: "measured",
};

const indexed = (entry: ChartEntry, stale = false): IndexedEntry =>
  ({ ...entry, stale } as IndexedEntry);

test("diffNotices reports added and retired entries with anchors", () => {
  const before = [indexed(vessel)];
  const after = [indexed(vessel), indexed(light)];
  const added = diffNotices(before, after);
  expect(added).toHaveLength(1);
  expect(added[0]?.action).toBe("added");
  expect(added[0]?.anchors[0]).toEqual({ type: "file", path: "pkg/router.ts", line: 42 });

  const retired = diffNotices(after, before);
  expect(retired).toHaveLength(1);
  expect(retired[0]?.action).toBe("retired");
  expect(retired[0]?.kind).toBe("light");
  expect(retired[0]?.id).toBe("l-users");
});

test("diffNotices reports a content change as corrected with changed fields", () => {
  const repairedBehavior = indexed({ ...vessel, behavior: "Serves the SPA and SSE." });
  const notices = diffNotices([indexed(vessel)], [repairedBehavior]);
  expect(notices).toHaveLength(1);
  expect(notices[0]?.action).toBe("corrected");
  expect(notices[0]?.note).toContain("changed: behavior");
});

test("diffNotices reports fresh-to-stale as markedStale and repair as corrected", () => {
  const marked = diffNotices([indexed(vessel)], [indexed(vessel, true)]);
  expect(marked).toHaveLength(1);
  expect(marked[0]?.action).toBe("markedStale");
  expect(marked[0]?.note).toContain("sources changed since the last survey");

  // A repair clears the stale flag — even with identical surveyed content.
  const repaired = diffNotices([indexed(vessel, true)], [indexed(vessel)]);
  expect(repaired).toHaveLength(1);
  expect(repaired[0]?.action).toBe("corrected");
  expect(repaired[0]?.note).toContain("repaired (was pending correction)");
});

test("identical states produce no notices", () => {
  expect(diffNotices([indexed(vessel)], [indexed(vessel)])).toEqual([]);
  // Stale already marked: a repeated marking is not news.
  expect(diffNotices([indexed(vessel, true)], [indexed(vessel, true)])).toEqual([]);
});

test("renderNotices names entries and anchors in plain text", () => {
  const notices = diffNotices(
    [indexed(vessel, true)],
    [indexed(light), indexed({ ...vessel, behavior: "Serves the SPA and SSE." })]
  );
  const text = renderNotices(notices);
  expect(text.startsWith("NOTICES TO MARINERS")).toBe(true);
  expect(text).toContain("ADDED         light/l-users");
  expect(text).toContain("anchor: pkg/router.ts:42");
  expect(text).toContain("CORRECTED     vessel/web — changed: behavior; repaired (was pending correction)");
  expect(renderNotices([])).toBe("");
});

test("repair scenario: edit → marked stale → repair produces a notice with entry, correction, anchor", () => {
  const target = mkdtempSync(join(tmpdir(), "portolan-notice-"));
  targets.push(target);
  mkdirSync(join(target, "pkg"), { recursive: true });
  writeFileSync(join(target, "pkg/main.ts"), "export const v = 1;\n");
  writeFileSync(join(target, "pkg/router.ts"), "export const r = 2;\n");

  // Expedition 1: first survey.
  writeChart(target, [vessel, light]);

  // Source change flips the vessel to pending correction.
  writeFileSync(join(target, "pkg/main.ts"), "export const v = 2; // drifted\n");
  const refresh = refreshStaleness(target);
  expect(refresh.noticesText).toContain("MARKED STALE");
  expect(refresh.noticesText).toContain("vessel/web");
  expect(refresh.noticesText).toContain("anchor: pkg/main.ts:1");
  expect(readChart(target).find((e) => e.kind === "vessel")?.stale).toBe(true);

  // Expedition 2: the repair — re-survey with corrected behavior.
  const repairedChart: ChartEntry[] = [
    { ...vessel, behavior: "Serves the SPA and the SSE stream." },
    light,
  ];
  const repair = writeChart(target, repairedChart);

  const notice = repair.notices.find((n) => n.kind === "vessel" && n.id === "web");
  expect(notice).toBeDefined();
  expect(notice?.action).toBe("corrected");
  expect(notice?.note).toContain("repaired (was pending correction)");
  expect(notice?.note).toContain("changed: behavior");
  expect(notice?.anchors).toContainEqual({ type: "file", path: "pkg/main.ts", line: 1 });

  const onDisk = readFileSync(join(chartDir(target), NOTICES_FILE), "utf8");
  expect(onDisk).toContain("CORRECTED");
  expect(onDisk).toContain("vessel/web");
  expect(onDisk).toContain("anchor: pkg/main.ts:1");
  expect(readChart(target).find((e) => e.kind === "vessel")?.stale).toBe(false);
});

test("a write with no changes leaves no notices file behind", () => {
  const target = mkdtempSync(join(tmpdir(), "portolan-notice-"));
  targets.push(target);
  mkdirSync(join(target, "pkg"), { recursive: true });
  writeFileSync(join(target, "pkg/main.ts"), "export const v = 1;\n");
  writeFileSync(join(target, "pkg/router.ts"), "export const r = 2;\n");

  const first = writeChart(target, [vessel, light]);
  expect(first.notices.length).toBe(2); // first survey: everything added
  const noticesPath = join(chartDir(target), NOTICES_FILE);
  expect(existsSync(noticesPath)).toBe(true);

  expect(refreshStaleness(target).notices).toEqual([]); // no source changes
  writeChart(target, [vessel, light]); // identical rewrite: nothing to report
  expect(existsSync(noticesPath)).toBe(false);
});
