# Apache Bigtop Demo Source - 2026-05-30

## Acquisition Options

Primary public setup:

```bash
mkdir -p /tmp/portolan-demo/bigtop-landscape/repos
cd /tmp/portolan-demo/bigtop-landscape/repos
git clone https://github.com/apache/bigtop.git apache-bigtop-repo
```

Broader stress setup:

- add component repositories under the same `repos/` directory;
- use `corpora/apache-bigtop/manifest.json` as the maintained corpus reference;
- keep clone/fetch behavior outside Portolan itself.

## Source And License

- Target: Apache Bigtop.
- Public source: `https://github.com/apache/bigtop`.
- License note: Apache Bigtop is distributed under Apache License 2.0. Public
  excerpts in this slice contain Portolan output summaries and repository names,
  not copied Bigtop source code.
- License verification state: assumed from Apache project/repository identity
  and must be rechecked before publishing source-code excerpts.

## Rejected Alternative

Portolan self-map was rejected as the primary demo target. It would be faster
and simpler, but it overfits to this repository and does not show the
multi-repo, weak-evidence behavior that makes Bigtop useful as a public demo.

## Network And Disk Behavior

- `git clone` requires network access and disk space chosen by the user.
- Portolan commands in the demo are local and read-only.
- Portolan writes only to the explicit `--out` paths.
- Full generated outputs can contain absolute local paths and should not be
  shared without privacy review.

## CLI Verification

Verified locally on 2026-05-30:

```bash
go run ./cmd/portolan --help
go run ./cmd/portolan context --help
go run ./cmd/portolan map --help
go run ./cmd/portolan query --help
```

Current supported command forms:

```bash
portolan context prepare --root <dir> --out <dir> --profile cursor [--force]
portolan map --root <dir> --out <dir> [--force]
portolan query gaps --bundle <map-run-dir> [--limit 20]
portolan query findings --bundle <map-run-dir> --kind <kind> [--limit 20]
portolan graph slice --bundle <map-run-dir> --repo <id> --out <slice.json>
```

Status: verified for command availability, not a guarantee that every public
machine has a prepared multi-repo Bigtop checkout.
