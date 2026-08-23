/**
 * Corpus location and the no-fixture-shortcut guard
 * (sea-trial spec: "The trial runs against the real corpus with a derived
 * oracle" / scenario "No fixture shortcut").
 *
 * The runner locates the checkout's own `bigtop.bom` and its component
 * source trees by shape (directory names matching BOM labels), then
 * refuses anything reduced: the sea trial runs against the real Apache
 * Bigtop landscape — the ~18-repo shape the acceptance document fixes —
 * never against a stand-in. The thresholds below encode corpus shape,
 * not answers: no expected component, version, or dependency is baked in
 * here (every machine expectation is derived at run time from the files
 * the checkout itself provides).
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Bom } from "./bom";

/** Refused: the named corpus is not a real Bigtop landscape. */
export class CorpusRefusalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CorpusRefusalError";
  }
}

const SKIP_DIRS = new Set(["node_modules"]);

function dirEntries(root: string, rel: string): string[] {
  try {
    return readdirSync(join(root, rel), { withFileTypes: true })
      .filter((de) => de.isDirectory() && !de.name.startsWith(".") && !SKIP_DIRS.has(de.name))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map((de) => (rel === "" ? de.name : `${rel}/${de.name}`));
  } catch {
    return [];
  }
}

function isFile(root: string, rel: string): boolean {
  try {
    return statSync(join(root, rel)).isFile();
  } catch {
    return false;
  }
}

/**
 * Locate `bigtop.bom` under the target root (breadth-first, shallowest
 * match wins, ties break alphabetically); returns the absolute path.
 * Throws when absent.
 */
export function findBomPath(targetRoot: string): string {
  let level = [""];
  for (let depth = 0; depth <= 4; depth += 1) {
    const found: string[] = [];
    for (const dir of level) {
      const candidate = dir === "" ? "bigtop.bom" : `${dir}/bigtop.bom`;
      if (isFile(targetRoot, candidate)) found.push(candidate);
    }
    if (found.length > 0) {
      found.sort();
      return join(targetRoot, found[0]!);
    }
    const next: string[] = [];
    for (const dir of level) next.push(...dirEntries(targetRoot, dir));
    level = next;
  }
  throw new CorpusRefusalError(
    `no bigtop.bom found under ${targetRoot} (searched to depth 4) — ` +
      `the sea trial runs against an Apache Bigtop landscape checkout that contains bigtop.bom`,
  );
}

/**
 * For every BOM component label, the shallowest source directory named
 * `<label>` or `apache-<label>` under the target root (depth ≤ 3), or
 * undefined when the checkout carries no such tree (Bigtop-internal
 * service components like bigtop-utils have no top-level repo).
 */
export function findComponentRoots(targetRoot: string, bom: Bom): Map<string, string> {
  const wanted = new Map<string, string>();
  for (const comp of bom.components) {
    wanted.set(comp.label.toLowerCase(), comp.label);
    wanted.set(`apache-${comp.label}`.toLowerCase(), comp.label);
  }
  const roots = new Map<string, string>();
  const taken = new Map<string, string>(); // dir -> owning label (first wins)
  let level = [""];
  for (let depth = 0; depth <= 3 && wanted.size > 0; depth += 1) {
    const next: string[] = [];
    for (const dir of level) {
      for (const rel of dirEntries(targetRoot, dir)) {
        const owner = wanted.get(rel.split("/").pop()!.toLowerCase());
        if (owner !== undefined && !roots.has(owner) && !taken.has(rel)) {
          roots.set(owner, rel);
          taken.set(rel, owner);
        }
        if (depth < 3) next.push(rel);
      }
    }
    level = next;
  }
  return roots;
}

/**
 * Minimum corpus shape for the trial to run at all: enough pinned BOM
 * components and enough of their source trees present. The real landscape
 * (19 pinned components, ~15 separate source repos) clears both with wide
 * margin; a checkout-shaped temp directory with a planted two-component
 * BOM does not. Shape thresholds only — expectations are always derived.
 */
export const MIN_BOM_COMPONENTS = 8;
export const MIN_COMPONENT_SOURCE_ROOTS = 8;

export interface CorpusShape {
  bomPath: string;
  componentRoots: Map<string, string>;
  attestation: string;
}

/** The no-fixture-shortcut guard. Throws {@link CorpusRefusalError} on a reduced corpus. */
export function assertRealCorpus(targetRoot: string, bom: Bom, componentRoots: Map<string, string>): CorpusShape {
  const problems: string[] = [];
  if (bom.components.length < MIN_BOM_COMPONENTS) {
    problems.push(
      `only ${bom.components.length} pinned BOM component(s) (minimum ${MIN_BOM_COMPONENTS})`,
    );
  }
  if (componentRoots.size < MIN_COMPONENT_SOURCE_ROOTS) {
    problems.push(
      `only ${componentRoots.size} component source tree(s) located (minimum ${MIN_COMPONENT_SOURCE_ROOTS})`,
    );
  }
  if (problems.length > 0) {
    throw new CorpusRefusalError(
      `refusing to run the sea trial against ${targetRoot}: reduced stand-in corpus — ` +
        `${problems.join("; ")}. The trial requires the real Apache Bigtop landscape ` +
        `(the ~18-repo shape acceptance/bigtop-sea-trial.md fixes), not a fixture`,
    );
  }
  return {
    bomPath: bom.path,
    componentRoots,
    attestation:
      `verified real-shape: ${bom.components.length} BOM components, ` +
      `${componentRoots.size} component source trees located`,
  };
}
