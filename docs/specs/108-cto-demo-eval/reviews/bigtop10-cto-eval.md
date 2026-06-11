# CTO Query Eval — bigtop-10 (Lane B, spec 108 / P9.1 strict)

Date: 2026-06-11. Bundle: `/tmp/portolan-bigtop10-p91` (not committed; reproduce below).

## Reproduce

```bash
scripts/portolan-scan.sh ~/projects/bigtop-landscape/repos /tmp/portolan-bigtop10 \
  --limit-repos 10 --cross-repo-dup --yes --no-viewer
scripts/harness-bigtop10-acceptance.sh /tmp/portolan-bigtop10
```

If cross-repo pass needs re-run after producer fixes:

```bash
scripts/portolan-scan.sh ~/projects/bigtop-landscape/repos /tmp/portolan-bigtop10 \
  --limit-repos 10 --cross-repo-dup-only --yes --no-viewer
scripts/build-symbol-index.sh /tmp/portolan-bigtop10
```

## Strict acceptance gates (P9.1)

| Gate | Pass condition | Result |
| --- | --- | --- |
| Per-repo jscpd | 0 `shard-jscpd-*` gaps | **PASS** (0 gaps) |
| Per-repo jscpd coverage | no `gap-duplication-*` | **PASS** (bounded profile + sub-shards) |
| ctags/symbols | 0 `shard-ctags-*` / `gap-ctags` | **PASS** (Universal Ctags via linuxbrew) |
| Symbol query | `bundle-query symbol` ≥1 record | **PASS** (~1.98M symbols indexed) |
| Cross-repo dup | no `gap-cross-repo-dup`; tier-A negative or edges | **PASS** (`manifest.cross_repo_duplication.status=complete`, `clone_pairs=0`, 45/45 pairs ok) |
| Wall time | record only | ~35 min intra producers + ~5 min pairwise cross (staged 1500 files/repo) |

`scripts/harness-bigtop10-acceptance.sh /tmp/portolan-bigtop10-p91` → **ok** on 2026-06-11.

## Bundle snapshot

- `repos=10`, `gap_count=0`, `hotspots` budget-truncated
- `relationships=30` shared-dependency edges (independent Apache repos)
- Cross-repo duplication: **proven zero** after complete pairwise scan (tier A negative)
- No `shard-jscpd-*`, `shard-ctags-*`, or `gap-cross-repo-dup` in `gaps.jsonl`

## Lane B results (C1–C5 CTO questions)

| Q | Command (family) | Result | Assessment |
| --- | --- | --- | --- |
| C1 what repos / what do they do | `repos` | 10 records with profiles, manifests, maturity | answered, tier A |
| C2 how connected | `relationships` | 30 `shared-dependency` edges | answered, tier A |
| C3 cross-repo duplication | manifest + `relationships --type cross-repo-duplication` | 0 edges; manifest `cross_repo_duplication: {status: complete, clone_pairs: 0}` | answered, tier A (proven zero) |
| C4 riskiest repo | `hotspots --repo <slug>` | repo-scoped findings available | answered, tier A |
| C5 agent analysis | `claims` | tier-labeled claims with cited refs | answered, labeled B/C/D |

## Producer changes (P9.1)

- Bounded jscpd aligned with spec 039 (`scripts/lib/jscpd-bounded.sh`)
- Intra-repo sub-sharding for repos >3000 files
- Pairwise cross-repo jscpd with staged file slices (`PORTOLAN_CROSS_JSCPD_FILES_PER_REPO`)
- ctags required on `--yes`; `build-symbol-index.sh` reads JSONL ctags output
- OpenCode primary review harness (`scripts/harness-review-opencode-smoke.sh`)

## Prior failures (resolved)

- 6/10 jscpd shard timeouts (unbounded profile) → fixed by bounded + sub-shards
- Monolithic cross jscpd timeout → fixed by pairwise staged passes
- Empty symbol family (ctags JSONL not indexed) → fixed in `build-symbol-index.sh`
