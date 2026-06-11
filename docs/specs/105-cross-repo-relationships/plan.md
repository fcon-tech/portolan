# Plan: Cross-Repo Relationships (105)

- `scan-cross-repo.sh` reads repo-profiles.json + producers/syft + producers/jscpd-cross.
- `portolan-scan.sh`: `--cross-repo-dup` flag → bounded jscpd root pass.
- `build-portolan-bundle.sh`: ingest cross-dup hotspots; call scan-cross-repo; manifest `relationship_count`.
