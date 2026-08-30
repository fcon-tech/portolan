/**
 * The committed receipt channel (verification-spine task 4.1, design
 * decision 5): run the `trust.report` module against a province and render
 * the markdown receipt to a file. Deterministic — vocabulary order, no
 * timestamps, no model text — so re-running over an unchanged province is
 * byte-identical. The one rendering transform: the user's home directory
 * prefix is neutralized to `~`, so a receipt over a province whose ship's
 * log quotes absolute paths can still be committed to the public repo
 * (scripts/leak-gate.sh); the same convention as scripts/demo-refresh.sh.
 *
 * Usage: bun scripts/trust-report.ts [--target <path>] [--out <path>]
 * Defaults: target = this repo's root, out = docs/demo/trust-report.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, resolve } from "node:path";
import { ENTRY_KINDS, TRUST_LABELS, formatAnchor } from "../core/src/types";
import { trustReport } from "../core/src/tools/trust-report";

const repoRoot = join(import.meta.dir, "..");
const option = (name: string): string | undefined => {
  const i = process.argv.indexOf(name);
  if (i === -1) return undefined;
  const value = process.argv[i + 1];
  if (value === undefined) throw new Error(`trust-report: ${name} needs a value`);
  return value;
};

const home = homedir();
// Boundary-safe neutralization: `home + "/"` → `~/`, plus a bare `home` only
// at end-of-string → `~`. A sibling sharing home as a strict prefix
// (a path `<home>2/x`) provably passes through untouched.
const scrub = (s: string): string => {
  const marked = s.replaceAll(`${home}/`, "~/");
  return marked.endsWith(home) ? `${marked.slice(0, marked.length - home.length)}~` : marked;
};
const oneLine = (s: string): string => scrub(s.replace(/\s+/g, " ").trim());

const target = resolve(process.cwd(), option("--target") ?? repoRoot);
const out = resolve(process.cwd(), option("--out") ?? join(repoRoot, "docs", "demo", "trust-report.md"));
const r = trustReport(target);

const count = (label: string, n: number): string => `| ${label} | ${n} |\n`;
let md = "# Trust report\n\n";
md += `Reproduce: \`bun scripts/trust-report.ts --target ${scrub(relative(repoRoot, target) || ".")}\`\n\n`;

md += "## Trust labels\n\n| Label | Entries |\n| --- | ---: |\n";
for (const label of TRUST_LABELS) md += count(label, r.trust[label]);
md += count("**Total**", Object.values(r.trust).reduce((a, b) => a + b, 0)) + "\n";

md += "## Entry kinds\n\n| Kind | Entries |\n| --- | ---: |\n";
for (const kind of ENTRY_KINDS) md += count(kind, r.kinds[kind]);
md += "\n";

md += "## Pending correction\n\n";
md += r.staleness.pendingVessels.length === 0
  ? "None.\n\n"
  : "| Vessel | Entries dragged |\n| --- | ---: |\n" +
    r.staleness.pendingVessels.map((v) => count(v.id, v.entries)).join("") + "\n";

md += "## Anchor re-sounding\n\n";
md += `Sounded ${r.anchors.sounded} of ${r.anchors.total} anchors: ${r.anchors.confirmed} confirmed, ${r.anchors.refuted} refuted.\n\n`;
md += r.anchors.refutedList.length === 0
  ? "None refuted.\n\n"
  : r.anchors.refutedList
      .map((x) => `- \`${x.entryId}\` — anchor \`${formatAnchor(x.anchor)}\` — found: ${oneLine(x.found)}\n`)
      .join("") + "\n";

md += "## Ship's log\n\n";
md += r.log.lastReceipt === null
  ? "The ship's log is empty.\n"
  : `${r.log.receipts} receipts; most recent \`${r.log.lastReceipt.id}\`: \`${oneLine(r.log.lastReceipt.command)}\`\n`;

mkdirSync(resolve(out, ".."), { recursive: true });
writeFileSync(out, md);
console.log(`trust report written to ${out}`);
