import { test, expect, afterEach } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { formatAnchor } from "../types";
import {
  appendReceipt,
  LogError,
  logFile,
  readReceipt,
  readReceipts,
  receiptAnchor,
  resolveReceiptAnchor,
} from "./log";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

function makeTarget(): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-log-"));
  targets.push(target);
  return target;
}

test("a command leaves a receipt, readable by id", () => {
  const target = makeTarget();
  const first = appendReceipt(target, {
    command: "sweep pattern=CartService",
    scope: "src/",
    outcome: "ok: 3 chunks",
  });
  const second = appendReceipt(target, {
    command: "symbols name=CartService",
    outcome: "ok: 1 definition",
  });

  expect(first.id).toBe("r1");
  expect(second.id).toBe("r2");
  expect(existsSync(logFile(target))).toBe(true);

  const read = readReceipt(target, "r1");
  expect(read).toBeDefined();
  expect(read!.command).toBe("sweep pattern=CartService");
  expect(read!.scope).toBe("src/");
  expect(read!.outcome).toBe("ok: 3 chunks");
  expect(read!.recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

  const read2 = readReceipt(target, "r2");
  expect(read2!.command).toBe("symbols name=CartService");
  expect(read2!.outcome).toBe("ok: 1 definition");
});

test("the log is JSONL: one receipt per line, ids monotonic", () => {
  const target = makeTarget();
  appendReceipt(target, { command: "a", outcome: "ok" });
  appendReceipt(target, { command: "b", outcome: "ok" });
  appendReceipt(target, { command: "c", outcome: "error: x" });

  const lines = readFileSync(logFile(target), "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  expect(lines.length).toBe(3);
  expect(lines.map((l) => (JSON.parse(l) as { id: string }).id)).toEqual(["r1", "r2", "r3"]);
});

test("receipts anchor chart entries, in the exact anchor form", () => {
  const target = makeTarget();
  const receipt = appendReceipt(target, {
    command: "manifests path=go.mod",
    outcome: "ok: 4 facts",
  });

  // The anchor a chart entry would cite...
  const anchor = receiptAnchor(receipt.id);
  expect(anchor).toEqual({ type: "receipt", id: "r1" });
  expect(formatAnchor(anchor)).toBe("receipt:r1");

  // ...resolves back to the stored receipt.
  const resolved = resolveReceiptAnchor(target, anchor);
  expect(resolved).toBeDefined();
  expect(resolved!.command).toBe("manifests path=go.mod");
  expect(resolved!.outcome).toBe("ok: 4 facts");
});

test("log.read filters by command, scope, and outcome", () => {
  const target = makeTarget();
  appendReceipt(target, { command: "sweep", scope: "src/", outcome: "ok" });
  appendReceipt(target, { command: "symbols", scope: "src/", outcome: "error" });
  appendReceipt(target, { command: "sweep", scope: "docs/", outcome: "ok" });

  expect(readReceipts(target).length).toBe(3);
  expect(readReceipts(target, { command: "sweep" }).length).toBe(2);
  expect(readReceipts(target, { scope: "src/" }).length).toBe(2);
  expect(readReceipts(target, { outcome: "error" }).map((r) => r.command)).toEqual(["symbols"]);
  expect(
    readReceipts(target, { command: "sweep", scope: "docs/" }).map((r) => r.id),
  ).toEqual(["r3"]);
});

test("reading an absent id or an empty log is honest, not an error", () => {
  const target = makeTarget();
  expect(readReceipts(target)).toEqual([]);
  expect(readReceipt(target, "r1")).toBeUndefined();

  appendReceipt(target, { command: "sweep", outcome: "ok" });
  expect(readReceipt(target, "r99")).toBeUndefined();
});

test("the log is append-only: re-appending an existing id is refused, file unchanged", () => {
  const target = makeTarget();
  appendReceipt(target, { command: "sweep", outcome: "ok: 1 chunk" });
  const before = readFileSync(logFile(target), "utf8");

  let err: unknown;
  try {
    // An attempted alteration: same id, different outcome.
    appendReceipt(target, { id: "r1", command: "sweep", outcome: "ok: 999 chunks" });
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(LogError);
  expect((err as LogError).message).toContain("append-only");
  expect((err as LogError).message).toContain("r1");

  const after = readFileSync(logFile(target), "utf8");
  expect(after).toBe(before);
});

test("ids are assigned by the log: skipping ahead is refused, file unchanged", () => {
  const target = makeTarget();
  appendReceipt(target, { command: "a", outcome: "ok" });
  const before = readFileSync(logFile(target), "utf8");

  let err: unknown;
  try {
    appendReceipt(target, { id: "r7", command: "b", outcome: "ok" });
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(LogError);
  expect((err as LogError).message).toContain("expected r2");
  expect(readFileSync(logFile(target), "utf8")).toBe(before);
});

test("the log keeps working after a refusal; existing receipts unchanged", () => {
  const target = makeTarget();
  appendReceipt(target, { command: "a", outcome: "ok" });
  try {
    appendReceipt(target, { id: "r1", command: "a", outcome: "tampered" });
  } catch {
    // refused, expected
  }
  const next = appendReceipt(target, { command: "b", outcome: "ok" });
  expect(next.id).toBe("r2");
  expect(readReceipt(target, "r1")!.outcome).toBe("ok");
  expect(readReceipt(target, "r2")!.command).toBe("b");
});

test("a corrupt log line fails loudly, naming the file", () => {
  const target = makeTarget();
  appendReceipt(target, { command: "a", outcome: "ok" });
  const file = logFile(target);
  writeFileSync(file, "{not json}\n");

  let err: unknown;
  try {
    readReceipts(target);
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(LogError);
  expect((err as LogError).message).toContain("corrupt ship's log");
  expect((err as LogError).message).toContain(join(target, ".portolan", "log.jsonl"));
});

test("a live lock is waited out and named; a crashed process's lock is stolen", () => {
  const target = makeTarget();
  mkdirSync(join(target, ".portolan"), { recursive: true });
  const lockPath = join(target, ".portolan", "log.lock");

  // A fresh lock belongs to a live append: the deadline is waited out, then
  // the contention is named loudly — no receipt is written unserialized.
  writeFileSync(lockPath, "");
  expect(() => appendReceipt(target, { command: "x", outcome: "ok" })).toThrow(
    /the ship's log is locked/,
  );
  expect(existsSync(logFile(target))).toBe(false);

  // A lock older than the staleness bound belongs to a crashed process:
  // it is stolen, and the append proceeds with the log's own id assignment.
  const stale = new Date(Date.now() - 20_000);
  writeFileSync(lockPath, "");
  utimesSync(lockPath, stale, stale);
  const receipt = appendReceipt(target, { command: "x", outcome: "ok" });
  expect(receipt.id).toBe("r1");
  expect(existsSync(lockPath)).toBe(false);
});
