/**
 * `trust.report`: the province's verification summary in one call
 * (openspec/changes/verification-spine). Aggregates the chart — trust-label
 * distribution, per-kind counts, staleness — and re-sounds every anchor
 * live through the existing `sound.anchor` machinery, so the report states
 * what holds now, not what the index last claimed. Refuted anchors are
 * named, never smoothed over — including a citation so malformed that
 * `sound.anchor` refuses it (a hand-edited index): it counts as refuted
 * with the refusal as its finding, so one planted anchor cannot sink the
 * report. Adoption counts the mandated query tools' invocations from the
 * ship's log — invocation facts, never a measure of mandate compliance.
 *
 * Refreshes staleness first, exactly as `chart.read` does; that refresh is
 * the only write the report may cause (inside `.portolan/`, per the
 * refresh's own contract). No receipt is appended.
 */
import type { Anchor, EntryKind, IndexedEntry, TrustLabel } from "../types";
import { ENTRY_KINDS, TRUST_LABELS } from "../types";
import { readChart } from "../chart-store";
import { refreshStaleness } from "../staleness";
import { readReceipts, type Receipt } from "./log";
import { SoundingError, soundAnchor } from "./sound";

/**
 * The mandated query tools whose invocations the report must account for
 * (specs/invocation/spec.md: a query tool ships only with a per-tool
 * adoption counter). A future mandated tool just appends here.
 */
export const ADOPTION_TOOLS = ["chart.neighborhood"] as const;

/** The concrete tools in the adoption registry. */
export type MandatedQueryTool = (typeof ADOPTION_TOOLS)[number];

/** Invocation facts for one mandated query tool, read from the ship's log. */
export interface ToolAdoption {
  /** Receipts in the log whose command names the tool. */
  invocations: number;
  /** First invocation's receipt id; null when the log holds none. */
  firstReceipt: string | null;
  /** Most recent invocation's receipt id; null when the log holds none. */
  lastReceipt: string | null;
}

/** One refuted anchor: the entry that cites it, the citation, what was found. */
export interface RefutedAnchor {
  /** The citing entry's chart id. */
  entryId: string;
  /** The anchor exactly as cited by the entry. */
  anchor: Anchor;
  /** What the sounding actually found at the citation. */
  found: string;
}

/** One vessel dragging entries into `pending correction`. */
export interface PendingVessel {
  id: string;
  /** Chart entries marked pending correction that hang from this vessel. */
  entries: number;
}

/** What `trust.report` returns: the one-call verification summary. */
export interface TrustReport {
  /** Chart entries per trust label; all five labels stated, zero-filled. */
  trust: Record<TrustLabel, number>;
  /** Chart entries per kind; all six kinds stated, zero-filled. */
  kinds: Record<EntryKind, number>;
  /** Pending-correction vessels, read from the chart's stale flags after the refresh. */
  staleness: { pendingVessels: PendingVessel[] };
  /** Live re-sounding of every chart anchor. */
  anchors: {
    /** Anchors cited on the chart. */
    total: number;
    /** Anchors sounded — equal to `total` by construction: no sampling. */
    sounded: number;
    /** Soundings that resolved `confirmed`. */
    confirmed: number;
    /** Soundings that resolved `refuted`. */
    refuted: number;
    /** Every refuted anchor, sorted by entry id then anchor index. */
    refutedList: RefutedAnchor[];
  };
  /** The ship's log: total receipts and the most recent one (null on an empty log). */
  log: { receipts: number; lastReceipt: Receipt | null };
  /** Per-tool invocation facts for every mandated query tool, zero-filled. */
  adoption: { tools: Record<MandatedQueryTool, ToolAdoption> };
}

/**
 * Charge one stale entry to the pending-correction vessel(s) it hangs from,
 * read from the index's own stale flags. The refresh recomputes those flags
 * — a drifted vessel stays pending, a reverted one clears — so attribution
 * must come from the chart as it stands now, never from a refresh delta.
 * A pending fairway
 * drags on both vessels it runs between: once drift is reverted there is no
 * telling which endpoint moved, and over-attribution is the honest direction.
 */
function chargeStaleEntry(entry: IndexedEntry, pending: Map<string, number>): void {
  if (!entry.stale) return;
  const bump = (vesselId: string): void => {
    pending.set(vesselId, (pending.get(vesselId) ?? 0) + 1);
  };
  if (entry.kind === "vessel") bump(entry.id);
  else if (entry.kind === "fairway") {
    bump(entry.from);
    bump(entry.to);
  } else bump(entry.vessel);
}

/**
 * A receipt's command names the tool when it is the bare tool name or the
 * tool followed by its arguments ("chart.neighborhood vessel=tug").
 */
function namesTool(command: string, tool: MandatedQueryTool): boolean {
  return command === tool || command.startsWith(`${tool} `);
}

/**
 * `trust.report`: the one-call verification summary. Deterministic — no
 * timestamps participate, so two runs over an unchanged province return the
 * same report, refuted list in the same order.
 */
export function trustReport(targetRoot: string): TrustReport {
  // Staleness first, chart.read semantics: the staleness section is never
  // served from a stale signature. This is the report's only possible write.
  refreshStaleness(targetRoot);
  const entries = readChart(targetRoot);

  const trust = Object.fromEntries(TRUST_LABELS.map((l) => [l, 0])) as Record<TrustLabel, number>;
  const kinds = Object.fromEntries(ENTRY_KINDS.map((k) => [k, 0])) as Record<EntryKind, number>;
  for (const entry of entries) {
    trust[entry.trust] += 1;
    kinds[entry.kind] += 1;
  }

  const pending = new Map<string, number>();
  for (const entry of entries) chargeStaleEntry(entry, pending);
  const pendingVessels = [...pending.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, count]) => ({ id, entries: count }));

  const refuted: (RefutedAnchor & { index: number })[] = [];
  let confirmed = 0;
  let total = 0;
  for (const entry of entries) {
    for (const [index, anchor] of entry.anchors.entries()) {
      total += 1;
      let verdict: ReturnType<typeof soundAnchor>;
      try {
        verdict = soundAnchor(targetRoot, { anchor });
      } catch (err) {
        if (!(err instanceof SoundingError)) throw err;
        // A non-citable anchor (plantable by a hand-edited index) is
        // refuted by name like any other unresolvable citation — one bad
        // citation never sinks the whole report, and the report never
        // sounds fewer anchors than the chart cites.
        refuted.push({ entryId: entry.id, anchor, index, found: err.message });
        continue;
      }
      if (verdict.verdict === "confirmed") confirmed += 1;
      else {
        // sound.anchor yields confirmed or refuted only; its evidence names
        // what was actually found — the one-line summary is the fallback so
        // the cross-module evidence invariant is not assumed blindly here.
        refuted.push({
          entryId: entry.id,
          anchor,
          index,
          found: verdict.evidence[0]?.found ?? verdict.report,
        });
      }
    }
  }
  refuted.sort((a, b) =>
    a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : a.index - b.index,
  );
  const refutedList: RefutedAnchor[] = refuted.map(({ index: _index, ...r }) => r);

  const receipts = readReceipts(targetRoot);
  // Append-only log: file order is invocation order, so first/last by it.
  const adoption = Object.fromEntries(
    ADOPTION_TOOLS.map((tool) => {
      const mine = receipts.filter((receipt) => namesTool(receipt.command, tool));
      const stat: ToolAdoption = {
        invocations: mine.length,
        firstReceipt: mine[0]?.id ?? null,
        lastReceipt: mine.length > 0 ? mine[mine.length - 1]!.id : null,
      };
      return [tool, stat] as const;
    }),
  ) as Record<MandatedQueryTool, ToolAdoption>;
  return {
    trust,
    kinds,
    staleness: { pendingVessels },
    anchors: {
      total,
      sounded: total,
      confirmed,
      refuted: refutedList.length,
      refutedList,
    },
    log: {
      receipts: receipts.length,
      lastReceipt: receipts.length > 0 ? receipts[receipts.length - 1]! : null,
    },
    adoption: { tools: adoption },
  };
}
