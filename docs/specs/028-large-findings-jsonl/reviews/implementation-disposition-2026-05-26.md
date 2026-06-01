# Implementation Disposition: Large Findings JSONL

## Scope

Fixed a real scale blocker discovered during product validation on
`/home/fall_out_bug/projects/vibe_coding`: map rendering failed while reading a
large valid `findings.jsonl` line.

## Decision Gate

- Simpler/Faster: replaced `bufio.Scanner` in `readFindings` with
  `bufio.Reader.ReadString('\n')`; no schema or writer changes.
- Blocking Edge Cases: increasing Scanner buffer would still leave an arbitrary
  cap. Real findings can be hundreds of kilobytes per JSONL line.
- Existing Open Source: Go stdlib is sufficient; no JSONL dependency added.

## Review Lanes

- Local reviewer: accepted. The fix is scoped to JSONL reading and preserves
  parse errors.
- External model lanes: `not_assessed`; this was handled as a focused scale bug
  discovered and verified locally.

## Verification

- `verified`: `go test -count=1 ./internal/maprun`
- `verified`: `go test -count=1 ./...`
- `verified`: `jq empty schema/*.json`
- `verified`: `git diff --check`
- `verified`: `.portolan/bin/portolan map --root /home/fall_out_bug/projects/vibe_coding --out /tmp/portolan-vibecoding-map-028 --force`
- `verified`: the real map bundle wrote successfully after the fix.
- `verified`: headless Cursor Agent used the resulting context/map artifacts
  and followed `answer-contract.md` without loading full `graph.json`.

## Remaining Risks

- The raw `graph.json` for this target is about 681 MB. The current fix makes
  map generation complete, but does not solve bounded graph querying for agents.
