# GitHub Security Settings

**Date**: 2026-05-30

## Private Vulnerability Reporting

State: `verified`

Evidence:

```bash
gh api -i repos/fcon-tech/portolan/private-vulnerability-reporting
```

The GitHub API returned HTTP 200 and:

```json
{"enabled":true}
```

## SECURITY.md Decision

`SECURITY.md` may point to GitHub private vulnerability reporting as the primary
public security channel.

No fallback email alias is published for v1 because no monitored alias was
verified.
