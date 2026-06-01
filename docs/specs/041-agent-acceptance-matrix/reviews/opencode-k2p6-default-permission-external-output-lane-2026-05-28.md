# OpenCode K2P6 Default-Permission External Output Lane

Date: 2026-05-28

Status: failed

## Scope

- Harness: OpenCode `1.15.10`
- Model: `kimi-for-coding/k2p6`
- Portolan path: `/home/fall_out_bug/projects/sdp/portolan`
- Target path: `/home/fall_out_bug/projects/vibe_coding/spec-kit`
- Output path: `/tmp/portolan-opencode-default-permission-lc7uw2`
- Prompt source: copyable prompt block from `docs/agent/INSTALL-PROMPT.md`
- Permission mode: default OpenCode run, without
  `--dangerously-skip-permissions`

This lane assesses whether the documented install prompt works with OpenCode's
default permissions when the requested output directory is outside the Portolan
checkout.

## Command

```bash
opencode run --model kimi-for-coding/k2p6 --format json \
  --dir /home/fall_out_bug/projects/sdp/portolan \
  "$(cat /tmp/portolan-opencode-default-permission.md)" \
  > /tmp/portolan-opencode-default-permission-lc7uw2/session.json \
  2> /tmp/portolan-opencode-default-permission-lc7uw2/stderr.txt
```

OpenCode session:

```text
ses_194ab47fdffeC1oGLavIfDkri5
```

## Observed Behavior

- OpenCode read `docs/agent/INSTALL.md`.
- OpenCode confirmed no `selection.json` was present on the target.
- OpenCode ran:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

- OpenCode then attempted:

```bash
mkdir -p /tmp/portolan-opencode-default-permission-lc7uw2
```

- The harness rejected the tool call:

```text
permission requested: external_directory (/tmp/portolan-opencode-default-permission-lc7uw2/*); auto-rejecting
```

No context or map artifacts were produced.

## Assessment

- `failed`: OpenCode default-permission execution with an external `/tmp`
  output path does not satisfy the install-prompt acceptance contract.
- `verified`: The failure is explicit in the session log and stderr.
- `not_assessed`: OpenCode default-permission behavior when `OUTPUT_PATH`
  stays inside the current working directory.
- Cursor UI behavior is outside the current required acceptance scope.

## Claim Impact

Product claims may say verified OpenCode lanes required explicit permission
bypass for external output paths. They must not imply default-permission
OpenCode works for external output paths.
