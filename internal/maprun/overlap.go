package maprun

import (
	"fmt"
	"sort"
	"strings"

	"github.com/fcon-tech/portolan/internal/graph"
)

// overlapFindingMinSharedDeps is the minimum number of shared external
// dependency targets between two repository-units to warrant an
// overlapping-capabilities finding. Below this the overlap is considered
// incidental.
const overlapFindingMinSharedDeps = 3

// detectOverlapFindings analyses the graph for semantic overlap signals.
//
// It produces spec-21 finding kinds:
//   - overlapping-capabilities: two repository-units share >= threshold
//     external dependency targets (deterministic, ironclad evidence).
//   - legacy-stale-semantic-overlap: an external/stale node is referenced
//     by active repository-units, suggesting a retired dependency still in use.
//   - duplicated-concept / alternative-capability: emitted as not_assessed
//     placeholders; these require deeper semantic analysis (naming, symbol
//     overlap) that is not yet wired. The not_assessed finding names the next
//     producer needed.
//
// Findings are unit-attached and carry confidence per the trust contract.
func detectOverlapFindings(g graph.Graph) []Finding {
	var findings []Finding

	repoDeps, repoLabels := collectRepoDependencies(g)
	findings = append(findings, detectOverlappingCapabilities(repoDeps, repoLabels)...)
	findings = append(findings, detectLegacyStaleOverlap(g, repoLabels)...)

	// duplicated-concept and alternative-capability require semantic signal
	// (symbol-level naming/reference overlap) that the current Go collector
	// does not yet produce. Emit honest not_assessed placeholders naming the
	// next producer needed, so the reader knows these were considered, not
	// forgotten.
	if len(repoDeps) >= 2 {
		findings = append(findings, notAssessedFinding(
			"finding-overlap-duplicated-concept-not-assessed",
			"duplicated-concept",
			"Duplicated-concept detection requires symbol-level naming overlap analysis; no supported semantic producer was observed for this map run.",
		))
		findings = append(findings, notAssessedFinding(
			"finding-overlap-alternative-capability-not-assessed",
			"alternative-capability",
			"Alternative-capability detection requires capability-clustering analysis; no supported semantic producer was observed for this map run.",
		))
	}

	return findings
}

// repoDependencyMap maps a repository-node id to the set of external
// dependency target-ids it depends on.
type repoDependencyMap map[string]map[string]bool

func collectRepoDependencies(g graph.Graph) (repoDependencyMap, map[string]string) {
	repoDeps := make(repoDependencyMap)
	repoLabels := make(map[string]string)

	// Index repository nodes.
	for _, node := range g.Nodes {
		if node.Kind == "repository" || node.Kind == "library" || node.Kind == "application" {
			if _, ok := repoDeps[node.ID]; !ok {
				repoDeps[node.ID] = make(map[string]bool)
			}
			if node.Label != "" {
				repoLabels[node.ID] = node.Label
			}
		}
	}

	// Collect depends-on targets for each repository node.
	for _, edge := range g.Edges {
		if edge.Kind != "depends-on" && edge.Kind != "imports" {
			continue
		}
		if deps, ok := repoDeps[edge.From]; ok {
			deps[edge.To] = true
		}
	}

	return repoDeps, repoLabels
}

func detectOverlappingCapabilities(repoDeps repoDependencyMap, repoLabels map[string]string) []Finding {
	var findings []Finding

	// Sort repo ids for deterministic output.
	repoIDs := make([]string, 0, len(repoDeps))
	for id := range repoDeps {
		repoIDs = append(repoIDs, id)
	}
	sort.Strings(repoIDs)

	for i := 0; i < len(repoIDs); i++ {
		for j := i + 1; j < len(repoIDs); j++ {
			a, b := repoIDs[i], repoIDs[j]
			shared := intersection(repoDeps[a], repoDeps[b])
			if len(shared) < overlapFindingMinSharedDeps {
				continue
			}
			labelA := repoLabels[a]
			if labelA == "" {
				labelA = a
			}
			labelB := repoLabels[b]
			if labelB == "" {
				labelB = b
			}
			findingID := overlapFindingID(a, b)
			findings = append(findings, Finding{
				ID:             findingID,
				Kind:           "overlapping-capabilities",
				Summary:        fmt.Sprintf("%s and %s share %d external dependency target(s): %s", labelA, labelB, len(shared), truncateShared(shared, 5)),
				Severity:       "minor",
				EvidenceState:  "metadata-visible",
				EvidenceSource: "portolan map (overlap detection)",
				Confidence:     0.7,
				Status:         "observed",
			})
		}
	}

	return findings
}

func detectLegacyStaleOverlap(g graph.Graph, repoLabels map[string]string) []Finding {
	var findings []Finding

	// Build a set of all node ids that are "inside" the perimeter (source-visible
	// or have evidence beyond unknown).
	perimeterIDs := make(map[string]bool)
	for _, node := range g.Nodes {
		if node.Evidence.State != graph.Unknown && node.Evidence.State != graph.CannotVerify {
			perimeterIDs[node.ID] = true
		}
	}

	// Find edges from perimeter nodes to non-perimeter (external/stale) targets.
	staleReferenced := make(map[string][]string) // targetId -> []sourceId
	for _, edge := range g.Edges {
		if edge.Kind != "depends-on" && edge.Kind != "references" && edge.Kind != "imports" {
			continue
		}
		if perimeterIDs[edge.From] && !perimeterIDs[edge.To] {
			// The target is outside the perimeter. If multiple active units
			// reference it, it is a candidate for legacy-stale overlap.
			staleReferenced[edge.To] = append(staleReferenced[edge.To], edge.From)
		}
	}

	// Sort stale target ids for deterministic output.
	staleIDs := make([]string, 0, len(staleReferenced))
	for id := range staleReferenced {
		staleIDs = append(staleIDs, id)
	}
	sort.Strings(staleIDs)

	for _, targetID := range staleIDs {
		sources := staleReferenced[targetID]
		if len(sources) < 2 {
			continue // Only interesting when 2+ active units reference a stale target
		}
		sort.Strings(sources)
		sourceLabels := make([]string, 0, len(sources))
		for _, s := range sources {
			label := repoLabels[s]
			if label == "" {
				label = s
			}
			sourceLabels = append(sourceLabels, label)
		}
		findings = append(findings, Finding{
			ID:             "finding-legacy-stale-overlap-" + sanitizeID(targetID),
			Kind:           "legacy-stale-semantic-overlap",
			Summary:        fmt.Sprintf("External target %s is referenced by %d active unit(s): %s", targetID, len(sources), strings.Join(sourceLabels, ", ")),
			Severity:       "minor",
			EvidenceState:  "metadata-visible",
			EvidenceSource: "portolan map (overlap detection)",
			Confidence:     0.6,
			Status:         "observed",
		})
	}

	return findings
}

func intersection(a, b map[string]bool) []string {
	var result []string
	for k := range a {
		if b[k] {
			result = append(result, k)
		}
	}
	sort.Strings(result)
	return result
}

func truncateShared(items []string, max int) string {
	if len(items) <= max {
		return strings.Join(items, ", ")
	}
	return strings.Join(items[:max], ", ") + fmt.Sprintf(" (+%d more)", len(items)-max)
}

func overlapFindingID(a, b string) string {
	parts := []string{a, b}
	sort.Strings(parts)
	return "finding-overlapping-capabilities-" + sanitizeID(parts[0]) + "-" + sanitizeID(parts[1])
}

func sanitizeID(s string) string {
	s = strings.ReplaceAll(s, "/", "-")
	s = strings.ReplaceAll(s, ":", "-")
	s = strings.ReplaceAll(s, "@", "-")
	return s
}
