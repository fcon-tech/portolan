# GitHub Metadata Proposal

**Date**: 2026-05-30

## Approved Metadata

Description:

```text
Local-first evidence maps for AI agents working across unfamiliar codebases.
```

Homepage:

```text
Leave blank until specs/050-fcon-portolan-pages-site publishes a maintained
GitHub Pages URL.
```

Topics:

```text
ai-agents
codebase-analysis
code-intelligence
software-architecture
evidence-graph
local-first
go
cli
developer-tools
oss
sbom
semgrep
cyclonedx
```

Rejected topics:

```text
observability
service-catalog
security-scanner
modernization
readiness
```

## Application Instructions

Apply with GitHub repository settings or an admin-capable GitHub CLI token:

```bash
gh repo edit fcon-tech/portolan \
  --description "Local-first evidence maps for AI agents working across unfamiliar codebases." \
  --add-topic ai-agents \
  --add-topic codebase-analysis \
  --add-topic code-intelligence \
  --add-topic software-architecture \
  --add-topic evidence-graph \
  --add-topic local-first \
  --add-topic go \
  --add-topic cli \
  --add-topic developer-tools \
  --add-topic oss \
  --add-topic sbom \
  --add-topic semgrep \
  --add-topic cyclonedx
```

Do not set a homepage until the Pages URL is maintained and verified.

## Current Application State

- Topics: `verified`; the approved topic set is present on GitHub.
- Homepage: `verified`; empty.
- Description: `verified`; after admin access was granted, the approved
  description was applied and verified with `gh repo view fcon-tech/portolan
  --json nameWithOwner,description,homepageUrl,repositoryTopics,isPrivate,url`.
