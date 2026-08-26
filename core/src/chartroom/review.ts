/**
 * The fleet review — one-file multi-province index page
 * (openspec/changes/fleet-review). The Governor names provinces explicitly;
 * the export lists them in order with arithmetic over each machine index
 * and a file:// link to every province's Chart Room. Deterministic,
 * read-only inputs, one written artifact inside the first target's
 * perimeter. No MCP surface: a server is bound to one province by contract.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { readChart } from "../chart-store";
import type { IndexedEntry } from "../types";
import { safeInlineJson } from "./render";

/** Where the review lands: the first named target's perimeter. */
export function fleetReviewPath(firstTarget: string): string {
  return resolve(firstTarget, ".portolan/fleet-review.html");
}

export interface FleetRow {
  name: string;
  path: string;
  url: string;
  counts: Record<string, number>;
  trust: Record<string, number>;
  stale: number;
  dangers: number;
  topHub: { id: string; fanIn: number } | null;
  roomUrl: string;
  roomRendered: boolean;
}

function rowFor(targetRoot: string): FleetRow {
  const entries: IndexedEntry[] = readChart(targetRoot); // loud when absent
  const counts: Record<string, number> = {};
  const trust: Record<string, number> = {};
  let stale = 0;
  let dangers = 0;
  const vessels: IndexedEntry[] = [];
  const fairways: IndexedEntry[] = [];
  for (const e of entries) {
    counts[e.kind] = (counts[e.kind] ?? 0) + 1;
    trust[e.trust] = (trust[e.trust] ?? 0) + 1;
    if (e.stale) stale += 1;
    if (e.kind === "danger") dangers += 1;
    if (e.kind === "vessel") vessels.push(e);
    if (e.kind === "fairway") fairways.push(e);
  }
  const fanIn = new Map<string, number>();
  for (const f of fairways) {
    const to = (f as { to?: string }).to;
    if (typeof to === "string" && vessels.some((v) => v.id === to)) {
      fanIn.set(to, (fanIn.get(to) ?? 0) + 1);
    }
  }
  let topHub: FleetRow["topHub"] = null;
  for (const [id, n] of fanIn) {
    if (!topHub || n > topHub.fanIn || (n === topHub.fanIn && id < topHub.id)) {
      topHub = { id, fanIn: n };
    }
  }
  const root = resolve(targetRoot);
  const roomPath = join(root, ".portolan/chart-room.html");
  return {
    name: basename(root),
    path: root,
    url: pathToFileURL(root).href,
    counts,
    trust,
    stale,
    dangers,
    topHub,
    roomUrl: pathToFileURL(roomPath).href,
    roomRendered: existsSync(roomPath),
  };
}

const TEMPLATE_ROW = "__FLEET_DATA__";

function loadTemplate(): string {
  return readFileSync(
    resolve(fileURLToPath(import.meta.url), "..", "review-template.html"),
    "utf8",
  );
}

export interface FleetReviewResult {
  path: string;
  provinces: number;
  bytes: number;
}

/** Render the fleet review. Throws loudly when any target lacks a chart. */
export function buildFleetReview(targets: string[]): FleetReviewResult {
  if (targets.length === 0) {
    throw new Error("fleet review needs at least one --target");
  }
  const rows = targets.map(rowFor); // loud per-target on missing charts
  const html = loadTemplate().replace(TEMPLATE_ROW, () => safeInlineJson(rows));
  const path = fleetReviewPath(targets[0]!);
  writeFileSync(path, html);
  return { path, provinces: rows.length, bytes: html.length };
}
