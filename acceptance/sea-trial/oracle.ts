/**
 * The derived oracle (sea-trial spec: "Machine checks derive from the
 * checkout"). Expected answers are computed at run time from the surveyed
 * checkout's own files — the BOM facts come from the narrow reader, and
 * the Q3 manifest side comes from walking each component's source tree
 * through the product's own `manifests` reader. Nothing here is a
 * pre-baked answer sheet: point the runner at a different Bigtop commit
 * and the expectations move with it.
 *
 * Read failures are never hidden: a manifest the reader cannot parse is
 * recorded as a caveat and reported, not silently skipped.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ManifestParseError, manifestKindOf, readManifest } from "../../core/src/index";
import type { Bom } from "./bom";

/** A component's manifests declare a dependency on Apache Hadoop. */
export function declaresHadoop(depName: string): boolean {
  const name = depName.toLowerCase();
  return name === "hadoop" || name.startsWith("hadoop-");
}

export interface ComponentDerivation {
  label: string;
  /** Source tree located for the component, relative to the target root. */
  root?: string;
  /** Supported manifests read under the component's root. */
  manifests: string[];
  /** At least one manifest declares a hadoop dependency. */
  declares: boolean;
  /** The declaring manifest paths and keys (evidence for the expectation). */
  evidence: string[];
}

export interface ManifestDerivation {
  /** Sorted labels (excluding hadoop itself) whose manifests declare hadoop. */
  dependents: string[];
  perComponent: ComponentDerivation[];
  manifestsRead: number;
  /** Read problems, reported verbatim — never hidden. */
  caveats: Array<{ path: string; problem: string }>;
}

const SKIP_DIRS = new Set(["node_modules"]);

function walkFiles(root: string, rel: string, out: string[]): void {
  let entries;
  try {
    entries = readdirSync(join(root, rel), { withFileTypes: true });
  } catch {
    return;
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const de of entries) {
    const child = rel === "" ? de.name : `${rel}/${de.name}`;
    if (de.isDirectory()) {
      if (de.name.startsWith(".") || SKIP_DIRS.has(de.name)) continue;
      walkFiles(root, child, out);
    } else if (de.isFile() && manifestKindOf(de.name) !== undefined) {
      out.push(child);
    }
  }
}

/**
 * Derive which components depend on Apache Hadoop by manifest declaration:
 * every supported manifest under each component's located source tree is
 * read, and any hadoop/hadoop-* dependency counts. The hadoop component
 * itself is excluded (a component does not depend on itself).
 */
export function deriveHadoopManifestDependents(
  targetRoot: string,
  bom: Bom,
  componentRoots: Map<string, string>,
): ManifestDerivation {
  const perComponent: ComponentDerivation[] = [];
  const caveats: Array<{ path: string; problem: string }> = [];
  let manifestsRead = 0;

  for (const comp of bom.components) {
    if (comp.label === "hadoop") continue;
    const root = componentRoots.get(comp.label);
    const entry: ComponentDerivation = {
      label: comp.label,
      ...(root !== undefined ? { root } : {}),
      manifests: [],
      declares: false,
      evidence: [],
    };
    if (root !== undefined) {
      const manifests: string[] = [];
      walkFiles(targetRoot, root, manifests);
      for (const rel of manifests) {
        manifestsRead += 1;
        entry.manifests.push(rel);
        try {
          const outcome = readManifest(targetRoot, rel);
          if ("supported" in outcome) continue; // classified by name — cannot happen here
          for (const dep of outcome.dependencies) {
            if (declaresHadoop(dep.name)) {
              entry.declares = true;
              entry.evidence.push(`${rel}#${dep.fact.key}`);
            }
          }
        } catch (err) {
          const problem =
            err instanceof ManifestParseError
              ? err.message
              : `unreadable: ${(err as Error).message}`;
          caveats.push({ path: rel, problem });
        }
      }
    }
    perComponent.push(entry);
  }

  return {
    dependents: perComponent.filter((c) => c.declares).map((c) => c.label).sort(),
    perComponent,
    manifestsRead,
    caveats,
  };
}
