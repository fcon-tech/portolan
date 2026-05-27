# Contract: Bounded jscpd Profile

This contract defines the reviewable output expectations for the bounded
`jscpd` producer profile.

## Required Ledger Fields

Each producer attempt must record:

```json
{
  "producer": "jscpd",
  "target": "<local target or fixture>",
  "profile": "<bounded profile name>",
  "state": "verified | failed | blocked | not_assessed",
  "command_shape": "<safe local command shape>",
  "output_dir": "<selected output directory>",
  "evidence_path": "<output or review artifact path>",
  "reason": "<required for non-verified states>",
  "limits": {
    "timeout": "<duration>",
    "include": ["<pattern>"],
    "exclude": ["<pattern>"],
    "size_limit": "<limit or not_assessed>"
  }
}
```

## Acceptance Rules

- `verified`: bounded run completed and produced usable JSON output.
- `failed`: bounded run executed but timed out, returned an error, exceeded a
  limit, or produced malformed/unusable output.
- `blocked`: prerequisites were missing or unsafe to satisfy locally.
- `not_assessed`: the producer was deliberately not run.

## Claim Rules

- Positive near-clone claims must cite `verified` producer attempts.
- Failed, blocked, partial, missing, or malformed attempts are limitations, not
  positive product evidence.
- Fixture evidence may validate parsing and ledger behavior, but Bigtop or
  inherited-estate claims require target-specific evidence.
