/**
 * Publish gate decision — openspec/changes/distribution-pass, task 4.1.
 *
 * Publishing is authorized only by a grown `@fcon-tech/portolan` version on
 * a merge to main; no long-lived secrets exist (npm trusted publishing,
 * OIDC, in .github/workflows/publish.yml). Before the Governor's one-time
 * setup (first manual release + trusted-publisher config), the package does
 * not exist on npm: the gate reports `blocked` naming that step and never
 * attempts a publish. Account-bound steps stay account-bound (spec:
 * "Account-bound steps belong to the Governor").
 *
 * The decision is a pure function (`decidePublish`); this file's CLI prints
 * one of publish / skip / blocked and exits 0 / 0 / 1 accordingly. Unit
 * tests in publish-gate.test.ts cover all three outcomes with an injected
 * npm probe.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PACKAGE = "@fcon-tech/portolan";

export interface NpmViewResult {
  ok: boolean;
  /** true when `npm view` failed because the package is not on npm (404). */
  notFound: boolean;
  stdout?: string;
}

export type GateOutcome = "publish" | "skip" | "blocked";

/** Compare dotted-numeric versions; only strict growth authorizes publish. */
export function versionGrew(prev: string, cur: string): boolean {
  if (!/^\d+(\.\d+)*$/.test(prev) || !/^\d+(\.\d+)*$/.test(cur)) return false;
  const a = prev.split(".").map(Number);
  const b = cur.split(".").map(Number);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const d = (b[i] ?? 0) - (a[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

export function decidePublish(deps: {
  previousVersion: string;
  currentVersion: string;
  npmView: () => NpmViewResult;
}): { outcome: GateOutcome; message: string } {
  const { previousVersion, currentVersion, npmView } = deps;
  if (!versionGrew(previousVersion, currentVersion)) {
    return { outcome: "skip", message: "skip: version unchanged" };
  }
  const view = npmView();
  if (!view.ok) {
    if (view.notFound) {
      return {
        outcome: "blocked",
        message:
          "BLOCKED: Governor one-time setup pending (first manual release + " +
          "trusted-publisher config in npm settings; see " +
          "openspec/changes/distribution-pass runbook)",
      };
    }
    return { outcome: "blocked", message: "BLOCKED: npm view failed" };
  }
  return {
    outcome: "publish",
    message: `publish: ${PACKAGE}@${currentVersion} (grew from ${previousVersion})`,
  };
}

/** Run `npm view <pkg> version`; a 404 means the package is not on npm yet. */
function npmView(): NpmViewResult {
  const proc = Bun.spawnSync(["npm", "view", PACKAGE, "version"]);
  if (proc.exitCode === 0) {
    return { ok: true, notFound: false, stdout: proc.stdout.toString().trim() };
  }
  const err = proc.stderr.toString();
  return { ok: false, notFound: err.includes("E404") };
}

function previousCommitVersion(): string {
  const proc = Bun.spawnSync(["git", "show", "HEAD^:package.json"]);
  if (proc.exitCode !== 0) return "0.0.0"; // no previous commit: treat as growth
  return (JSON.parse(proc.stdout.toString()) as { version: string }).version;
}

if (import.meta.main) {
  const currentVersion = (
    JSON.parse(readFileSync(join(import.meta.dir, "..", "package.json"), "utf8")) as {
      version: string;
    }
  ).version;
  const r = decidePublish({
    previousVersion: previousCommitVersion(),
    currentVersion,
    npmView,
  });
  console.log(r.outcome === "publish" ? `publish ${currentVersion}` : r.message);
  // Expose the decision to the publish workflow as a step output.
  const ghOutput = process.env.GITHUB_OUTPUT;
  if (ghOutput) {
    const fs = await import("node:fs");
    fs.appendFileSync(ghOutput, `decision=${r.outcome}\n`);
  }
  process.exit(r.outcome === "publish" ? 0 : r.outcome === "skip" ? 0 : 1);
}
