# Graph Producer Decision Record

Spec: `docs/specs/077-bigtop-callgraph-symbol-closure/`

Date: 2026-06-02

## Decision

Do not claim full Bigtop symbol/reference graph or call graph from currently
available local evidence. Record the state as `cannot_verify` for full C6 and
callgraph closure unless a later approved slice installs/enables a mature graph
producer or runs required target builds.

confidence: high

reversibility: high; a later slice can upgrade the claim if a mature producer
is approved, installed, run, ledgered, and independently reviewed.

## Candidate Producer Comparison

| Producer family | Fit | Current local state | Risk / blocker | Decision |
| --- | --- | --- | --- | --- |
| SCIP/LSIF indexers | Good fit for code-intelligence symbol occurrence indexes when language-specific indexers exist. | `scip`, `lsif-java`, `lsif-go`, and `src-cli` not found. | Requires installing/enabling indexers and per-language setup. | `cannot_verify` now; candidate for future approved tooling slice. |
| CodeQL CLI database | Strong query/database substrate; can expose call/data/control-flow style facts after database creation. | `codeql` not found. | For compiled languages, database creation typically requires an available build command; installing CLI or running builds is outside this slice. | `cannot_verify` now; candidate only with explicit install/build approval. |
| Eclipse JDT LS/JDT model | Strong Java semantic model candidate. | `jdtls` and `java-language-server` not found. | Requires local workspace import and an extraction adapter/client; may write workspace metadata. | `cannot_verify` now; future adapter/design slice required. |
| srcML | Mature multi-language source-to-XML producer. | `srcml` not found. | Structural XML is not a resolved def/use or call graph by itself. | Not sufficient for full graph claim; possible structural evidence only. |
| Joern | Mature code property graph family for some languages. | `joern` not found. | Installation/runtime footprint and language fit need separate approval. | `cannot_verify` now. |
| Universal Ctags | Already available and used at scale. | `ctags` 6.2.1 found. | Produces useful tags/reference roles but not resolved full graph or call graph. | Keep as partial evidence; do not upgrade. |
| gopls | Available Go semantic tooling. | `gopls` v0.21.1 found. | Go-only; prior output was selected-file symbols, not Bigtop-wide graph. | Keep as partial evidence; no broad upgrade. |
| jdeps | Available compiled-artifact dependency tool. | `jdeps` 26.0.1 found. | Needs meaningful compiled artifacts; prior evidence was narrow/test-resource dominated. | Keep as bounded dependency evidence; no callgraph upgrade. |
| Maven / Java | Available build/runtime prerequisites. | `mvn` 3.9.16 and OpenJDK 26.0.1 found. | Maven dependency/effective-POM output can be bounded dependency metadata, not resolved source def/use or call graph evidence; Java is a runtime/build prerequisite, not a graph exporter. | Keep as prerequisites only; do not upgrade C6/callgraph. |

## Source Notes

- Sourcegraph documents SCIP indexers as command-line tools that emit project
  metadata for definitions, references, and hover documentation, which is a good
  conceptual fit when indexers are available:
  https://sourcegraph.com/docs/code-navigation/how-to/index-other-languages
- GitHub CodeQL documentation shows compiled-language database creation using a
  build command, so a safe Bigtop CodeQL path would need explicit install/build
  approval and command evidence:
  https://docs.github.com/code-security/codeql-cli/creating-codeql-databases
- Eclipse JDT LS uses the Language Server Protocol and initializes an Eclipse
  workspace/import model under the hood, which makes it a candidate only after a
  workspace/write-boundary design is approved:
  https://www.eclipse.org/community/eclipse_newsletter/2017/may/article4.php
- srcML documents its format as XML markup for source-code syntax. That is
  useful structural evidence, but without semantic binding/type resolution it is
  not sufficient alone for resolved def/use or call graph evidence:
  https://www.srcml.org/about.html
- Joern documents code property graphs as its analysis substrate, but the tool
  is absent locally and its installation/runtime footprint needs separate
  approval:
  https://docs.joern.io/code-property-graph/

## Rejected Alternatives

- **Run spec 076 parity now**: rejected because it would preserve known
  `cannot_verify` C6/callgraph gaps rather than closing them.
- **Use Ctags as a full graph proxy**: rejected because prior specs already
  proved Ctags output is reference-role/tag evidence only.
- **Use Maven as graph producer**: rejected because Maven is a build tool, not
  a resolved def/use or call graph exporter by itself. Maven dependency-tree or
  effective-POM output may support bounded dependency metadata, but that is
  materially weaker than full C6/callgraph evidence and is already covered by
  prior dependency/artifact slices.
- **Implement a native Portolan graph extractor**: rejected because the
  constitution requires composing mature OSS/tool outputs before building
  native scanners, and this slice has not justified implementation cost.

## Claim Boundary

verified:

- The current local environment has no available full graph producer in PATH.
- Existing producer evidence strengthens C6 only partially.

cannot_verify:

- Full Bigtop symbol/reference graph.
- Bigtop call graph.
- Cursor plus Portolan human/enterprise parity.

next approved actions:

- Approve an installation/enabling slice for one mature graph producer family,
  or approve target builds/index generation with explicit local-first,
  read-only/mutation boundaries.
- Otherwise keep full C6/callgraph as `cannot_verify` in spec 076.
