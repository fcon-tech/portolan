/**
 * Fixture for chart-io.rollback.test.ts — runs in its OWN process because
 * mock.module("node:fs") must not leak into the main test runner's module
 * registry (it deadlocked the full-suite run). Applies the sabotaged
 * renameSync, performs the failing write, and prints the resulting
 * directory state as JSON on stdout.
 *
 *   bun src/chart-io.rollback-fixture.ts <dir> <sabotageAt>
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [dir, sabotageArg] = process.argv.slice(2);
if (!dir || !sabotageArg) throw new Error("usage: rollback-fixture.ts <dir> <sabotageAt>");
const sabotageAt = Number(sabotageArg);

const real = await import("node:fs");
let renameCalls = 0;
const { mock } = await import("bun:test");
mock.module("node:fs", () => ({
  ...real,
  renameSync: (from: string, to: string) => {
    renameCalls += 1;
    if (renameCalls === sabotageAt) throw new Error("sabotaged rename (simulated ENOSPC)");
    return real.renameSync(from, to);
  },
}));

const { writeFilesAtomically } = await import("./chart-io");

// Two existing files (each replace costs two renames: final→bak,
// tmp→final) plus one new file.
writeFileSync(join(dir, "a.md"), "old a\n");
writeFileSync(join(dir, "b.md"), "old b\n");
const files = new Map<string, string>([
  ["a.md", "new a\n"],
  ["b.md", "new b\n"],
  ["c.md", "new c\n"],
]);

let threw: string | null = null;
try {
  writeFilesAtomically(dir, files);
} catch (err) {
  threw = (err as Error).message;
}

const ls = readdirSync(dir).sort();
const contents: Record<string, string> = {};
for (const name of ls) {
  contents[name] = readFileSync(join(dir, name), "utf8");
}
process.stdout.write(
  `${JSON.stringify({ threw, ls, contents }, null, 1)}\n`
);
