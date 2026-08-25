#!/usr/bin/env bun
// Spike renderer: chart index -> chart-room.html. Throwaway; see BRIEF.md.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
let target = "";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--target" && args[i + 1]) target = resolve(args[i + 1]);
}
if (!target) {
  console.error("usage: bun experiments/map-spike/render.ts --target <province-root>");
  process.exit(1);
}

const chartIndex = resolve(target, ".portolan/chart/index.jsonl");
const sdPath = resolve(target, ".portolan/sailing-directions.md");
if (!existsSync(chartIndex)) {
  console.error(`no chart at ${chartIndex} — is this a charted province?`);
  process.exit(1);
}

const entries = readFileSync(chartIndex, "utf8")
  .split("\n")
  .filter(l => l.trim())
  .map(l => JSON.parse(l));

const sd = existsSync(sdPath) ? readFileSync(sdPath, "utf8") : "";
const expedition = (sd.match(/Expedition (\S+)/) || [])[1] || "—";

function inlineMd(md: string): string {
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
      out.push(`<li>${inline(li[1])}</li>`);
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      if (h) out.push(`<h3>${inline(h[2])}</h3>`);
      else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

// drop the top-level title (the panel has its own heading); keep the rest
const briefMd = sd.replace(/^# .*\n/, "");
const briefHtml = briefMd ? inlineMd(briefMd) : "<p>No sailing directions on this province.</p>";

const meta = {
  province: basename(target),
  targetPath: target,
  expedition,
};

const template = readFileSync(
  resolve(fileURLToPath(import.meta.url), "..", "template.html"), "utf8");
const safeJson = (s: string) => s.replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const html = template
  .replace("__CHART_DATA__", () => safeJson(JSON.stringify({ entries })))
  .replace("__BRIEF_HTML__", () => JSON.stringify(briefHtml))
  .replace("__META__", () => safeJson(JSON.stringify(meta)));

const outPath = resolve(target, ".portolan/chart-room.html");
writeFileSync(outPath, html);

const kinds: Record<string, number> = {};
entries.forEach(e => { kinds[e.kind] = (kinds[e.kind] || 0) + 1; });
console.log(`chart-room.html written: ${outPath}`);
console.log(`entries: ${entries.length} — ${JSON.stringify(kinds)}`);
