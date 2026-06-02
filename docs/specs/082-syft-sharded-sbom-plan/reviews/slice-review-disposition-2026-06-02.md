# Slice Review Disposition

Date: 2026-06-02

Spec: `docs/specs/082-syft-sharded-sbom-plan/`

Review packet:

- Final diff against `origin/main`.
- New spec artifacts under `docs/specs/082-syft-sharded-sbom-plan/`.
- Cursor Composer 2.5 stress prompt/output and Bigtop context smoke ledger.

## Independent Lanes

| Lane | Model | State | Verdict |
| --- | --- | --- | --- |
| Kimi | `openrouter/moonshotai/kimi-k2.6` | assessed | No critical or major findings. Minor scope/documentation findings only. |
| MiMo | `openrouter/xiaomi/mimo-v2.5-pro` | assessed | No critical findings. Major finding was that T016/T017 were still open before PR completion; expected delivery-state gap. |
| DeepSeek | `openrouter/deepseek/deepseek-v4-pro` | assessed | No actionable correctness or safety findings. One finding used a stale premise that the PR was already merged. |

## Accepted Findings

### A1: Mirror jscpd out-of-scope boundary in success criteria

Source: Kimi

Classification: minor

Disposition: accepted and fixed.

Rationale:

- The stress output correctly notes that jscpd full-root behavior remains
  outside this branch because jscpd sharding belongs to pending PR #57.
- The spec now explicitly says jscpd and other non-Syft producer-family plan
  behavior remains out of scope and `not_assessed` for this isolated branch.

## Rejected Or Non-Blocking Findings

### R1: T016/T017 incomplete before PR work

Sources: Kimi, MiMo, DeepSeek

Classification: delivery-state observation

Disposition: partially accepted as a workflow state, not a code/spec defect.

Rationale:

- T016 was intentionally open while review lanes were being run.
- T017 must remain open until commit, push, PR creation, and check refresh are
  actually done.
- DeepSeek's statement that the PR was already merged is false for the current
  branch and is treated as stale-premise reviewer output.

### R2: Sanitized names may contain repeated hyphens

Source: Kimi

Classification: minor

Disposition: rejected.

Rationale:

- Repeated hyphens are filesystem-safe and deterministic.
- `uniqueToolOutputName` covers collisions after sanitization.
- No user-facing ambiguity or output safety issue was identified.

### R3: Syft `--exclude` assertions could be stricter

Source: MiMo

Classification: minor

Disposition: non-blocking follow-up.

Rationale:

- Current tests verify the command has the required excludes and that shard
  commands read one repository and write inside context output.
- The feature changes command planning rather than Syft execution semantics.
- A stricter argument-vector assertion can be added if future slices modify the
  command builder.

### R4: Absolute Bigtop stress paths are not portable

Source: MiMo

Classification: minor

Disposition: rejected for this spec.

Rationale:

- Stress ledgers are local evidence artifacts and intentionally record exact
  local paths.
- The implementation itself remains path-parameterized through `--root` and
  `--out`.

### R5: Reason string could be tighter

Source: DeepSeek

Classification: minor

Disposition: rejected.

Rationale:

- `status: available_not_run` and `evidence_state: not_assessed` are the
  authoritative machine-readable fields.
- The reason string already says Portolan did not run Syft and explains why
  repository shards are recommended.

## Verification After Disposition

verified:

- `go test ./...`
- `go vet ./...`
- `jq empty schema/*.json`
- `git diff --check`
- Fresh Bigtop context smoke.
- Cursor Agent `composer-2.5` bounded Syft/CycloneDX stress.

not_assessed:

- Actual Syft execution.
- Actual CycloneDX output validity.
- Component inventory and dependency relationships.
- GitHub PR checks until T017 creates/updates the PR.
