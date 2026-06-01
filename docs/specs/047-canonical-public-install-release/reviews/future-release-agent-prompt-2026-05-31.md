# Future Release Agent Prompt

Use this prompt only after all intended pre-release specs are closed and merged
to `main`.

```text
You are working in /home/fall_out_bug/projects/sdp/portolan.

Goal: prepare and publish the first source-first Portolan release v0.1.0.

Do not start by tagging. First reconstruct repo truth:
- read AGENTS.md;
- read .agents/skills/portolan-spec-delivery/SKILL.md;
- read docs/release.md;
- read docs/releases/v0.1.0.md;
- read docs/product-claims.md;
- read docs/specs/047-canonical-public-install-release/reviews/;
- read docs/specs/048-github-community-discovery/reviews/openssf-best-practices-self-assessment-2026-05-31.md.

Decision gate:
- Simpler/Faster: keep v0.1.0 source-first. No prebuilt binaries, Homebrew,
  Docker, npm, apt, Pages, Scorecard badge, or Best Practices badge unless
  explicitly approved in a separate spec.
- Blocking edge cases: do not publish a release from a dirty checkout, stale
  main, failing GitHub checks, stale product claims, unmerged release-relevant
  PRs, or missing release-closeout evidence.
- Existing Open Source: use standard Git tag, GitHub Release, Go module
  install, GitHub Actions, CodeQL, and OpenSSF/Best Practices services as
  external signals. Do not invent custom release machinery.

Required reconstruction:
1. Verify current branch is main, clean, and synced to origin/main.
2. List open PRs and specs. If any release-relevant PR/spec remains open, stop
   and report it.
3. Verify no v0.1.0 tag or GitHub release already exists. If either exists,
   stop and reconstruct the release state before changing anything.
4. Re-check product claims against docs/releases/v0.1.0.md. Do not broaden
   public wording beyond docs/product-claims.md.

Run release-candidate checks on current main:
- go test -count=1 ./...
- go vet ./...
- jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json
- git diff --check
- go run ./cmd/portolan --help
- go test -count=1 ./internal/app -run TestCanonicalPublicIdentityStaysAligned
- rg -n "github.com/(fcon-tech|fall-out-bug)/portolan|go install|git clone" README.md docs go.mod internal -S

Run clean-checkout smoke from a temporary clone:
- git clone https://github.com/fcon-tech/portolan.git <tmp>
- cd <tmp>
- scripts/bootstrap-portolan
- .portolan/bin/portolan --version
- .portolan/bin/portolan context prepare --root . --out /tmp/portolan-context-smoke --profile cursor --force
- .portolan/bin/portolan map --root . --out /tmp/portolan-map-smoke --force

Check GitHub:
- latest Actions checks for the release commit must be success or explicitly
  recorded as failed/blocked/not_assessed;
- CodeQL/code scanning and Dependabot open-alert state should be checked and
  recorded;
- do not treat absent or pending checks as green.

If all release-candidate checks pass and the user explicitly approves release
publication:
1. Create annotated tag v0.1.0 on the verified release commit.
2. Push tag v0.1.0.
3. Create GitHub Release v0.1.0 using docs/releases/v0.1.0.md as the release
   body.
4. Re-run external install smoke:
   go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0
   portolan --version
5. Record release closeout under
   docs/specs/047-canonical-public-install-release/reviews/ with:
   - release commit;
   - tag;
   - GitHub release URL;
   - local checks;
   - clean-checkout smoke;
   - go install @v0.1.0 smoke;
   - GitHub checks;
   - product-claim scan;
   - blocked/not_assessed surfaces.

Do not merge or publish anything without explicit user approval at the release
publication step.
```
