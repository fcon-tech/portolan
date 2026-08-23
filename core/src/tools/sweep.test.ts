import { test, expect, afterEach } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findBinary } from "./shared";
import { sweep, SweepError } from "./sweep";
import { MissingBinaryError } from "./shared";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

function makeTarget(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-sweep-"));
  targets.push(target);
  mkdirSync(join(target, "srv"), { recursive: true });
  writeFileSync(
    join(target, "srv", "harbor.ts"),
    [
      "// the harbor module",
      "export const HARBOR_NAME = 'nerva';",
      "export function moor(vessel: string): string {",
      "  return `moored:${vessel}`;",
      "}",
      "// HARBOR_NAME is measured twice",
    ].join("\n") + "\n",
  );
  writeFileSync(
    join(target, "srv", "tide.ts"),
    [
      "// the tide module knows HARBOR_NAME",
      "export const TIDE = 'ebb';",
    ].join("\n") + "\n",
  );
  writeFileSync(join(target, "notes.md"), "no code here, just HARBOR_NAME notes\n");
  return target;
}

// rg is present on this machine; integration tests run and skip elsewhere.
const rgPresent = findBinary("rg") !== undefined;

test.skipIf(!rgPresent)("matches come back anchored and measured", () => {
  const target = makeTarget();
  const result = sweep(target, "HARBOR_NAME");

  expect(result.trust).toBe("measured");
  expect(result.pattern).toBe("HARBOR_NAME");
  // 3 occurrences: harbor.ts:2, harbor.ts:6, tide.ts:1, notes.md:1 → 4
  expect(result.chunks.length).toBe(4);

  const harbor = result.chunks.find((c) => c.path === "srv/harbor.ts" && c.line === 2)!;
  expect(harbor.text).toContain("HARBOR_NAME");
  expect(harbor.match).toBe("HARBOR_NAME");
  expect(harbor.anchor).toEqual({ type: "file", path: "srv/harbor.ts", line: 2 });

  const paths = result.chunks.map((c) => `${c.path}:${c.line}`);
  expect(paths).toEqual([
    "notes.md:1",
    "srv/harbor.ts:2",
    "srv/harbor.ts:6",
    "srv/tide.ts:1",
  ]);
});

test.skipIf(!rgPresent)("context lines surround the match when requested", () => {
  const target = makeTarget();
  const result = sweep(target, "moor\\(", { context: 1 });

  expect(result.chunks.length).toBe(1);
  const chunk = result.chunks[0]!;
  expect(chunk.path).toBe("srv/harbor.ts");
  expect(chunk.line).toBe(3);
  expect(chunk.context).toEqual([
    "export const HARBOR_NAME = 'nerva';",
    "  return `moored:${vessel}`;",
  ]);
});

test.skipIf(!rgPresent)("a glob filter narrows the sweep", () => {
  const target = makeTarget();
  const result = sweep(target, "HARBOR_NAME", { glob: "*.ts" });
  expect(result.chunks.every((c) => c.path.endsWith(".ts"))).toBe(true);
  expect(result.chunks.length).toBe(3);
});

test.skipIf(!rgPresent)("no match is an honest empty result, not an error", () => {
  const target = makeTarget();
  const result = sweep(target, "THIS_OCCURS_NOWHERE");
  expect(result.chunks).toEqual([]);
  expect(result.trust).toBe("measured");
});

test.skipIf(!rgPresent)("a malformed pattern is rejected, naming the pattern", () => {
  const target = makeTarget();
  const bad = "([unclosed";
  let err: unknown;
  try {
    sweep(target, bad);
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(SweepError);
  const sweepErr = err as SweepError;
  expect(sweepErr.pattern).toBe(bad);
  expect(sweepErr.message).toContain(bad);
  expect(sweepErr.message).toContain("ripgrep");
});

test("missing ripgrep errors clearly and does not degrade sweep", () => {
  const target = makeTarget();
  // A PATH with no rg on it — the tool must name the binary, not substitute.
  const emptyPath = mkdtempSync(join(tmpdir(), "portolan-no-rg-"));
  targets.push(emptyPath);
  let err: unknown;
  try {
    sweep(target, "HARBOR_NAME", { env: { PATH: emptyPath } });
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(MissingBinaryError);
  const missing = err as MissingBinaryError;
  expect(missing.binary).toBe("rg");
  expect(missing.message).toContain("no results were gathered");
  expect(missing.message).toContain("no substitute search was attempted");
});

test.skipIf(!rgPresent)("a non-directory target root is a clear error", () => {
  let err: unknown;
  try {
    sweep(join(tmpdir(), "portolan-no-such-root"), "x");
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(SweepError);
  expect((err as SweepError).message).toContain("not a directory");
});
