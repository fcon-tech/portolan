/**
 * `manifests`: cheap deterministic facts from the five supported manifest
 * kinds — go.mod, pom.xml, package.json, Cargo.toml, pubspec.yaml — and no
 * other file kind. Manifest files are the only structural parsing Portolan
 * performs. Every fact carries the manifest file path, its manifest key,
 * and the trust label `charted`.
 * (openspec/changes/probe-tools, specs/tools/spec.md)
 */
import type { Anchor } from "../types";

export const MANIFEST_KINDS = [
  "go.mod",
  "pom.xml",
  "package.json",
  "Cargo.toml",
  "pubspec.yaml",
] as const;

export type ManifestKind = (typeof MANIFEST_KINDS)[number];

/** One deterministic fact read from a manifest, anchored to its key. */
export interface ManifestFact {
  trust: "charted";
  /** The manifest key the fact came from, e.g. "dependencies.left-pad". */
  key: string;
  /** The fact's value; "" marks a declared dependency with no version. */
  value: string;
  anchor: Anchor & { type: "manifest" };
}

export interface ManifestDependency {
  name: string;
  version?: string;
  fact: ManifestFact;
}

export interface ManifestReadResult {
  /** Path as given, relative to the target root. */
  path: string;
  kind: ManifestKind;
  name?: string;
  version?: string;
  dependencies: ManifestDependency[];
  facts: ManifestFact[];
}

/** A manifest file whose kind is not supported: reported, never guessed. */
export interface ManifestUnsupported {
  path: string;
  supported: false;
  reason: string;
}

export type ManifestOutcome = ManifestReadResult | ManifestUnsupported;

export class ManifestParseError extends Error {
  readonly path: string;
  constructor(path: string, message: string) {
    super(`manifests: ${message}`);
    this.name = "ManifestParseError";
    this.path = path;
  }
}

/** Classify a path by basename; undefined when not a supported kind. */
export function manifestKindOf(_path: string): ManifestKind | undefined {
  throw new Error("manifests: not implemented yet (probe-tools tasks 4.1–4.2)");
}

/** Read one manifest file from the target; the only structural parsing. */
export function readManifest(
  _targetRoot: string,
  _path: string,
): ManifestOutcome {
  throw new Error("manifests: not implemented yet (probe-tools tasks 4.1–4.2)");
}
