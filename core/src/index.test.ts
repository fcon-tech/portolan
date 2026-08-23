import { test, expect, afterEach } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as portolan from "./index";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

test("the public surface exports the chart foundation", () => {
  for (const name of [
    "TRUST_LABELS",
    "ENTRY_KINDS",
    "formatAnchor",
    "validateEntries",
    "validateEntry",
    "ChartValidationError",
    "chartDir",
    "readChart",
    "writeChart",
    "treeSignature",
    "refreshStaleness",
    "diffNotices",
    "renderNotices",
  ] as const) {
    expect(typeof (portolan as Record<string, unknown>)[name]).not.toBe("undefined");
  }
});

test("smoke: write → edit file → refresh → notice, end-to-end on a temp target", () => {
  const target = mkdtempSync(join(tmpdir(), "portolan-smoke-"));
  targets.push(target);
  mkdirSync(join(target, "srv"), { recursive: true });
  writeFileSync(join(target, "srv/main.ts"), "export function start() {}\n");

  // 1. An expedition surveys and writes the chart.
  const write = portolan.writeChart(target, [
    {
      kind: "vessel",
      id: "srv",
      name: "Server",
      behavior: "Listens on a port.",
      paths: ["srv"],
      anchors: [{ type: "file", path: "srv/main.ts", line: 1 }],
      trust: "measured",
    },
    {
      kind: "light",
      id: "l-start",
      vessel: "srv",
      name: "export function start()",
      anchors: [{ type: "file", path: "srv/main.ts", line: 1 }],
      trust: "measured",
    },
  ]);
  const dir = portolan.chartDir(target);
  expect(write.dir).toBe(dir);
  expect(existsSync(join(dir, "index.jsonl"))).toBe(true);
  expect(readdirSync(dir)).toContain("srv.md");

  // 2. Outside forces edit a source file.
  writeFileSync(join(target, "srv/main.ts"), "export function start(port: number) { listen(port); }\n");

  // 3. The next expedition refreshes staleness and reads the notice.
  const refresh = portolan.refreshStaleness(target);
  expect(refresh.changedVessels).toEqual(["srv"]);
  expect(refresh.noticesText).toContain("MARKED STALE");
  expect(refresh.noticesText).toContain("vessel/srv");
  expect(refresh.noticesText).toContain("anchor: srv/main.ts:1");
  expect(portolan.readChart(target).find((e) => e.kind === "vessel")?.stale).toBe(true);

  // 4. The expedition repairs the chart and reports the correction.
  const repair = portolan.writeChart(target, [
    {
      kind: "vessel",
      id: "srv",
      name: "Server",
      behavior: "Listens on a configurable port.",
      paths: ["srv"],
      anchors: [{ type: "file", path: "srv/main.ts", line: 1 }],
      trust: "measured",
    },
    {
      kind: "light",
      id: "l-start",
      vessel: "srv",
      name: "export function start()",
      anchors: [{ type: "file", path: "srv/main.ts", line: 1 }],
      trust: "measured",
    },
  ]);
  expect(repair.noticesText).toContain("CORRECTED");
  expect(repair.noticesText).toContain("repaired (was pending correction)");
  expect(portolan.readChart(target).find((e) => e.kind === "vessel")?.stale).toBe(false);
});
