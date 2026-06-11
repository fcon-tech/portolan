# Plan: Repo Profiles Producer (104)

- `scripts/scan-repo-profiles.sh` (shell+jq): iterate repos.json, extract manifests/README/compose/Dockerfile/entrypoints/git stats.
- Slug ids in `build-portolan-bundle.sh` repos.json; check smoke expectations.
- Schema + `jq empty` check; wire into bundle build with gap-on-failure.
