# US3 Cursor Composer 2.5 Stress: Producer Run Evidence

Date: 2026-06-01
Branch: `codex/054-bigtop-architecture-proof`

## Scope

Run headless Cursor Agent CLI with Composer 2.5 against the fresh spec 054
Bigtop context/map bundle and review whether it uses producer-run evidence
without overclaiming runtime topology or enterprise-code-intelligence parity.

## Prompt And Output

Prompt:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/cursor/cursor-composer25-producer-runs-prompt.md
```

Raw output:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/cursor/cursor-composer25-producer-runs-output.md
```

Command:

```bash
timeout 10m zsh -lc 'cursor-agent --print --mode ask --model composer-2.5 --trust --workspace /home/fall_out_bug/projects/bigtop-landscape "$(cat /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/cursor/cursor-composer25-producer-runs-prompt.md)" | tee /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/cursor/cursor-composer25-producer-runs-output.md'
```

Result: `verified`; Cursor Agent completed before the 10 minute timeout.

## Cursor Verdict

Cursor returned:

```text
Verdict: narrowed
```

Accepted summary:

- Portolan + Cursor can support bounded, evidence-backed architecture Q&A for
  local scope, declared deploy surfaces, and a small API slice.
- Portolan + Cursor do not yet match human or enterprise code-intelligence
  depth on runtime topology, cross-language coupling, or landscape-wide
  API/catalog coverage.

## Supported Claims Cited By Cursor

Cursor cited the expected producer-run IDs:

- `producer-run-alluxio-grpc-descriptor-20260601`
- `producer-run-alluxio-helm-monitor-20260601`
- `producer-run-bigtop-compose-20260601`
- `producer-run-bigtop-runtime-not-assessed-20260601`
- `producer-run-bigtop-symbol-index-not-assessed-20260601`

Cursor used the producer-run evidence correctly:

- Alluxio protobuf descriptor: bounded API/catalog metadata only.
- Alluxio Helm monitor render: static deployment-model metadata only.
- Bigtop Docker Compose config: static deployment-model metadata only.
- Runtime observation: `not_assessed`.
- Symbol index: `not_assessed`.

## Overclaim Review

| Claim Surface | Cursor Result | Disposition |
| --- | --- | --- |
| Full Bigtop architecture understanding | Cursor said not equivalent to staffed architect or full enterprise graph. | `verified`; no overclaim. |
| Runtime topology | Cursor said Compose/Helm/protoc do not prove runtime topology and runtime remains `not_assessed`. | `verified`; no overclaim. |
| Symbol/reference relationships | Cursor kept symbol/reference as `not_assessed`. | `verified`; no overclaim. |
| Full API/catalog/model coverage | Cursor limited evidence to two Alluxio protobuf files and kept whole-landscape coverage weak. | `verified`; no overclaim. |
| Producer execution | Cursor did not invent a Portolan producer command. | `verified`; no overclaim. |

## Comparison To Previous Bigtop Stress

Previous post-merge stress artifact:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-190628/cursor-composer25-post-merge-output.md
```

Previous state:

- Qualified pass for Portolan as a local-first navigation harness.
- Failed for full enterprise relationship/architecture coverage without more
  local producers.
- Syft/CycloneDX was the only concrete observed tool-output family in that run.
- Real API/deployment producer-run IDs were absent.

Spec 054 delta:

- Cursor now cites concrete real producer-run IDs for Docker Compose, Helm, and
  protoc outputs.
- Cursor can distinguish those outputs from runtime topology.
- Cursor still returns `narrowed`, not `verified`, for the broad enterprise
  architecture-understanding claim.

## Assessment

- Cursor + Composer 2.5 stress: `verified`.
- Answer quality improvement from producer-run records: `verified` as a
  bounded improvement; Cursor uses concrete producer-run IDs and limitations.
- "Portolan understands Bigtop like a human or enterprise code intelligence":
  `not_assessed` / not achieved by this slice.
- Runtime topology: `not_assessed`.
- Real symbol producer output: `not_assessed`.
- Full Bigtop API/catalog/model coverage: `not_assessed`.

## Stop/Next

Spec 054 can proceed to PR readiness as a narrowed proof: real
deployment-model and bounded API/catalog producer-run evidence are verified and
Cursor uses them correctly. The original broader goal still requires specs 055
and 056 for runtime-visible observations and enterprise-intelligence comparison
criteria before claiming full architecture understanding.
