Here is the security and code review for Portolan PR #1 focusing on correctness, graph schema, output safety, and evidence determinism.

### Critical
*(None)*

### Major
**1. Non-deterministic and lossy node deduplication within claims (`internal/scan/scan.go: 285-286`)**
- Multiple claims in a single file referencing the same subject/object overwrite each other in the `nodesByID` map, randomly dropping the `Evidence.Source` of the earlier claims.
- **Fix:** Append all generated node references and deduplicate globally across the graph, or explicitly merge evidence sources.

**2. Duplicate Nodes Across Targets/Claims (`internal/scan/scan.go: 56-63`)**
- `scanTarget` and `scanClaimSource` simply append to `g.Nodes`. If multiple claim files or targets refer to the exact same node ID, duplicate nodes with the same ID will be printed to the JSON representation. This breaks standard graph semantics.
- **Fix:** Deduplicate nodes by ID at the graph assembly level. If a node already exists with `source-visible` evidence, do not overwrite it with a `claim-only` node.

**3. Unstable Edge Verification / Non-Deterministic Sorting (`internal/scan/scan.go: 350-357`)**
- `sort.Slice` is being used to sort edges by `From`, `To`, and `Kind`. `sort.Slice` is *not stable* in Go. If two edges have identical `From/To/Kind` but come from different claim sources, their order in the JSON array will randomly swap on reruns, violating requirement SC-004.
- **Fix:** Expand the edge sorting criteria to include `g.Edges[i].Evidence.Source` (and optionally `Evidence.Reason`), or use `sort.SliceStable`. Expanding the sort key is safer for deterministic JSON content. 

### Minor
**4. Double-Marshal Overhead and Mismatched Claim in Disposition (`internal/app/app.go: 69-74`)**
- `slice1-review-disposition.md` claims the Pi byte-count finding was "fixed by... reporting the actual indented JSON payload size." However, the code ignores the bytes written by `scan.Write` and executes a second `scan.Marshal(g)` just to calculate `len(encoded)`. 
- **Fix:** Have `scan.Write` return the byte count, or `os.Stat` the target path to get the true committed file size, avoiding the duplicate memory allocation.

**5. Unexpected edge kind fallback (`internal/scan/scan.go: 334`)**
- `normalizeEdgeKind` defaults unknown predicates to `"claims"`. The JSON schema defines an `"unknown"` edge enum. Coercing an unrecognized predicate (e.g. `"runs"`) to `"claims"` changes the structural meaning of the edge rather than denoting that the relationship kind is simply unrecognized.
- **Fix:** Fall back to `"unknown"` instead of `"claims"` to preserve evidence honesty.
