# Pages Dependency Check

**Date**: 2026-05-31

## Checked Routes

| Dependency | Evidence | Status |
| --- | --- | --- |
| 047 install/release route | `README.md`, `docs/release.md`, `docs/releases/v0.1.0.md`, and `docs/agent/INSTALL.md` exist and carry source-checkout / `v0.1.0` install guidance. | verified |
| 049 demo route | `docs/demo.md` and `examples/public-demo/bigtop/` exist. | verified |
| Contribution route | `CONTRIBUTING.md` exists. | verified |
| Security route | `SECURITY.md` exists. | verified |
| Support route | `SUPPORT.md` exists. | verified |

## Decision

User Story 2 can link to the stable repository routes above. The site must still avoid saying the versioned `go install` route is verified until the `v0.1.0` tag exists publicly.

## Not Assessed

- Live GitHub Release publication state.
- Live GitHub Pages deployment state.
- Live public URL reachability.
