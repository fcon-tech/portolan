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
import { readChart } from "../chart-store";
import type { IndexedEntry } from "../types";

/** Where the artifact lands — inside the write perimeter, never the chart dir. */
export function chartRoomPath(targetRoot: string): string {
  return resolve(targetRoot, ".portolan/chart-room.html");
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
    .replace("__CHART_DATA__", () => safeInlineJson({ entries }))
    .replace("__BRIEF_HTML__", () => JSON.stringify(briefHtml))
    .replace("__META__", () => safeInlineJson(meta));

  const counts: Record<string, number> = {};
  for (const e of entries) counts[e.kind] = (counts[e.kind] ?? 0) + 1;

  const path = chartRoomPath(targetRoot);
  writeFileSync(path, html);
  return { path, entries: entries.length, counts, bytes: html.length };
}
