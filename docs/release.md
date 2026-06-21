# Release Guide

Portolan releases must be tied to local verification, GitHub check state, and
the current product-claim boundary. Do not publish broader product claims in
release notes than `docs/product-claims.md` allows.

## Release Candidate Checklist

Before publishing a tag or release artifact:

- Pick the release identifier after the installable atlas route is verified.
- Update README install copy, Russian README install copy, agent install docs,
  release notes, release examples, and canonical identity tests in one
  changeset.
- Confirm the canonical public identity:

```bash
go test -count=1 ./internal/app -run 'TestCanonicalPublicIdentity|TestInstallableAgentPackPublicRoute'
rg -n "github.com/(fcon-tech|fall-out-bug)/portolan|portolan-install|git clone" README.md docs go.mod internal -S
```

- Read `docs/product-claims.md` and copy current limitations into the release
  notes.
- Run the product gate:

```bash
scripts/portolan-product-acceptance.sh --require-agent-runtime
```

- For release candidates that claim Bigtop corpus evidence, run the same product
  gate with a prepared Bigtop bundle:

```bash
scripts/portolan-product-acceptance.sh \
  --require-agent-runtime \
  --bigtop-bundle <bigtop-bundle-dir>
```

- Run a fresh remote clone of the release branch/tag and repeat the product
  gate from that clone.
- Confirm the latest GitHub Actions run for the release commit or PR passed. If
  checks failed, stop release publication until they are fixed or explicitly
  dispositioned. If GitHub was not evaluated, record GitHub checks as
  `not_assessed`.
- Review the product boundary: confirm the release still preserves local-first
  and read-only operation, no daemon behavior, no credentials, no hidden runtime
  network behavior, and no target-repository mutation.
- Record any `not_assessed`, `blocked`, or `failed` validation surface in the
  release notes.

## Release Artifact

The current product artifact is a source checkout installer plus target-local
wrappers:

```bash
git clone https://github.com/fcon-tech/portolan.git
cd portolan
scripts/portolan-install.sh <target-root> --harness all --bundle-dir <bundle-dir>
<target-root>/.portolan/bin/portolan-scan.sh <target-root> <bundle-dir> --yes --skip-install --no-viewer
```

This installs:

- Cursor Project Rule: `<target-root>/.cursor/rules/portolan-atlas.mdc`
- OpenCode managed block: `<target-root>/AGENTS.md`
- Target-local wrappers: `<target-root>/.portolan/bin/`
- Default atlas location when selected: `<target-root>/.portolan/atlas`

Prebuilt binaries, Homebrew, Docker, npm, apt, and other package-manager routes
are out of scope until a later slice adds platform smoke, checksums, and release
closeout coverage for those artifacts. The legacy Go CLI remains available from
a source checkout for explicit compatibility use, but it is not the primary
release artifact.

Keep generated release artifacts outside the repository unless a future spec
explicitly defines committed release metadata.

## Release Notes Source

Use `docs/releases/installable-atlas.md` as the canonical local source for the
GitHub release body. Paste that content into GitHub Releases only after local
product acceptance, fresh-clone product acceptance, product-claim scan, and
GitHub check state are recorded.

## Product Claim Boundary

Release notes must include these current limits from `docs/product-claims.md`
until newer validation evidence changes them:

- Cursor/OpenCode runtime support is limited to the verified headless CLI lanes;
  arbitrary future UI modes and releases remain `not_assessed`.
- Complete inherited-estate coverage is not proven by repository count.
- Runtime-visible observations can be represented from supported local files,
  but complete service topology remains `not_assessed` without complete
  supported runtime evidence.
- OSS output validation is narrow and named. Native OSS CLI, skill, or MCP
  outputs may be used when installed and explicitly requested, but broad scanner
  coverage, certification, and target-independent OSS value remain unproven or
  `not_assessed`. The current named boundaries include local Semgrep output
  with local config, raw Graphify node-link import with source-backed
  `EXTRACTED` verification, bounded Repomix file-inventory import, and bounded
  SCIP/Serena-style JSON symbol-index import. Graphify MCP/LLM/dashboard
  behavior, SCIP protobuf/real indexer output, real Serena export/MCP behavior,
  and Repomix source/redaction semantics remain unproven or `not_assessed`.
- Output quality depends on the local evidence supplied to Portolan. Missing,
  stale, or incomplete inputs must stay visible as gaps.

## Install Paths

Use the install guidance in `docs/agent/INSTALL.md` to distinguish:

- source checkout installer for Cursor/OpenCode/agent harnesses;
- target-local wrappers under `<target-root>/.portolan/bin`;
- legacy Go binary/bootstrap only when an operator explicitly asks for older
  context or map artifacts.

Use `docs/agent/INSTALL-PROMPT.md` or `docs/agent/INSTALL-PROMPT.ru.md` when
the release needs a copyable agent instruction for "install Portolan and run it
on this local target".
