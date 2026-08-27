/**
 * The Chart Room renderer — the byproduct export of the Chart
 * (openspec/changes/chart-room).
 *
 * Reads the machine index (and, when present, the Sailing Directions) and
 * writes one self-contained `<target>/.portolan/chart-room.html`: nautical
 * archipelago map + engineering layered graph over the same embedded data,
 * deterministic (same chart in → same bytes out), zero runtime dependencies.
 * The layout lives in the page; core owns only reading, inlining, and
 * writing. Reads the Chart, writes exactly one file, never the storage.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { readChart, chartDir } from "../chart-store";
import type { IndexedEntry, NoticeAction } from "../types";

/** Where the artifact lands — inside the write perimeter, never the chart dir. */
export function chartRoomPath(targetRoot: string): string {
  return resolve(targetRoot, ".portolan/chart-room.html");
}

/** One parsed notice line group from notices.txt. */
export interface ParsedNotice {
  action: NoticeAction;
  key: string;
  note?: string;
  anchors: string[];
}

/**
 * Dependency tangles: strongly connected components (size ≥ 2) of the
 * fairway graph over vessel ids. Self-loops and singletons are not
 * tangles. Deterministic — members sorted by id, groups by first member.
 */
export function findTangles(entries: IndexedEntry[]): string[][] {
  const vesselIds = new Set(
    entries.filter((e) => e.kind === "vessel").map((e) => e.id),
  );
  const adj = new Map<string, string[]>();
  for (const e of entries) {
    if (e.kind !== "fairway") continue;
    const f = e as IndexedEntry & { from: string; to: string };
    if (!vesselIds.has(f.from) || !vesselIds.has(f.to)) continue;
    if (!adj.has(f.from)) adj.set(f.from, []);
    adj.get(f.from)!.push(f.to);
  }
  // Tarjan SCC
  let index = 0;
  const idx = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const sccs: string[][] = [];
  const strong = (v: string): void => {
    idx.set(v, index);
    low.set(v, index);
    index += 1;
    stack.push(v);
    onStack.add(v);
    for (const w of adj.get(v) ?? []) {
      if (!idx.has(w)) {
        strong(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v)!, idx.get(w)!));
      }
    }
    if (low.get(v) === idx.get(v)) {
      const component: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        component.push(w);
      } while (w !== v);
      sccs.push(component);
    }
  };
  for (const v of vesselIds) if (!idx.has(v)) strong(v);
  return sccs
    .filter((c) => c.length > 1)
    .map((c) => c.sort())
    .sort((a, b) => (a[0]! < b[0]! ? -1 : 1));
}

/**
 * Parse the plain-text grammar produced by `renderNotices` (notices.ts):
 * header + per-notice entry lines (label padded to 14 columns) followed by
 * indented `anchor:` continuation lines. Absent or empty file → [].
 */
export function parseNotices(text: string): ParsedNotice[] {
  const labels = new Set(["ADDED", "CORRECTED", "MARKED STALE", "RETIRED"]);
  const actionOf = (word: string): NoticeAction | undefined => {
    if (word === "ADDED") return "added";
    if (word === "CORRECTED") return "corrected";
    if (word === "MARKED STALE") return "markedStale";
    if (word === "RETIRED") return "retired";
    return undefined;
  };
  const notices: ParsedNotice[] = [];
  for (const raw of text.split("\n")) {
    if (!raw.trim()) continue;
    const entryMatch = raw.match(/^(ADDED|CORRECTED|MARKED STALE|RETIRED)\s+(.*)$/);
    if (entryMatch && labels.has(entryMatch[1]!)) {
      const rest = entryMatch[2]!;
      const dash = rest.indexOf(" — ");
      const key = dash === -1 ? rest : rest.slice(0, dash);
      const notice: ParsedNotice = { action: actionOf(entryMatch[1]!)!, key, anchors: [] };
      if (dash !== -1) notice.note = rest.slice(dash + 3);
      notices.push(notice);
      continue;
    }
    const anchorMatch = raw.match(/^\s+anchor:\s*(.+)$/);
    if (anchorMatch && notices.length > 0) {
      notices[notices.length - 1]!.anchors.push(anchorMatch[1]!);
    }
    // anything else (e.g. the header line) is skipped
  }
  return notices;
}

/** Render the Sailing Directions (markdown) into the briefing panel HTML. */
export function inlineMd(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const out: string[] = [];
  let inList = false;
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    const inline = (s: string) =>
      esc(s)
        .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    const li = line.match(/^[-*]\s+(.*)$/);
    if (li) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(li[1]!)}</li>`);
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      if (h) out.push(`<h3>${inline(h[2]!)}</h3>`);
      else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

/**
 * JSON for inlining into a <script> block: no `</script>` breakout, no
 * U+2028/2029. The caller MUST substitute with a function replacement so
 * `$`-sequences in chart notes (`$(hadoop classpath)`, `${...}`) reach the
 * page verbatim — a plain string replace would interpret them.
 */
export function safeInlineJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function loadTemplate(): string {
  const here = fileURLToPath(import.meta.url);
  return readFileSync(resolve(here, "..", "template.html"), "utf8");
}

export interface ChartRoomResult {
  path: string;
  entries: number;
  counts: Record<string, number>;
  bytes: number;
}

/** Render the Chart Room for one province. Throws (loudly) when no chart. */
export function renderChartRoom(targetRoot: string): ChartRoomResult {
  const entries: IndexedEntry[] = readChart(targetRoot); // loud when absent
  const sdPath = resolve(targetRoot, ".portolan/sailing-directions.md");
  const sd = existsSync(sdPath) ? readFileSync(sdPath, "utf8") : "";
  const expedition = (sd.match(/Expedition (\S+)/) || [])[1] ?? "—";

  const noticesPath = join(chartDir(targetRoot), "notices.txt");
  const notices = existsSync(noticesPath)
    ? parseNotices(readFileSync(noticesPath, "utf8"))
    : [];

  const briefMd = sd.replace(/^# .*\n/, "");
  const briefHtml = briefMd
    ? inlineMd(briefMd)
    : "<p>No sailing directions on this province.</p>";

  const meta = {
    province: basename(resolve(targetRoot)),
    targetPath: resolve(targetRoot),
    expedition,
  };

  const html = loadTemplate()
    .replace("__CHART_DATA__", () =>
      safeInlineJson({ entries, notices, tangles: findTangles(entries) }))
    .replace("__BRIEF_HTML__", () => JSON.stringify(briefHtml))
    .replace("__META__", () => safeInlineJson(meta));

  const counts: Record<string, number> = {};
  for (const e of entries) counts[e.kind] = (counts[e.kind] ?? 0) + 1;

  const path = chartRoomPath(targetRoot);
  writeFileSync(path, html);
  return { path, entries: entries.length, counts, bytes: html.length };
}
