/**
 * The external expedition launcher (night-watch design.md, decision 2):
 * the watch never names a harness — it spawns whatever command the operator
 * passed as `--launcher "<cmd>"`, feeds the expedition brief
 * (`{ target, proposal }`) as JSON on stdin, and caps the run with
 * `--launcher-timeout` (default 30m).
 *
 * Contract: exit 0 = the expedition completed; non-zero exit, timeout, or
 * spawn failure = the failure path (the caller records it in the harbor
 * history and names it in the report). The launcher's stdout is consumed
 * and discarded (it must never pollute the watch's postable report); its
 * stderr is forwarded to the watch's stderr so a stuck launcher is visible
 * in the scheduler's mail without breaking stdout determinism.
 *
 * No core module is named here and none is imported by launchers — the
 * adapter boundary (core/src/server/adapter-boundary.ts) holds both ways.
 * openspec/changes/night-watch (harbor capability: the launcher is
 * external and swappable)
 */
import { spawn } from "node:child_process";
import type { Proposal } from "./proposals";

/** What one launch is told: the province and the proposal to execute. */
export interface LaunchBrief {
  /** The province root the expedition runs against. */
  target: string;
  /** The proposal the night watch auto-accepted, exactly as computed. */
  proposal: Proposal;
}

/** How one launch ended. `reason` is deterministic (status, timeout, spawn error). */
export interface LaunchResult {
  ok: boolean;
  reason?: string;
}

/** The default per-launch timeout: 30 minutes (design.md, decision 2). */
export const DEFAULT_LAUNCHER_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Split a launcher command string into argv, honoring double and single
 * quotes so a path with spaces survives: `bash "/path/with spaces/x.sh"`
 * → `["bash", "/path/with spaces/x.sh"]`.
 */
export function splitCommand(command: string): string[] {
  const argv: string[] = [];
  for (const match of command.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)) {
    argv.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return argv;
}

/**
 * Parse a `--launcher-timeout` duration: `<n>ms`, `<n>s`, `<n>m`, `<n>h`,
 * or a bare number (seconds). Throws on anything else — a silently wrong
 * timeout is a silently unbounded launcher.
 */
export function parseDurationMs(value: string): number {
  const match = /^(.+?)(ms|s|m|h)?$/.exec(value.trim());
  const amount = match === null ? NaN : Number(match[1]);
  if (match === null || !Number.isFinite(amount) || amount <= 0) {
    throw new Error(`--launcher-timeout must be a positive duration like 45s, 30m or 1h, got ${JSON.stringify(value)}`);
  }
  const unit = match[2] ?? "s";
  const factor = unit === "ms" ? 1 : unit === "s" ? 1000 : unit === "m" ? 60_000 : 3_600_000;
  return Math.round(amount * factor);
}

/** Render a millisecond duration compactly and deterministically: 250ms, 30m, 1h. */
export function formatDuration(ms: number): string {
  if (ms % 3_600_000 === 0) return `${ms / 3_600_000}h`;
  if (ms % 60_000 === 0) return `${ms / 60_000}m`;
  if (ms % 1000 === 0) return `${ms / 1000}s`;
  return `${ms}ms`;
}

/**
 * Launch one expedition through the external launcher: spawn the command,
 * write the brief as JSON on stdin, wait for exit, and kill the launcher
 * (SIGKILL — a stuck launcher forfeits cleanup) once the timeout burns.
 * Never throws: every failure is a `{ ok: false, reason }` return.
 */
export function launchExpedition(options: {
  launcher: string;
  brief: LaunchBrief;
  timeoutMs: number;
}): Promise<LaunchResult> {
  const argv = splitCommand(options.launcher);
  if (argv.length === 0 || argv[0].length === 0) {
    return Promise.resolve({ ok: false, reason: "no launcher command given" });
  }

  return new Promise<LaunchResult>((resolve) => {
    let child;
    try {
      // detached: the launcher leads its own process group, so a timeout can
      // kill the whole tree — a grandchild holding the stdio pipes would
      // otherwise outlive the cap and hang the watch.
      child = spawn(argv[0], argv.slice(1), { stdio: ["pipe", "pipe", "pipe"], detached: true });
    } catch (err) {
      resolve({ ok: false, reason: `launcher could not be spawned: ${(err as Error).message}` });
      return;
    }

    let settled = false;
    let timedOut = false;
    const killTree = (): void => {
      try {
        process.kill(-child.pid!, "SIGKILL");
      } catch {
        child.kill("SIGKILL"); // the group is gone or unsupported; the child alone then
      }
    };
    const settle = (result: LaunchResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      killTree();
    }, options.timeoutMs);

    child.on("error", (err) => {
      settle({ ok: false, reason: `launcher could not be spawned: ${err.message}` });
    });
    child.on("close", (code, signal) => {
      if (code === 0) {
        settle({ ok: true });
      } else if (code !== null) {
        settle({ ok: false, reason: `launcher exited with status ${code}` });
      } else if (timedOut) {
        settle({ ok: false, reason: `launcher timed out after ${formatDuration(options.timeoutMs)} and was killed` });
      } else {
        settle({ ok: false, reason: `launcher was killed by signal ${signal ?? "unknown"}` });
      }
    });

    // The launcher's stdout must be consumed (a full pipe would deadlock the
    // child) but is never part of the watch report.
    child.stdout?.on("data", () => {});
    // Launcher stderr is forwarded so schedulers see it; it never touches stdout.
    child.stderr?.on("data", (chunk: Buffer) => process.stderr.write(chunk));

    child.stdin.on("error", () => {}); // a launcher that exits before reading stdin is not a spawn bug
    child.stdin.write(`${JSON.stringify(options.brief)}\n`);
    child.stdin.end();
  });
}
