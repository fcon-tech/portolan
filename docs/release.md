# Release Guide

Portolan releases must be tied to local verification, GitHub check state, and
the current product-claim boundary. Do not publish broader product claims in
release notes than `docs/product-claims.md` allows.

## Release Candidate Checklist

Before publishing a tag or binary artifact:

- Choose the first public version: `v0.1.0`.
- Before changing the release version, update README install copy, Russian
  README install copy, agent install docs, release notes, release examples, and
  `TestCanonicalPublicIdentityStaysAligned` in one changeset.
- Confirm the canonical public identity:

```bash
go test -count=1 ./internal/app -run TestCanonicalPublicIdentityStaysAligned
rg -n "github.com/(fcon-tech|fall-out-bug)/portolan|go install|git clone" README.md docs go.mod internal -S
```

- Read `docs/product-claims.md` and copy current limitations into the release
  notes.
- Run the local baseline:

```bash
go test -count=1 ./...
go vet ./...
jq empty schema/*.json testdata/oss-adapter-contract/*.json
git diff --check
go run ./cmd/portolan --help
```

- Run the clean-checkout install smoke from the repository root:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan --version
.portolan/bin/portolan context prepare --root . --out /tmp/portolan-context-smoke --profile cursor --force
.portolan/bin/portolan map --root . --out /tmp/portolan-map-smoke --force
```

- Confirm the latest GitHub Actions run for the release commit or PR passed. If
  checks failed, stop release publication until they are fixed or explicitly
  dispositioned. If GitHub was not evaluated, record GitHub checks as
  `not_assessed`.
- Review the product boundary: confirm the release still preserves local-first
  and read-only operation, no daemon behavior, no credentials, no hidden runtime
  network behavior, and no target-repository mutation.
- Produce checksums for every artifact explicitly built during release
  closeout. For `v0.1.0`, this applies to maintainer-built verification
  artifacts only unless a maintainer explicitly expands the release to publish
  downloadable binaries or archives.
- Record any `not_assessed`, `blocked`, or `failed` validation surface in the
  release notes.

## Build Artifacts

The `v0.1.0` release is source-first:

- Git tag and GitHub source archive;
- `go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0`;
- source-checkout bootstrap;
- checksums only for artifacts explicitly built during release closeout.

Prebuilt binaries remain out of scope until a later spec adds platform smoke,
checksums, and closeout coverage. `go install` builds the command locally from
module source; it is not a prebuilt binary route. If a maintainer still builds a
local artifact for release verification, build it from a clean checkout and set
the version through Go linker flags:

```bash
VERSION=v0.1.0
OUT=/tmp/portolan-release/$VERSION
mkdir -p "$OUT"
go build -trimpath -ldflags "-X github.com/fcon-tech/portolan/internal/app.Version=$VERSION" -o "$OUT/portolan-$(go env GOOS)-$(go env GOARCH)" ./cmd/portolan
"$OUT/portolan-$(go env GOOS)-$(go env GOARCH)" --version
(cd "$OUT" && sha256sum * > SHA256SUMS)
```

Keep generated release artifacts outside the repository unless a future spec
explicitly defines committed release metadata.

## Release Notes Source

Use `docs/releases/v0.1.0.md` as the canonical local source for the first
GitHub release body. Paste that content into GitHub Releases only after local
checks, product-claim scan, and GitHub check state are recorded.

## Product Claim Boundary

Release notes must include these current limits from `docs/product-claims.md`
until newer validation evidence changes them:

- UI Cursor/Composer behavior is outside the current required acceptance scope;
  comparison evidence is for Cursor Agent CLI / Composer 2.5 on the fixed local
  Bigtop target.
- OpenCode default-permission execution is verified only when `OUTPUT_PATH`
  stays inside the Portolan checkout; external output paths failed without
  permission bypass.
- Complete inherited-estate coverage is not proven by repository count.
- Runtime-visible observations can be represented from supported local files,
  but complete service topology remains `not_assessed` without complete
  supported runtime evidence.
- OSS producer validation is narrow: Syft/CycloneDX component identity is
  verified for the fixed target, bounded jscpd JSON ingestion is verified on
  the Portolan repository smoke target, first-class local Semgrep producer
  execution is verified with a local config and output path, first-class local
  Graphify producer execution is verified through a read-only staging copy,
  first-class local Repomix producer execution is verified, raw Graphify
  node-link import with source-backed `EXTRACTED` verification is verified,
  bounded Repomix file-inventory import is verified, and bounded
  SCIP/Serena-style JSON symbol-index import is verified. The full Bigtop
  near-clone run, Graphify MCP/LLM/dashboard behavior, SCIP protobuf/real
  indexer output, real Serena export/MCP behavior, and Repomix source/redaction
  semantics remain unproven or `not_assessed`.
- Output quality depends on the local evidence supplied to Portolan. Missing,
  stale, or incomplete inputs must stay visible as gaps.

## Install Paths

Use the install guidance in `docs/agent/INSTALL.md` to distinguish:

- installed binary usage;
- source-checkout bootstrap with `scripts/bootstrap-portolan`;
- `go run` fallback for development-only use.

Use `docs/agent/INSTALL-PROMPT.md` or `docs/agent/INSTALL-PROMPT.ru.md` when
the release needs a copyable agent instruction for "install Portolan and run it
on this local target".

The bootstrap path disables Go module network fetching by default. If a clean
checkout lacks cached modules, retry with `PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1`
only after explicit approval for dependency download.
