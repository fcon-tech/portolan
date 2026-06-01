# Bigtop Harness Stress Review

Date: 2026-06-01
Target: `/home/fall_out_bug/projects/bigtop-landscape/`
External report:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-163222/consolidated-report.md`

## Scope

This review repeated the Apache Bigtop landscape stress test under the revised
quality-boundary concept: Portolan is a local-first landscape-navigation
harness for agents, not a scanner runtime or coding harness.

## Lanes

| Lane | Agent/model | Portolan allowed | Result |
| --- | --- | --- | --- |
| Cursor baseline | Cursor Agent, `composer-2.5` | No | valid |
| Cursor + Portolan | Cursor Agent, `composer-2.5` | Yes | valid |
| OpenCode baseline | OpenCode, `opencode-go/kimi-k2.6` | Intended no | contaminated; read legacy `run/map.md` |
| OpenCode baseline strict | OpenCode, `opencode-go/kimi-k2.6` | No | valid |
| OpenCode + Portolan | OpenCode, `opencode-go/kimi-k2.6` | Yes | valid |

## Findings

- `verified`: Portolan produced reusable root and selection map artifacts for
  the 18-repository local Bigtop landscape.
- `verified`: Root discovery found 18 local repositories while the curated
  selection targeted 15 repositories. The delta was `apache-livy`,
  `apache-oozie`, and `apache-sqoop`.
- `verified`: Selection mode added manifest-aware coverage and lifecycle
  metadata, including retired status for Oozie and Sqoop.
- `verified`: Portolan quantified file/config/workflow surfaces and preserved
  weak states in machine-readable artifacts.
- `failed`: full-root native `jscpd` failed with Node heap OOM, both before and
  after removing the unavailable `leveldb` store backend from the generated
  recipe.
- `not_assessed`: code-clone metrics, duplicate LOC, Java/Scala/Maven
  inter-repo relationships, runtime topology, CI health, security/CVE posture,
  and SBOM/component duplication.
- `major`: the initial OpenCode baseline lane was contaminated by legacy
  `run/` artifacts even though `.portolan/` was forbidden. Future no-Portolan
  comparison prompts must forbid both `.portolan/` and `run/`.

## Product Decision

Portolan was materially useful in this stress test, but not sufficient alone.

It added:

- structured inventory and graph artifacts;
- explicit selection-vs-root scope drift;
- evidence-state discipline;
- configuration/workflow/env surface counts;
- reusable map/query context for agents.

It did not add:

- Java/Scala/Maven relationship graph coverage;
- successful large-landscape duplication evidence;
- deep technical-debt specificity without targeted agent file reads.

## Fixes Applied In This Branch

- Removed Portolan-owned OSS producer wrappers.
- Removed native exact duplicate detection and fixtures.
- Reframed OSS integration as native CLI/skill/MCP output plus Portolan import
  and normalization.
- Preserved Portolan as a landscape-navigation harness in product docs.
- Removed invalid `--store leveldb` from the generated jscpd recipe after the
  local Bigtop stress run proved the installed jscpd backend was unavailable.

## Follow-Up Product Gaps

- Define Java/Scala/Maven relationship import through native OSS output, not an
  in-house parser.
- Define a credible large-landscape duplication workflow after full-root jscpd
  OOM; sharding or MCP/skill-driven execution must be explicit and marked as
  degraded unless cross-landscape evidence is preserved.
- Improve `context prepare` output-path DX for existing stress layouts while
  preserving the `.portolan` write-safety boundary.
- Archive or explicitly forbid legacy root-level `run/` artifacts in
  no-Portolan comparison lanes.

## Verification

- `go test -count=1 ./...`: verified
- `go vet ./...`: verified
- `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json`:
  verified
- `git diff --check`: verified
