/**
 * CLI entry-point smoke tests (sea-trial tasks.md 1.1): the runner takes
 * a Bigtop checkout path and an answers artifact path, refuses a reduced
 * stand-in corpus with a clear error and exit code 2, and reports usage
 * errors the same way.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { main } from "./run";

const FIXTURE = join(import.meta.dir, "fixtures", "bigtop.bom");

function reducedCorpus(): string {
  const root = join(tmpdir(), `portolan-sea-trial-cli-${crypto.randomUUID()}`);
  mkdirSync(join(root, "repos", "apache-bigtop-repo"), { recursive: true });
  writeFileSync(join(root, "repos", "apache-bigtop-repo", "bigtop.bom"), readFileSync(FIXTURE, "utf8"));
  mkdirSync(join(root, "repos", "apache-spark"), { recursive: true });
  return root;
}

describe("the gate-runner entry point (task 1.1)", () => {
  test("missing --target is a usage error (exit 2)", async () => {
    expect(await main([])).toBe(2);
  });

  test("unknown arguments are usage errors", async () => {
    expect(await main(["--wat"])).toBe(2);
  });

  test("a reduced stand-in corpus is refused with a clear error (exit 2)", async () => {
    const root = reducedCorpus();
    const code = await main(["--target", root, "--answers", join(root, "answers.jsonl")]);
    expect(code).toBe(2);
  });

  test("a missing checkout is a clear error, not a stack trace", async () => {
    const code = await main(["--target", "/nonexistent/portolan-nowhere"]);
    expect(code).toBe(2);
  });
});
