You are evaluating Apache Bigtop architecture from the local workspace only.

Use the Bigtop workspace at `/home/fall_out_bug/projects/bigtop-landscape`.
Do not use Portolan artifacts, `.portolan` files, producer-run ledgers, prior stress outputs, or generated Portolan context. You may inspect normal source files in the workspace.

Answer the fixed question set below. Preserve uncertainty. If the workspace evidence is insufficient, say `not_assessed`, `unknown`, or `cannot_verify` instead of guessing. Do not claim runtime topology unless you find runtime-visible evidence, not static source/deployment hints.

Required output: markdown table with columns `question_id`, `answer`, `evidence`, `claim_status`, `remaining_gap`.

Question set:

# Bigtop Architecture Question Set

Date: 2026-06-02

## Scoring Rules

- `verified`: answer is correct for the scoped question and cites sufficient
  local evidence from required families.
- `partial`: answer is useful but narrower than the question or missing one
  required evidence family.
- `failed`: answer is wrong, overclaims, or cites unsupported evidence.
- `blocked`: required evidence cannot be safely produced in this slice.
- `not_assessed`: answer or evidence is missing.

Runtime topology cannot score `verified` without Bigtop `runtime-visible`
evidence. Deployment manifests, API descriptors, dependency inventories, source
files, and producer-run metadata are not runtime topology.

## Questions

| ID | Question | Required evidence for `verified` | Disallowed shortcuts | Expected weak boundary |
| --- | --- | --- | --- | --- |
| Q1 | What is the role of the Apache Bigtop repository within the selected Bigtop landscape? | source/inventory plus manifest/corpus evidence | Treating selected repos as complete ecosystem without corpus evidence | Completeness outside the corpus remains unknown |
| Q2 | Which selected repositories appear to be deployment or packaging surfaces, and what evidence supports that? | source/inventory plus deployment/model producer output | Inferring live runtime from Docker Compose or Helm templates | Deployment/model may verify declared packaging only |
| Q3 | What service or component relationships can be stated from the Bigtop Docker Compose output? | deployment/model producer-run and local output | Calling declared Compose services runtime topology | Runtime remains not_assessed |
| Q4 | What Kubernetes model evidence exists for Alluxio monitor, and what does it not prove? | Helm producer-run and local rendered manifest | Generalizing Alluxio monitor chart to all Bigtop Kubernetes architecture | Scope remains bounded to the chart |
| Q5 | What API/catalog evidence exists for Alluxio gRPC, and what architecture claim can it support? | protobuf descriptor producer-run and local output | Treating bounded descriptors as full API catalog or runtime call graph | Full Bigtop API catalog remains partial/not_assessed |
| Q6 | Does Portolan currently prove Bigtop runtime topology? | runtime-visible Bigtop observation evidence | Static dependency, deployment, source, or API evidence | Expected answer: blocked/not_assessed |
| Q7 | Does Portolan currently prove symbol/reference relationships across Bigtop? | symbol/reference producer output | Dependency/SBOM or file inventory | Expected answer: not_assessed |
| Q8 | Does Cursor plus Portolan give better evidence discipline than Cursor alone for architecture answers? | paired Cursor-only and Cursor-plus-Portolan outputs plus scoring ledger | Single-lane subjective impression | Improvement may be partial, failed, or not_assessed |
| Q9 | Which architecture claims are safe to make publicly after specs 054 and 055? | acceptance ledger plus product claim boundary | "Understands Bigtop like enterprise code intelligence" as broad claim | Only scoped claims may be verified |
