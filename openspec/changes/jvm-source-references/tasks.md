# Tasks — jvm-source-references

## Spec artifacts

- [x] proposal.md
- [x] design.md
- [x] specs/ontology/spec.md (ADDED: JVM source references from imports)

## Implementation slices (design TBD)

### Slice 1: FQN index + JVM import resolver
- [ ] Build FQN index: scan .java/.kt/.scala for package + class declarations
- [ ] Resolve imports: match import statements against the FQN index
- [ ] Emit references edges for resolved imports
- [ ] External nodes for unresolved imports
- [ ] Star import handling: ambiguous → not_assessed
- [ ] Evidence state: metadata-visible for all source-detected edges

### Open questions
- [ ] Full scan vs. bounded sampling for large codebases?
- [ ] How to handle Scala object/package imports?
- [ ] Should inner classes be indexed separately?
- [ ] Performance budget: how many files before the FQN index becomes expensive?
