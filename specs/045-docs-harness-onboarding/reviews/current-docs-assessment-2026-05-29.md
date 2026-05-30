# Current Docs Assessment: Docs And Harness Onboarding

Date: 2026-05-29

## Scope

Assessed current repository documentation for:

- human documentation;
- agent documentation;
- install and build simplicity;
- Cursor support;
- OpenCode support.

## Assessment

| Area | What is already good | Gap to improve now |
| --- | --- | --- |
| Human documentation | `README.md`, `docs/ru/README.md`, `docs/product-claims.md`, `docs/product-boundary.md`, `docs/evidence-model.md`, `docs/release.md`, and `docs/oss-composition.md` are coherent about local-first evidence, product non-goals, safe claims, and current limitations. | First-hop routing is scattered. A human has to know whether to read README, product claims, release, agent docs, or acceptance matrix. |
| Agent documentation | `docs/agent/QUICKSTART.md`, `INSTALL.md`, `INSTALL-PROMPT.md`, `CONFIG.md`, `EXAMPLES.md`, `TROUBLESHOOTING.md`, and `ACCEPTANCE.md` preserve evidence states, no-network defaults, output directories, bounded artifacts, and copyable prompts. | Harness-specific setup constraints are not visible early enough. OpenCode default-permission output behavior is mostly in acceptance evidence, not the normal operator path. |
| Install and build simplicity | `scripts/bootstrap-portolan` is small, local, repo-scoped, and disables Go module fetching unless `PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1` is explicitly set. README and release docs show source bootstrap and local smoke checks. | No prebuilt binaries exist yet, which is honestly documented. The improvement needed now is route clarity, not another installer. |
| Cursor | `.cursor/rules/portolan-map.mdc` routes broad codebase questions through Portolan before claims. Product claims and acceptance docs keep Cursor evidence narrow. | Readers need a simpler reminder that verified evidence is headless Cursor Agent CLI / Composer, not Cursor UI behavior. |
| OpenCode | `docs/agent/ACCEPTANCE.md` records verified OpenCode + `kimi-for-coding/k2p6` lanes across self-target, Bigtop, black-box, English/Russian install prompts, and repo-local default-permission output. It also records the failed external-output default-permission lane. | No `.opencode` project config exists, and that is acceptable. The useful improvement is a visible operator note: use repo-local `.portolan/runs/...` output under default permissions; arbitrary external output is not verified and failed in the recorded lane. |

## Decision Gate

- Simpler/Faster: Add one onboarding route and a few links instead of adding new CLI behavior, installer scripts, or harness-specific configs.
- Blocking Edge Cases: The docs must not broaden Cursor UI or OpenCode support beyond recorded evidence. They must also preserve no-network, no-credentials, no-daemon, read-only target behavior, and weak evidence states.
- Existing Open Source: No new OSS tool is needed. The existing open-source pattern in use is GitHub Spec Kit-style docs and local Markdown routing.

## Recommendation

Implement `specs/045-docs-harness-onboarding/` as a docs-only slice:

1. Add `docs/onboarding.md` as the maintained route.
2. Link it from README, Russian README, and agent docs.
3. Surface Cursor and OpenCode boundaries in normal operator docs.
4. Record local verification and keep PR/GitHub readiness as `not_assessed` until a PR workflow runs.

## Evidence

- `README.md`
- `docs/ru/README.md`
- `docs/agent/QUICKSTART.md`
- `docs/agent/INSTALL.md`
- `docs/agent/INSTALL-PROMPT.md`
- `docs/agent/ACCEPTANCE.md`
- `.cursor/rules/portolan-map.mdc`
- `scripts/bootstrap-portolan`
- `docs/product-claims.md`
- `docs/product-backlog.md`
