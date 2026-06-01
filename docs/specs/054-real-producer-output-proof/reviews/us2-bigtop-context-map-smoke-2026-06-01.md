# US2 Bigtop Context/Map Smoke: Bounded Producer Run Coverage

Date: 2026-06-01
Branch: `codex/054-bigtop-architecture-proof`

## Scope

Validate User Story 2 for spec 054: acquired producer-run outputs are visible to
agents through context artifacts without Portolan becoming a producer execution
wrapper and without promoting static metadata to runtime topology.

## Verification

Focused tests:

```bash
go test -count=1 ./internal/app ./internal/producerfamily
```

Result: `verified`.

Bigtop context command:

```bash
go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/context --profile cursor --force
```

Result: `verified`; context pack was written successfully.

Context checks:

- `agent-brief.md` contains `## Producer Run Coverage`.
- Producer-run coverage summary:
  - `api-catalog / verified / metadata-visible: 1`
  - `deployment-model / verified / metadata-visible: 2`
  - `runtime-observation / not_assessed / not_assessed: 1`
- `answer-contract.md` contains `## Producer Run Records`.
- `answer-contract.md` states producer-run records are externally generated
  local outputs and do not imply a `portolan produce` command exists.
- `answer-contract.md` states static `deployment-model` and `api-catalog`
  records stay `metadata-visible` and must not be promoted to runtime.

Bigtop map command:

```bash
go run ./cmd/portolan map --root /home/fall_out_bug/projects/bigtop-landscape --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/map --force
```

Result: `verified`; map bundle was written successfully.

Map summary:

- Repositories visible: 18.
- Findings: 274 total.
- Finding status counts:
  - `observed`: 160
  - `not_assessed`: 107
  - `cannot_verify`: 6
  - `unknown`: 1
- Finding evidence-state counts:
  - `source-visible`: 156
  - `metadata-visible`: 4
  - `not_assessed`: 96
  - `cannot_verify`: 6
  - `unknown`: 12
- Skipped surfaces:
  - `relationship-non-go-source`
  - `relationship-runtime-inference`
  - `relationship-lifecycle-modeling`
  - `relationship-service-topology-inference`
  - `duplication-native-detection`
  - `configuration-semantic-analysis`

Execution-wrapper search:

```bash
rg -n "portolan produce|produce --|producer execution wrapper|docker compose up|docker-compose up|kubectl apply|kubectl delete" cmd internal docs README.md AGENTS.md .specify
```

Assessment:

- The current diff introduces no new `cmd/portolan produce` command and no
  Docker/Helm/protoc execution wrapper.
- Historical docs from specs 040/042 still mention older `portolan produce`
  work; that is pre-existing project history, not a new wrapper in this slice.
- New code validates selected metadata and rejects hidden network/credential/
  mutation-shaped commands in producer-run records.

## Assessment

- US2 context surfacing: `verified`.
- US2 map smoke: `verified`.
- No new producer execution wrapper: `verified` for this diff.
- Static deployment/API evidence remains `metadata-visible`: `verified`.
- Runtime topology: `not_assessed`; map summary and findings keep runtime and
  service-topology inference as skipped/not_assessed.
- Full Bigtop architecture understanding with Cursor: `not_assessed`; US3 has
  not run.

## Stop/Next

US2 can move forward to US3. The next slice must run Cursor + Composer 2.5
against the fresh context/map bundle and compare answer quality without
upgrading missing runtime or symbol evidence.
