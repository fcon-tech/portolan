package maprun

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/fcon-tech/portolan/internal/coverage"
	"github.com/fcon-tech/portolan/internal/graph"
	"github.com/fcon-tech/portolan/internal/importer"
	"github.com/fcon-tech/portolan/internal/selection"
)

const symbolIndexDir = ".portolan/symbol-index"

type symbolReferenceResult struct {
	Nodes    []graph.Node
	Edges    []graph.Edge
	Findings []Finding
	Records  []coverage.Record
}

// importSymbolReferences discovers operator-supplied symbol-index JSON exports
// under <root>/.portolan/symbol-index/, imports each via the importer, and lifts
// the resolved reference edges to repo-level graph edges so they reach the
// system-map as typed `references` relationships.
//
// Granularity reconciliation: the importer emits document→symbol edges. This
// function lifts them to repo→repo edges by mapping document paths back to
// discovered repos (longest-prefix match, with a basename fallback for exports
// whose paths are repo-relative). Three outcomes per reference:
//
//   - Cross-repo resolved → repo→repo `references` edge (metadata-visible).
//   - Out-of-perimeter resolved → external node + `references` edge.
//   - Unresolved → coverage `unknown` record; never a guessed edge.
//
// Intra-repo references are not lifted: they are within a single landscape unit
// and do not produce a cross-unit relationship.
func importSymbolReferences(root string, repos []selection.Target) symbolReferenceResult {
	var result symbolReferenceResult

	exports := discoverSymbolIndexExports(root)
	if len(exports) == 0 {
		return result
	}

	repoIndex := buildRepoIndex(root, repos)

	seenEdges := map[string]bool{}
	externalNodes := map[string]graph.Node{}

	for _, exportPath := range exports {
		impGraph, _ := importer.ParseSymbolIndex(exportPath)

		// Build symbol → defining-document map from owns edges.
		// An `owns` edge from a document node to a symbol node means that
		// document contains the symbol with a non-reference role (typically a
		// definition). The source→document owns edges are excluded.
		defDocBySymbol := map[string]string{}
		for _, edge := range impGraph.Edges {
			if edge.Kind != "owns" {
				continue
			}
			if !strings.HasPrefix(edge.From, "symbol-index:document:") {
				continue
			}
			if !strings.HasPrefix(edge.To, "symbol-index:symbol:") {
				continue
			}
			if _, ok := defDocBySymbol[edge.To]; !ok {
				defDocBySymbol[edge.To] = stripPrefix(edge.From, "symbol-index:document:")
			}
		}

		for _, edge := range impGraph.Edges {
			switch edge.Kind {
			case "references":
				refDoc := stripPrefix(edge.From, "symbol-index:document:")
				if refDoc == "" {
					continue
				}
				defDoc := defDocBySymbol[edge.To]
				fromRepo := repoIndex.repoForDocument(refDoc)
				if fromRepo == "" {
					continue
				}
				toRepo := repoIndex.repoForDocument(defDoc)
				if toRepo != "" && toRepo == fromRepo {
					continue
				}
				if toRepo != "" {
					dedupKey := fromRepo + "\x00" + toRepo + "\x00references"
					if seenEdges[dedupKey] {
						continue
					}
					seenEdges[dedupKey] = true
					result.Edges = append(result.Edges, graph.Edge{
						From: fromRepo,
						To:   toRepo,
						Kind: "references",
						Evidence: graph.Evidence{
							State:  graph.MetadataVisible,
							Source: exportPath,
							Reason: "cross-repo symbol reference resolved from symbol-index export; not a complete call graph",
						},
					})
				} else {
					extID := "external:symbol-ref:" + stableID(defDoc)
					if _, ok := externalNodes[extID]; !ok {
						externalNodes[extID] = graph.Node{
							ID:    extID,
							Kind:  "external",
							Label: defDoc,
							Evidence: graph.Evidence{
								State:  graph.MetadataVisible,
								Source: exportPath,
								Reason: "reference resolves outside the expedition perimeter; recorded as external, not crawled",
							},
						}
						result.Nodes = append(result.Nodes, externalNodes[extID])
					}
					dedupKey := fromRepo + "\x00" + extID + "\x00references"
					if seenEdges[dedupKey] {
						continue
					}
					seenEdges[dedupKey] = true
					result.Edges = append(result.Edges, graph.Edge{
						From: fromRepo,
						To:   extID,
						Kind: "references",
						Evidence: graph.Evidence{
							State:  graph.MetadataVisible,
							Source: exportPath,
							Reason: "out-of-perimeter symbol reference; not crawled",
						},
					})
				}
			case "unknown":
				refDoc := stripPrefix(edge.From, "symbol-index:document:")
				if refDoc == "" {
					continue
				}
				fromRepo := repoIndex.repoForDocument(refDoc)
				repoForRecord := fromRepo
				if repoForRecord == "" {
					repoForRecord = "(unknown-repo)"
				}
				result.Records = append(result.Records, coverage.Record{
					ID:            "symbol-ref-unresolved-" + stableID(refDoc+":"+edge.To),
					Kind:          "symbol-reference",
					Status:        "unknown",
					EvidenceState: string(graph.Unknown),
					Source:        exportPath,
					Reason:        "symbol reference has no matching definition in the export; recorded as unknown, not guessed",
				})
				_ = repoForRecord
			}
		}
	}

	if len(result.Edges) > 0 {
		result.Findings = append(result.Findings, Finding{
			ID:             "finding-symbol-references-resolved",
			Kind:           "relationships",
			Summary:        fmt.Sprintf("Resolved %d cross-repo symbol reference(s) from local symbol-index export(s); metadata-visible, not a complete call graph.", len(result.Edges)),
			Severity:       "info",
			EvidenceState:  string(graph.MetadataVisible),
			EvidenceSource: strings.Join(exports, "; "),
			Confidence:     0.8,
			Status:         "observed",
		})
	}
	if len(result.Records) > 0 {
		result.Findings = append(result.Findings, Finding{
			ID:             "finding-symbol-references-unresolved",
			Kind:           "relationships",
			Summary:        fmt.Sprintf("%d symbol reference(s) could not be resolved in the local export; recorded as unknown.", len(result.Records)),
			Severity:       "info",
			EvidenceState:  string(graph.Unknown),
			EvidenceSource: strings.Join(exports, "; "),
			Confidence:     0,
			Status:         "unknown",
		})
	}

	return result
}

func discoverSymbolIndexExports(root string) []string {
	dir := filepath.Join(root, symbolIndexDir)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}
	var paths []string
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !strings.HasSuffix(name, ".json") {
			continue
		}
		paths = append(paths, filepath.Join(dir, name))
	}
	return paths
}

type repoLookup struct {
	entries []repoEntry
}

type repoEntry struct {
	id       string
	rootRel  string
	basename string
}

func buildRepoIndex(root string, repos []selection.Target) repoLookup {
	var entries []repoEntry
	for _, repo := range repos {
		rootRel := ""
		if rel, err := filepath.Rel(root, repo.Path); err == nil {
			rootRel = filepath.ToSlash(rel)
		}
		entries = append(entries, repoEntry{
			id:       repo.ID,
			rootRel:  rootRel,
			basename: filepath.Base(repo.Path),
		})
	}
	return repoLookup{entries: entries}
}

func (rl repoLookup) repoForDocument(docPath string) string {
	docPath = filepath.ToSlash(docPath)
	bestMatch := ""
	bestLen := 0
	for _, e := range rl.entries {
		if e.rootRel != "" && (docPath == e.rootRel || strings.HasPrefix(docPath, e.rootRel+"/")) {
			if len(e.rootRel) > bestLen {
				bestMatch = e.id
				bestLen = len(e.rootRel)
			}
		}
	}
	if bestMatch != "" {
		return bestMatch
	}
	firstComponent := docPath
	if idx := strings.Index(docPath, "/"); idx > 0 {
		firstComponent = docPath[:idx]
	}
	for _, e := range rl.entries {
		if e.basename == firstComponent {
			return e.id
		}
	}
	return ""
}

func stripPrefix(s, prefix string) string {
	if strings.HasPrefix(s, prefix) {
		return s[len(prefix):]
	}
	return ""
}
