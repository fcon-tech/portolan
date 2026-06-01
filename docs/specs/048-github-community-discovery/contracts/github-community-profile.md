# Contract: GitHub Community Profile

## Repository Metadata Contract

The public GitHub metadata is acceptable only when:

- description identifies Portolan as a local-first evidence-preparation CLI or
  toolbox for AI agents;
- topics are capability-based and conservative;
- homepage is absent or points to a maintained public page;
- badges are backed by checked state;
- GitHub settings application is recorded separately from repo-local docs.

## Community File Contract

The repository community profile is acceptable only when:

- `CONTRIBUTING.md` explains SpecKit, baseline checks, and evidence labels;
- `SECURITY.md` names reporting path, supported versions, and limitations;
- conduct guidance is present and maintainer-approved;
- issue templates ask for reproduction evidence;
- PR template asks for verification, product-claim impact, and evidence-state
  impact;
- no file implies broad support, SLA, security certification, or enterprise
  readiness.

## Security Contact Contract

The preferred public security contact pattern is:

- enable GitHub private vulnerability reporting for `fcon-tech/portolan`;
- make `SECURITY.md` point reporters to GitHub's private report flow;
- do not publish a fallback email unless that alias exists, is monitored, and
  has an owner;
- tell reporters not to include sensitive vulnerability details in public
  issues, discussions, or pull requests;
- state response expectations conservatively, for example "best effort" until
  maintainers commit to an SLA.

## Proposed Metadata

Description:

> Local-first evidence maps for AI agents working across unfamiliar codebases.

Homepage:

```text
Use the GitHub Pages URL from docs/specs/050-fcon-portolan-pages-site/ once
published. Until then, leave homepage blank or point to the repository README
only if maintainers explicitly prefer that temporary state.
```

Candidate topics:

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

Rejected topics for now:

```text
observability
service-catalog
security-scanner
modernization
readiness
```
