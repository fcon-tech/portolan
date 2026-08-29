/**
 * Markdown sheet rendering — the human layer of the Chart.
 *
 * Sheets are derived outputs: the store renders them from index entries on
 * every write, so hand-edited sheets are overwritten by the next expedition
 * (design.md, trade-offs). One sheet per vessel; behavior absence is always
 * rendered as unsurveyed, never omitted.
 */
import { formatAnchor, type Anchor, type IndexedEntry } from "./types";

type VesselIndexed = Extract<IndexedEntry, { kind: "vessel" }>;

/** File name for a vessel's sheet (sanitized; lives in `.portolan/chart/`). */
export function sheetFileName(vesselId: string): string {
  return `${vesselId.replace(/[^a-zA-Z0-9._-]+/g, "-")}.md`;
}

function anchorList(anchors: Anchor[]): string {
  return anchors.map(formatAnchor).join("; ");
}

function entryLine(entry: IndexedEntry, label: string): string {
  return `- ${label} (\`${entry.kind}/${entry.id}\`, trust: ${entry.trust}) — anchor: ${anchorList(entry.anchors)}`;
}

function section(title: string, lines: string[]): string[] {
  if (lines.length === 0) return [];
  return [`## ${title}`, ...lines, ""];
}

function renderVesselSheet(
  vessel: VesselIndexed,
  owned: IndexedEntry[],
  stale: boolean
): string {
  const byKind = (kind: IndexedEntry["kind"]) =>
    owned.filter((e) => e.kind === kind);

  const fairwaysIn = owned.filter((e) => e.kind === "fairway" && e.to === vessel.id);
  const fairwaysOut = owned.filter((e) => e.kind === "fairway" && e.from === vessel.id);
  const unsurveyedEntries = owned.filter((e) => e.trust === "unsurveyed");

  const parts: string[] = [];
  parts.push(`# Vessel ${vessel.id} — ${vessel.name}`, "");
  if (stale) {
    parts.push("> **Pending correction** — sources changed since the last survey.", "");
  }
  parts.push("```chart", JSON.stringify(vessel, null, 2), "```", "");
  parts.push(`**Trust:** ${vessel.trust}`, "");
  parts.push("## Behavior", "");
  parts.push(vessel.behavior ?? "Unsurveyed — no behavior recorded.", "");
  parts.push(
    ...section(
      "Fairways in",
      fairwaysIn.map((e) =>
        entryLine(e, `from \`${(e as Extract<IndexedEntry, { kind: "fairway" }>).from}\``)
      )
    )
  );
  parts.push(
    ...section(
      "Fairways out",
      fairwaysOut.map((e) =>
        entryLine(e, `to \`${(e as Extract<IndexedEntry, { kind: "fairway" }>).to}\``)
      )
    )
  );
  parts.push(
    ...section(
      "Ports of entry",
      byKind("portOfEntry").map((e) => {
        const p = e as Extract<IndexedEntry, { kind: "portOfEntry" }>;
        return entryLine(e, `\`${p.protocol}\`${p.note ? ` — ${p.note}` : ""}`);
      })
    )
  );
  parts.push(
    ...section(
      "Lights",
      byKind("light").map((e) =>
        entryLine(
          e,
          `\`${(e as Extract<IndexedEntry, { kind: "light" }>).name}\``
        )
      )
    )
  );
  parts.push(
    ...section(
      "Beacons",
      byKind("beacon").map((e) => {
        const b = e as Extract<IndexedEntry, { kind: "beacon" }>;
        return entryLine(e, `${b.surface} \`${b.key}\``);
      })
    )
  );
  parts.push(
    ...section(
      "Dangers",
      byKind("danger").map((e) => {
        const d = e as Extract<IndexedEntry, { kind: "danger" }>;
        return entryLine(e, `${d.category} — ${d.note}`);
      })
    )
  );
  const unsurveyedLines: string[] = [];
  if (vessel.behavior === undefined) unsurveyedLines.push("- behavior not recorded");
  for (const e of unsurveyedEntries) {
    unsurveyedLines.push(`- \`${e.kind}/${e.id}\` — anchor: ${anchorList(e.anchors)}`);
  }
  parts.push(...section("Unsurveyed", unsurveyedLines));

  return `${parts.join("\n").trimEnd()}\n`;
}

/**
 * Render one markdown sheet per vessel. `staleVessels` marks sheets with the
 * pending-correction banner (set by refreshStaleness; a fresh write passes
 * nothing).
 */
export function renderSheets(
  entries: IndexedEntry[],
  staleVessels: ReadonlySet<string> = new Set()
): Map<string, string> {
  const sheets = new Map<string, string>();
  const vessels = entries.filter((e): e is VesselIndexed => e.kind === "vessel");
  const owner = new Map<string, string>();
  for (const vessel of vessels) {
    const file = sheetFileName(vessel.id);
    // The sanitization is many-to-one: ids like `foo/bar` and `foo:bar`
    // collapse to the same file name. Refuse rather than let one vessel's
    // sheet silently document another.
    const prior = owner.get(file);
    if (prior !== undefined) {
      throw new Error(
        `sheet file name collision: vessel ids ${JSON.stringify(prior)} and ${JSON.stringify(vessel.id)} ` +
          `both render to ${file} — give the vessels distinct ids`
      );
    }
    owner.set(file, vessel.id);
    const owned = entries.filter(
      (e) =>
        e.kind !== "vessel" &&
        (e.kind === "fairway"
          ? e.from === vessel.id || e.to === vessel.id
          : e.vessel === vessel.id)
    );
    sheets.set(file, renderVesselSheet(vessel, owned, staleVessels.has(vessel.id)));
  }
  return sheets;
}
