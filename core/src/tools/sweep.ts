/**
 * `sweep`: ripgrep-backed pattern search over the target. Every match comes
 * back as an anchored chunk (path, line, matched text, optional context)
 * labeled `measured`. No match is an honest empty list; a malformed pattern
 * is an error naming the pattern with zero results; a missing ripgrep is an
 * error naming the binary — never a substitute search.
 * (openspec/changes/probe-tools, specs/tools/spec.md)
 */
import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import type { Anchor } from "../types";
import { findBinary, MissingBinaryError, type Env } from "./shared";

export interface SweepOptions {
  /** Surrounding context lines handed to ripgrep (`rg -C`). */
  context?: number;
  /** Glob filter handed to ripgrep (`rg -g`). */
  glob?: string;
  /** Environment override; tests restrict PATH to probe missing-binary paths. */
  env?: Env;
}

/** One anchored match: where it is, what matched, optional context. */
export interface SweepChunk {
  /** File path, relative to the target root when ripgrep reports one. */
  path: string;
  /** 1-based line number of the match. */
  line: number;
  /** The full matching line, without trailing newline. */
  text: string;
  /** The first matched substring. */
  match: string;
  /** Every matched substring on the line. */
  matches: string[];
  /** Surrounding lines, present when `context` was requested. */
  context?: string[];
  /** file:line anchor for chart citations. */
  anchor: Anchor;
}

export interface SweepResult {
  trust: "measured";
  pattern: string;
  chunks: SweepChunk[];
}

/** Raised when ripgrep itself fails (malformed pattern, bad root, ...). */
export class SweepError extends Error {
  readonly pattern: string;
  constructor(pattern: string, message: string) {
    super(`sweep: ${message}`);
    this.name = "SweepError";
    this.pattern = pattern;
  }
}

interface RgText {
  text?: string;
}

/** The subset of ripgrep's --json event stream the tool consumes. */
interface RgEvent {
  type: string;
  data?: {
    path?: RgText;
    lines?: RgText;
    line_number?: number;
    submatches?: Array<{ match?: RgText }>;
  };
}

interface FileEvent {
  line: number;
  text: string;
  isMatch: boolean;
  matches: string[];
}

/** ripgrep reports paths relative to the cwd it ran in; normalize harder. */
function relativeToTarget(path: string, targetRoot: string): string {
  if (path.startsWith("./")) return path.slice(2);
  const root = targetRoot.endsWith("/") ? targetRoot : `${targetRoot}/`;
  if (path.startsWith(root)) return path.slice(root.length);
  return path;
}

function firstLine(text: string): string {
  return (
    text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? ""
  );
}

/**
 * Map ripgrep's --json events to anchored chunks. Only `match` and
 * `context` events carry evidence; begin/end/summary and any unknown event
 * kinds are ignored so a ripgrep version bump degrades gracefully.
 */
function parseRgEvents(
  stdout: string,
  targetRoot: string,
  contextRequested: number,
): SweepChunk[] {
  const perFile = new Map<string, FileEvent[]>();
  for (const raw of stdout.split("\n")) {
    if (raw.trim().length === 0) continue;
    let event: RgEvent;
    try {
      event = JSON.parse(raw) as RgEvent;
    } catch {
      throw new Error(
        `sweep: ripgrep emitted unparseable output: ${raw.slice(0, 120)}`,
      );
    }
    if (event.type !== "match" && event.type !== "context") continue;
    const data = event.data ?? {};
    const path = data.path?.text;
    const line = data.line_number;
    if (path === undefined || line === undefined) continue;
    const events = perFile.get(path) ?? [];
    events.push({
      line,
      text: (data.lines?.text ?? "").replace(/\r?\n$/, ""),
      isMatch: event.type === "match",
      matches: (data.submatches ?? []).map((s) => s.match?.text ?? ""),
    });
    perFile.set(path, events);
  }

  const chunks: SweepChunk[] = [];
  for (const [rawPath, events] of perFile) {
    const path = relativeToTarget(rawPath, targetRoot);
    for (const ev of events) {
      if (!ev.isMatch) continue;
      const context =
        contextRequested > 0
          ? events
              .filter(
                (e) =>
                  !e.isMatch &&
                  e.line !== ev.line &&
                  Math.abs(e.line - ev.line) <= contextRequested,
              )
              .sort((a, b) => a.line - b.line)
              .map((e) => e.text)
          : undefined;
      chunks.push({
        path,
        line: ev.line,
        text: ev.text,
        match: ev.matches[0] ?? "",
        matches: ev.matches,
        ...(context !== undefined ? { context } : {}),
        anchor: { type: "file", path, line: ev.line },
      });
    }
  }
  chunks.sort((a, b) =>
    a.path === b.path ? a.line - b.line : a.path < b.path ? -1 : 1,
  );
  return chunks;
}

/** Search `targetRoot` for `pattern`; anchored chunks labeled `measured`. */
export function sweep(
  targetRoot: string,
  pattern: string,
  options: SweepOptions = {},
): SweepResult {
  const env: Env = options.env ?? process.env;
  let isDir = false;
  try {
    isDir = statSync(targetRoot).isDirectory();
  } catch {
    // fall through to the honest error below
  }
  if (!isDir) {
    throw new SweepError(pattern, `target root ${targetRoot} is not a directory`);
  }

  const rg = findBinary("rg", env);
  if (!rg) throw new MissingBinaryError("rg", "sweep");

  const args = ["--json"];
  if (options.context !== undefined && options.context > 0) {
    args.push("-C", String(Math.floor(options.context)));
  }
  if (options.glob !== undefined) args.push("-g", options.glob);
  args.push("--", pattern, ".");

  const run = spawnSync(rg, args, {
    cwd: targetRoot,
    env,
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  });
  if (run.error) throw new MissingBinaryError("rg", "sweep");
  // ripgrep: 0 = matches found, 1 = no matches, >=2 = error (bad pattern, ...).
  if (run.status !== 0 && run.status !== 1) {
    const reason =
      firstLine(run.stderr ?? "") || `ripgrep exited with code ${run.status}`;
    throw new SweepError(
      pattern,
      `pattern ${JSON.stringify(pattern)} rejected by ripgrep: ${reason}`,
    );
  }
  const context = options.context ?? 0;
  return {
    trust: "measured",
    pattern,
    chunks: parseRgEvents(run.stdout ?? "", targetRoot, context),
  };
}
