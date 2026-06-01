# Product Hardcode Audit

Date: 2026-06-01
Scope: current PR worktree after full blind agent acceptance.

## Decision Gate

- Simpler/Faster: remove product-code hardcode first; do not rewrite historical
  evidence logs unless they point users to a current dead path.
- Blocking Edge Cases: Bigtop fixtures still support coverage and acceptance
  tests, so deleting all Bigtop testdata would erase useful regression
  coverage. The problem is Bigtop-specific product API, not the existence of a
  named test fixture.
- Existing Open Source: no new tool is needed; this is repo structure and
  product-boundary cleanup.

## Critical Findings

### HC-001: Bigtop-specific product command

State: fixed in this branch.

Evidence before fix:

- `internal/app/app.go` exposed `portolan selection generate-bigtop`.
- `internal/corpus/bigtop.go` implemented Bigtop-specific selection generation.
- Help text advertised a named Apache Bigtop command as part of the product
  CLI.

Why it was bad:

- It made one acceptance target look like a product feature.
- It violated the product boundary that Portolan should be target-agnostic.
- It created a precedent for adding customer/demo-specific commands to the
  core CLI.

Fix:

- Removed the `generate-bigtop` selection subcommand.
- Removed the `internal/corpus` package.
- Removed Bigtop-specific command usage from current CLI help.
- Kept generic `selection validate` and `map --selection` behavior.

### HC-002: Top-level `corpora/` directory

State: fixed in this branch.

Evidence before fix:

- `corpora/apache-bigtop/manifest.json` was the only file under a top-level
  `corpora/` directory.

Why it was bad:

- The directory name suggested committed product corpora.
- The content was only an acceptance fixture manifest.

Fix:

- Moved the manifest to
  `testdata/corpus-manifests/apache-bigtop/manifest.json`.
- Removed the top-level `corpora/` directory.

## Major Findings

### HC-003: Product docs over-center Bigtop as a public route

State: not fixed in this branch.

Evidence:

- `README.md` routes users to `docs/demo.md` as "Public Demo: Apache Bigtop".
- `docs/demo.md` is a Bigtop-specific walkthrough.
- `docs/product-claims.md` still relies heavily on Bigtop evidence wording.

Why it matters:

- This is documentation, not code, but it still trains agents and users to see
  Bigtop as the product path.
- A better product route is a target-agnostic demo plus Bigtop as one evidence
  appendix.

Recommended fix:

- Create a generic local demo route that uses a small neutral fixture.
- Move Apache Bigtop to an acceptance appendix.
- Keep claims that reference Bigtop as named evidence, not first-run product
  guidance.

### HC-004: Context profile was named `cursor`

State: fixed in this branch with backward compatibility.

Evidence before fix:

- `internal/contextprep/contextprep.go` defaults to `opts.Profile = "cursor"`.
- Any non-`cursor` profile is rejected.
- Generated agent docs print `Profile: Cursor`.

Why it matters:

- Portolan's boundary says it is not tied to Cursor.
- The current implementation is mostly generic agent context, but the API name
  makes it look Cursor-specific.

Fix:

- Add a generic `agent` profile as the default.
- Keep `cursor` as a compatibility alias for older docs and recorded lanes.
- Update docs and acceptance prompts to prefer `--profile agent`.

## Reviewed But Not Classified As Useless Hardcode

### OSS producer names

Examples:

- `jscpd`
- `syft` / CycloneDX
- `semgrep`
- Graphify
- Repomix
- SCIP/Serena-style symbol-index JSON

State: product-meaningful, not useless hardcode.

Reason:

- These are explicit OSS/tool integrations, not target/customer-specific
  shortcuts.
- They are bounded by adapter docs, local execution rules, and evidence-state
  semantics.

Remaining risk:

- Product docs should continue to say "when installed and explicitly invoked";
  they must not imply broad scanner coverage or certification.

### Root discovery conventions

Examples:

- root `selection.json`;
- child `repos/`;
- repo-like directory names such as `api`, `backend`, `frontend`, `service`,
  `web`, and `worker`.

State: heuristic hardcode, but product-meaningful.

Reason:

- These names are common local landscape conventions.
- The code records uncertainty instead of turning them into success.

Remaining risk:

- If these heuristics become too prominent in docs, they should move behind a
  documented discovery profile or configuration.

## Historical Evidence Logs

State: preserved unless they referenced a current product path.

Reason:

- Old review ledgers and acceptance transcripts are audit history.
- Rewriting them to remove every historic command would reduce traceability.

Boundary:

- Current docs/help must not recommend removed Bigtop-specific commands.
- Historical logs may mention commands that existed during the recorded run.
