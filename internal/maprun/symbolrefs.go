package maprun

import (
	"fmt"
	"hash/fnv"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/fcon-tech/portolan/internal/coverage"
	"github.com/fcon-tech/portolan/internal/graph"
	"github.com/fcon-tech/portolan/internal/importer"
	"github.com/fcon-tech/portolan/internal/selection"
)

const symbolIndexDir = ".portolan/symbol-index"

// maxSymbolIndexExportBytes caps the size of a single symbol-index export read
// in-process during root-path map collection. Mirrors the selection-path
// maxSelectedToolOutputBytes bound so a multi-GB export cannot OOM the collector.
const maxSymbolIndexExportBytes int64 = 64 * 1024 * 1024

type symbolReferenceResult struct {
	Nodes         []graph.Node
	Edges         []graph.Edge
	Findings      []Finding
	Records       []coverage.Record
	parsedExports int
}

// hasExports reports whether at least one symbol-index export was discovered
// and successfully parsed. Used by Run() to suppress the stale
// "symbol evidence not assessed" finding when exports ARE present.
func (r symbolReferenceResult) hasExports() bool {
	return r.parsedExports > 0
}

// importSymbolReferences discovers operator-supplied symbol-index JSON exports
// under <root>/.portolan/symbol-index/, imports each via the importer, and lifts
// the resolved reference edges to repo-level graph edges so they reach the
// system-map as typed `references` relationships.
//
// Document paths in exports may be root-relative (e.g. "repos/repo-a/src/x.js")
// or repo-basename-relative (e.g. "repo-a/src/x.js"). Absolute paths are
// normalized against root before matching. Matching uses longest-prefix on the
// root-relative path, with a basename fallback.
//
// Three outcomes per reference:
//   - Cross-repo resolved -> repo->repo `references` edge (metadata-visible).
//   - Out-of-perimeter resolved -> external node + `references` edge.
//   - Unresolved -> coverage `unknown` record; never a guessed edge.
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
	seenRecords := map[string]bool{}
	externalNodes := map[string]graph.Node{}

	for _, exportPath := range exports {
		info, err := os.Lstat(exportPath)
		if err != nil || info.Mode()&os.ModeSymlink != 0 {
			result.Records = append(result.Records, coverage.Record{
				ID:            "symbol-ref-export-" + stableID(exportPath),
				Kind:          "symbol-reference",
				Status:        "cannot_verify",
				EvidenceState: string(graph.CannotVerify),
				Source:        exportPath,
				Reason:        "symbol-index export is a symlink or unreadable; skipped",
			})
			continue
		}
		if info.Size() > maxSymbolIndexExportBytes {
			result.Records = append(result.Records, coverage.Record{
				ID:            "symbol-ref-export-oversized-" + stableID(exportPath),
				Kind:          "symbol-reference",
				Status:        "cannot_verify",
				EvidenceState: string(graph.CannotVerify),
				Source:        exportPath,
				Reason:        fmt.Sprintf("symbol-index export is %d bytes (limit %d); skipped", info.Size(), maxSymbolIndexExportBytes),
			})
			continue
		}

		impGraph, _ := importer.ParseSymbolIndex(exportPath)

		// Detect cannot_verify source nodes emitted by ParseSymbolIndex on
		// read/parse/empty failure and surface them as coverage records.
		if isImporterCannotVerify(impGraph) {
			result.Records = append(result.Records, coverage.Record{
				ID:            "symbol-ref-export-malformed-" + stableID(exportPath),
				Kind:          "symbol-reference",
				Status:        "cannot_verify",
				EvidenceState: string(graph.CannotVerify),
				Source:        exportPath,
				Reason:        "symbol-index export could not be parsed or contained no documents",
			})
			continue
		}
		result.parsedExports++

		// Build symbol -> defining-document map from owns edges.
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
				if defDoc == "" {
					continue
				}
				fromRepo := repoIndex.repoForDocument(refDoc)
				if fromRepo == "" {
					recID := "symbol-ref-unmapped-src-" + hashHex(refDoc+"\x00"+edge.To)
					if !seenRecords[recID] {
						seenRecords[recID] = true
						result.Records = append(result.Records, coverage.Record{
							ID:            recID,
							Kind:          "symbol-reference",
							Status:        "cannot_verify",
							EvidenceState: string(graph.CannotVerify),
							Source:        exportPath,
							Reason:        "resolved reference source document " + refDoc + " could not be mapped to a discovered repository",
						})
					}
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
					extID := "external:symbol-ref:" + hashHex(defDoc)
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
				recID := "symbol-ref-unresolved-" + hashHex(refDoc+"\x00"+edge.To)
				if seenRecords[recID] {
					continue
				}
				seenRecords[recID] = true
				reason := "symbol reference has no matching definition in the export; recorded as unknown, not guessed"
				if fromRepo != "" {
					reason = fromRepo + ": " + reason
				}
				result.Records = append(result.Records, coverage.Record{
					ID:            recID,
					Kind:          "symbol-reference",
					Status:        "unknown",
					EvidenceState: string(graph.Unknown),
					Source:        exportPath,
					Reason:        reason,
				})
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
			Summary:        fmt.Sprintf("%d symbol reference(s) could not be resolved or verified in the local export(s); recorded as unknown or cannot_verify.", len(result.Records)),
			Severity:       "info",
			EvidenceState:  string(graph.Unknown),
			EvidenceSource: strings.Join(exports, "; "),
			Confidence:     0,
			Status:         "unknown",
		})
	}

	return result
}

func isImporterCannotVerify(g graph.Graph) bool {
	for _, node := range g.Nodes {
		if node.ID == "symbol-index:source" && node.Evidence.State == graph.CannotVerify {
			return true
		}
	}
	return false
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
	sort.Strings(paths)
	return paths
}

type repoLookup struct {
	root    string
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
	return repoLookup{root: root, entries: entries}
}

func (rl repoLookup) repoForDocument(docPath string) string {
	docPath = filepath.ToSlash(filepath.Clean(docPath))
	// Normalize absolute paths against root.
	if filepath.IsAbs(docPath) {
		if rel, err := filepath.Rel(rl.root, docPath); err == nil {
			docPath = filepath.ToSlash(rel)
		}
	}
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

func hashHex(s string) string {
	h := fnv.New64a()
	_, _ = h.Write([]byte(s))
	return fmt.Sprintf("%016x", h.Sum64())
}
