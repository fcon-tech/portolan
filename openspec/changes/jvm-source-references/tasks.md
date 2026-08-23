# Tasks — jvm-source-references

> Reconciled 2026-08-23 against the implementation. Slice 1 is fully landed
> (`internal/relationships/jvm_refs.go`; commits aebdf37, 0073e26).

## Spec artifacts

- [x] proposal.md
- [x] design.md
- [x] specs/ontology/spec.md (ADDED: JVM source references from imports)

## Implementation slices

### Slice 1: FQN index + JVM import resolver
- [x] Build FQN index: scan .java/.kt/.scala for package + class declarations
      (`parseJVMDeclarations`, `jvm_refs.go:183`)
- [x] Resolve imports: match import statements against the FQN index
      (`parseJVMImports` + `DetectJVMReferences`, `jvm_refs.go:58`)
- [x] Emit references edges for resolved imports (bridged into repo-level graph
      via `internal/maprun/symbolrefs.go`)
- [x] External nodes for unresolved imports (aebdf37, spec-compliance fix
      b48a831 family)
- [x] Star import handling: ambiguous → external package node labelled
      "star import — ambiguous", never resolved (`jvm_refs.go:102-118`)
- [x] Evidence state: metadata-visible for all source-detected edges
- [x] Tests: `jvm_refs_test.go` (6 test funcs) — covers cross-repo, unresolved,
      star imports, malformed declarations

### Open questions
- [ ] Full scan vs. bounded sampling for large codebases?
- [ ] How to handle Scala object/package imports? (wildcard `_` imports are
      parsed; object/package semantics not separately modeled)
- [ ] Should inner classes be indexed separately?
- [ ] Performance budget: how many files before the FQN index becomes expensive?
