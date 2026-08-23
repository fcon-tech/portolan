## Context

See proposal.md — Why. core-foundation delivered the chart types (Anchor,
TrustLabel) and the store; this change adds the probe layer that produces
anchored, labeled evidence for the Cartographer. The tool list, the
wrap-don't-build rule, the manifest-parsing exception, and the ship's-log
concept are settled by docs/MANIFEST.md — this design only records how those
contracts are met, not why they exist.

## Goals / Non-Goals

**Goals:**

- Observable tool behavior exactly as specified in specs/tools/spec.md:
  anchored chunks, honest empties, labeled results, append-only receipts.
- Deterministic, testable wrappers around ripgrep and ctags.
- Manifest readers for exactly the five named formats, nothing more.

**Non-Goals:**

- Re-specifying or extending the Chart (core-foundation owns it); tools emit
  Anchor/TrustLabel values and stop there.
- Builds/tests execution, smell scanners (v1.1 `run`, `smells.scan`).
- MCP serving, harness adapters (mcp-delivery).
- Any language parsing beyond manifest files — non-goal of the whole product.

## Decisions

1. **Wrap the binaries as child processes, structured mode on.** `sweep`
   shells out to `rg --json` and maps match events to anchored chunks;
   `symbols` shells out to ctags JSON output and maps tag records. The tool
   adds file:line anchoring, context assembly, and trust labels on top.
   Alternative: pure-TypeScript search/index — rejected: docs/MANIFEST.md
   mandates wrapping ripgrep/ctags, and both outclass anything we would
   hand-write.
2. **References: definitions from ctags; references via a corroborating
   sweep, never invented.** ctags is authoritative for definitions;
   references are resolved by sweeping for the symbol's name at
   definition-free sites. When that is inconclusive (short/common names),
   the result says references were not resolvable — the spec's honest-absent
   scenario. Alternative: an LSP server per language — rejected: heavyweight,
   per-ecosystem, and against the wrap-don't-build rule.
3. **Manifest readers: one small reader per format.** `package.json` uses
   native JSON; go.mod uses a line-oriented reader (its grammar is
   line-shaped); pom.xml, Cargo.toml, and pubspec.yaml use small
   permissively-licensed parsers (XML/TOML/YAML) rather than growing
   hand-written grammar code — each dependency recorded with license and
   fit. This is the manifest's sanctioned parsing exception; readers extract
   name/version/dependency keys only. Alternative: full ecosystem resolvers —
   rejected: cheap facts only.
4. **Ship's log: append-only JSONL under `<target>/.portolan/log.jsonl`.**
   One receipt per line, written with a single atomic append; receipt ids are
   monotonic (`r1`, `r2`, …) so they are stable and citable as anchors.
   `log.read` scans by id or filter. Alternative: one file per receipt —
   rejected: thousands of files on a Bigtop-scale expedition; JSONL stays
   diffable like the chart index.
5. **Binary discovery at call time, on PATH; no auto-install.** A missing
   binary surfaces as the spec's named-binary error. Installing binaries is
   the expedition's one approval (expedition-skill), never a silent tool
   action. Alternative: vendored binaries — rejected: license weight and
   platform matrix for zero product value.
6. **Reuse core-foundation types; no chart writes from tools.** Probe
   results reference Anchor and TrustLabel as published by core-foundation;
   the tools never touch the chart store, keeping the producer/consumer
   split the manifest draws between determinism and the Cartographer.

## Risks / Trade-offs

- [ripgrep `--json` event stream varies across versions] → Pin the parsing
  to the documented event kinds, ignore unknown kinds, and keep an
  integration test against the installed binary; a version bump shows up
  there first.
- [ctags language coverage is uneven across the Bigtop polyglot corpus] →
  Definitions may be empty for exotic files; that surfaces as the honest
  empty result (`unsurveyed` at the chart level), never as an error or a
  guess.
- [YAML/XML/TOML parser dependencies creep] → Three small dependencies,
  each documented; if any drags weight, swap the reader, not the contract.
- [Line-based receipts can grow large on long expeditions] → Accept for v1;
  the log is append-only and diffable; rotation is a later decision that
  would not change the spec.

## Migration Plan

Greenfield addition under `core/`. Rollback = delete the tool modules; the
chart capability does not depend on them yet.
