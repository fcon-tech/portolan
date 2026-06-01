# Acceptance Smoke: Bigtop After Generic Agent Path

Run the real operator lane only after `docs/specs/014-agent-bootstrap-discovery/`
and `docs/specs/015-blind-agent-acceptance/` are implemented. The local fixture
smoke remains a command preflight only.

## Purpose

Use Apache Bigtop immediately after the generic agent path is self-discoverable
to discover real product gaps. Do not wait for duplication detectors,
configuration scanners, or debt rules to be implemented first. Do not give the
agent a Bigtop-specific operator packet.

## Inputs

- portable Portolan agent guide;
- Cursor rule wrapper;
- current Portolan CLI;
- `internal/testfixtures/corpus-manifests/apache-bigtop/manifest.json`;
- for real operator acceptance: a local Apache Bigtop checkout selected by the
  operator;
- for command preflight only:
  `internal/testfixtures/apache-bigtop-smoke/selection.json`.

The real operator lane must use
`docs/agent-toolbox/blind-acceptance.md`. Do not give the agent a
Bigtop-specific file list, package names, build choreography, or custom runbook.

## Local Fixture Preflight

Run this when the external Cursor + Composer 2.5 operator lane or local Bigtop
checkout is unavailable. This is preflight only. It does not replace the
operator smoke, does not count as passed blind acceptance, and must not be used
as proof that the Bigtop lane passed. It only proves the current Portolan
artifact path and records gaps without network access.

```bash
tmpdir="$(mktemp -d)"
go run ./cmd/portolan scan \
  --selection internal/testfixtures/apache-bigtop-smoke/selection.json \
  --out "$tmpdir/graph.json" \
  --force
go run ./cmd/portolan packet render \
  --graph "$tmpdir/graph.json" \
  --out "$tmpdir/map.md" \
  --force
go run ./cmd/portolan map --root internal/testfixtures/apache-bigtop-smoke/repo --out "$tmpdir/run"
jq empty "$tmpdir/graph.json"
```

Expected result today:

- `scan` succeeds against local fixture inputs.
- `packet render` succeeds from the generated graph.
- `map` writes the target artifact bundle.
- `findings.jsonl` records detector surfaces that remain `not_assessed`.
- missing Oozie local inputs remain `unknown` or `cannot_verify`.
- Cursor + Composer usability remains `not_assessed` until the blind operator
  lane is run against a real local target checkout.

## Blind Operator Prompt

```text
Portolan: <absolute path to the Portolan checkout or installed binary>
Target: <absolute path to the local target checkout>
Output: <absolute path to a new run directory>

map this shit.

Do not fetch upstream repositories.
Do not use network.
Do not mutate the target repository.
Do not infer facts outside Portolan artifacts.
Record every Portolan capability gap you hit.
```

The prompt must not name Bigtop-specific files, packages, build scripts, or
guide paths. If the local Bigtop checkout is absent, record the real operator
lane as blocked or `not_assessed`; do not replace it with fixture success.

The authoritative prompt contract, forbidden-hint list, evidence bundle, and
status taxonomy live in `docs/agent-toolbox/blind-acceptance.md`.

## Required Gap Ledger

Record the smoke result under `docs/specs/007-apache-bigtop-corpus/reviews/`.

The ledger must include:

- agent workflow failures;
- missing one-command map support;
- missing relationship detection;
- missing duplication detection;
- missing configuration surface detection;
- missing technical-debt findings;
- packet usefulness gaps;
- unsupported agent inferences;
- unknown and cannot-verify evidence that was correctly preserved.

## Stop Rule

After the smoke, update `docs/product-backlog.md` only with gaps proven by the
run. Do not start broad detector implementation from assumptions.
