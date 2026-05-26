# Quickstart: Full Bigtop Landscape Map

This quickstart defines the target operator flow after this slice is
implemented. It does not allow partial Bigtop acceptance.

## 1. Prepare The Full Corpus

Use the committed Bigtop corpus manifest as the inventory source:

```bash
jq empty corpora/apache-bigtop/manifest.json
```

Prepare the Bigtop meta-repository and local source repositories for every
active or external product repository in the manifest. Also prepare local
metadata/tool-output files for support packages, retired projects, release
metadata, binary repositories, Docker surfaces, and runtime surfaces. The
preparation step may clone or fetch repositories only as an explicit setup
action before the blind map run. The map run itself remains offline and
read-only.

After the repositories are present locally, generate the selection from the
manifest and the checkout directory:

```bash
portolan selection generate-bigtop \
  --manifest corpora/apache-bigtop/manifest.json \
  --repo-dir /path/to/bigtop-landscape/repos \
  --out /path/to/bigtop-landscape/selection.json \
  --force
```

The preparation output is a landscape selection such as:

```text
/path/to/bigtop-landscape/selection.json
```

## 2. Validate 100% Representation

Run the coverage gate. Acceptance is blocked if any active or external Bigtop
product repository is missing locally or is not `source-visible` in the
selection. Acceptance is also blocked if required non-source inventory entries
are omitted from the selection.

```bash
portolan map --selection /path/to/bigtop-landscape/selection.json \
  --out /path/to/bigtop-landscape/run \
  --force
```

Expected artifacts:

```text
/path/to/bigtop-landscape/run/run.json
/path/to/bigtop-landscape/run/coverage.json
/path/to/bigtop-landscape/run/graph.json
/path/to/bigtop-landscape/run/findings.jsonl
/path/to/bigtop-landscape/run/map.md
```

If product source coverage is incomplete, the run blocks before acceptance and
reports missing product repository ids. Do not replace this with a fixture pass
or metadata-only representation.

## 3. Run The Blind Agent Case

Give the agent only:

```text
Portolan: /path/to/portolan
Landscape: /path/to/bigtop-landscape/selection.json
Output: /path/to/bigtop-landscape/agent-run

map this shit.

Do not fetch upstream repositories.
Do not use network.
Do not mutate selected repositories.
Do not infer facts outside Portolan artifacts.
Record every Portolan capability gap you hit.
```

## 4. Review The CTO Packet

Inspect:

- `coverage.json` for 100% Bigtop representation;
- `graph.json` for evidence-backed nodes and edges;
- `findings.jsonl` for relationship, contract/surface, duplication,
  configuration, technical-debt, unknown, cannot-verify, and not-assessed
  findings;
- `map.md` for CTO-readable inventory, architecture, contracts, duplication,
  legacy, gaps, and next-agent tasks.

## 5. Stop Rule

If the packet lacks the sections needed by a CTO and their agent to continue
work, record concrete generic product gaps. Do not add Bigtop-only behavior to
hide missing capabilities.
