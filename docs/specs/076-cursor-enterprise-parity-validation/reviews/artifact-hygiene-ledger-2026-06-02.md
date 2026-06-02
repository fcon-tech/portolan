# Artifact Hygiene Ledger

Spec: `docs/specs/076-cursor-enterprise-parity-validation/`

Date: 2026-06-02

Purpose: define clean-start and contamination controls for the next Cursor
Composer 2.5 parity stress. No new stress run was executed by this ledger.

## Current Artifact State

verified:

- Target root: `/home/fall_out_bug/projects/bigtop-landscape`.
- `selection.json` exists at target root.
- `repos/` contains 18 local repository directories.
- Top-level `run/` under the target root is absent.
- `.portolan/stress/` exists and contains 29 prior stress roots.
- The target root is not itself a Git repository; per-repository cleanliness
  must be assessed under `repos/*` only if a future run requires it.

not_assessed:

- Per-repository dirty state under `repos/*`; spec 076 has not requested or
  executed target repository mutation.
- Cursor lane filesystem access logs; no current 076 Cursor lane has run.

## Fresh Run Root Contract

Future default 076 execution must create a fresh root under:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/<actual-run-id>-076-cursor-enterprise-parity/
```

The run ledger must record:

- actual run id and date;
- Portolan commit used;
- baseline lane output path;
- with-Portolan lane output path;
- generated Portolan artifact paths;
- any mapping from planning-branch filenames with `2026-06-02` suffixes to the
  actual run id;
- cleanup/residue state.

## Baseline Lane Forbidden Paths

The Cursor baseline lane must not read:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/
/home/fall_out_bug/projects/bigtop-landscape/run
```

If a future run permits selected prior evidence, that permission must be
explicitly recorded in the lane ledger before execution. Otherwise all existing
`.portolan/stress/*` roots are forbidden to the baseline lane.

## Baseline Lane Allowed Inputs

Allowed:

```text
/home/fall_out_bug/projects/bigtop-landscape/selection.json
/home/fall_out_bug/projects/bigtop-landscape/repos/
```

The lane may cite local source files under `repos/*`. It must not cite Portolan
artifact paths.

## With-Portolan Lane Allowed Inputs

Allowed:

- the same source inputs as the baseline lane;
- only the fresh Portolan artifacts generated for the current 076 run.

Forbidden:

- stale `.portolan/stress/*` outputs from earlier runs, unless the run ledger
  explicitly authorizes them as prior evidence;
- top-level `run/` if it appears later;
- unrelated worktree artifacts.

## Required Lane Attestation

Each Cursor lane output or lane ledger must include:

- prompt path and prompt version;
- whether Portolan artifacts were allowed;
- allowed artifact paths;
- forbidden artifact paths;
- statement whether any forbidden path was read;
- if contamination occurred, status `contaminated` and the lane must not count
  as valid parity evidence.

## Cleanup / Residue Rule

After any executed 076 stress run:

- transient outputs outside `.portolan/stress/<actual-run-id>-076-*` must be
  removed or recorded with `failed` / `blocked` cleanup state;
- the artifact hygiene ledger must record whether top-level `run/` is absent;
- if runtime 074 was executed as a dependency, cleanup must be verified in the
  spec 074 runtime ledger, not inferred from 076.

## Current Residue State

verified:

- No top-level `run/` directory exists under the target root.

not_assessed:

- No current 076 stress run exists, so no post-run cleanup can be assessed.

blocked:

- Default 076 stress execution remains blocked pending spec 074 runtime-health
  evidence or explicit current-evidence rejection approval.
