# Implementation Plan: Large Findings JSONL

## Decision Gate

- Simpler/Faster: replace the `bufio.Scanner` reader in `readFindings` with a
  line reader that does not impose the scanner token limit. Keep the finding
  writer and schema unchanged.
- Blocking Edge Cases: raising the scanner buffer still leaves an arbitrary
  cap and can fail again on larger evidence clusters. The reader must handle
  long, valid JSONL lines while keeping parse failures explicit.
- Existing Open Source: Go stdlib is enough. No JSONL dependency is justified.

## Technical Approach

- Update `internal/maprun.readFindings` to use `bufio.Reader.ReadString('\n')`.
- Trim whitespace per existing behavior.
- Parse each non-empty line into `Finding`.
- Add a package-local regression test with a long summary field.
- Re-run the real `/home/fall_out_bug/projects/vibe_coding` map smoke.

## Verification

Run:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
.portolan/bin/portolan map --root /home/fall_out_bug/projects/vibe_coding --out /tmp/portolan-vibecoding-map-028 --force
```
