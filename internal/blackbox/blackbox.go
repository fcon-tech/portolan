package blackbox

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"unicode"

	"github.com/fcon-tech/portolan/internal/graph"
	"github.com/fcon-tech/portolan/internal/selection"
)

type Result struct {
	Nodes []graph.Node
	Edges []graph.Edge
}

type metadataDocument struct {
	Service metadataService `json:"service"`
	Source  string          `json:"source"`
}

type metadataService struct {
	ID                   string   `json:"id"`
	Label                string   `json:"label"`
	Owner                string   `json:"owner"`
	DeclaredDependencies []string `json:"declared_dependencies"`
}

type runtimeDocument struct {
	SchemaVersion string               `json:"schema_version"`
	Observations  []runtimeObservation `json:"observations"`
	Source        string               `json:"source"`
}

type runtimeObservation struct {
	Service    string `json:"service"`
	Endpoint   string `json:"endpoint"`
	ID         string `json:"id"`
	From       string `json:"from"`
	To         string `json:"to"`
	Kind       string `json:"kind"`
	Coverage   string `json:"coverage"`
	Source     string `json:"source"`
	ObservedAt string `json:"observed_at"`
}

type claimDocument struct {
	Claims []claim `json:"claims"`
}

type claim struct {
	Subject   string `json:"subject"`
	Predicate string `json:"predicate"`
	Object    string `json:"object"`
	Source    string `json:"source"`
}

func Normalize(target selection.BlackBox, existingNodeIDs map[string]struct{}) Result {
	nodesByID := map[string]graph.Node{
		target.ID: targetNode(target, graph.Unknown, "selection", "black-box target declared without observed source"),
	}
	seen := observedFields{}
	var edges []graph.Edge

	for _, source := range target.Metadata {
		nodes, newEdges, sourceSeen := metadataFacts(target, source)
		addNodes(nodesByID, existingNodeIDs, nodes)
		edges = append(edges, newEdges...)
		seen.merge(sourceSeen)
	}
	for _, source := range target.Runtime {
		nodes, newEdges, sourceSeen := runtimeFacts(target, source)
		addNodes(nodesByID, existingNodeIDs, nodes)
		edges = append(edges, newEdges...)
		seen.merge(sourceSeen)
	}
	for _, source := range target.Claims {
		nodes, newEdges, sourceSeen := claimFacts(source, existingNodeIDs)
		addNodes(nodesByID, existingNodeIDs, nodes)
		edges = append(edges, newEdges...)
		seen.merge(sourceSeen)
	}

	missingNodes, missingEdges := missingExpectedFacts(target, seen)
	addNodes(nodesByID, existingNodeIDs, missingNodes)
	edges = append(edges, missingEdges...)

	nodes := make([]graph.Node, 0, len(nodesByID))
	for _, node := range nodesByID {
		nodes = append(nodes, node)
	}
	return Result{Nodes: nodes, Edges: edges}
}

type observedFields struct {
	owner            bool
	dependencies     bool
	runtimeEndpoints bool
}

func (f *observedFields) merge(other observedFields) {
	f.owner = f.owner || other.owner
	f.dependencies = f.dependencies || other.dependencies
	f.runtimeEndpoints = f.runtimeEndpoints || other.runtimeEndpoints
}

func metadataFacts(target selection.BlackBox, source selection.InputSource) ([]graph.Node, []graph.Edge, observedFields) {
	var seen observedFields
	data, err := os.ReadFile(source.Path)
	if err != nil {
		return []graph.Node{inputNode(source.ID, "unknown", source.Path, stateForReadError(err), reasonForReadError(err))}, nil, seen
	}
	var doc metadataDocument
	if err := json.Unmarshal(data, &doc); err != nil {
		return []graph.Node{inputNode(source.ID, "unknown", source.Path, graph.CannotVerify, "malformed metadata JSON")}, nil, seen
	}
	if doc.Service.ID == "" {
		return []graph.Node{inputNode(source.ID, "unknown", source.Path, graph.CannotVerify, "metadata service id is required")}, nil, seen
	}

	evidenceSource := evidenceSource(doc.Source, source.Path)
	label := doc.Service.Label
	if label == "" {
		label = doc.Service.ID
	}
	nodes := []graph.Node{
		{
			ID:    doc.Service.ID,
			Kind:  target.Kind,
			Label: label,
			Evidence: graph.Evidence{
				State:  graph.MetadataVisible,
				Source: evidenceSource,
			},
		},
		inputNode(source.ID, "unknown", source.Path, graph.MetadataVisible, ""),
	}
	var edges []graph.Edge
	if doc.Service.Owner != "" {
		seen.owner = true
		nodes = append(nodes, graph.Node{
			ID:    doc.Service.Owner,
			Kind:  "team",
			Label: doc.Service.Owner,
			Evidence: graph.Evidence{
				State:  graph.MetadataVisible,
				Source: evidenceSource,
			},
		})
		edges = append(edges, graph.Edge{
			From: doc.Service.Owner,
			To:   doc.Service.ID,
			Kind: "owns",
			Evidence: graph.Evidence{
				State:  graph.MetadataVisible,
				Source: evidenceSource,
			},
		})
	}
	for _, dependency := range doc.Service.DeclaredDependencies {
		if dependency == "" {
			continue
		}
		seen.dependencies = true
		nodes = append(nodes, graph.Node{
			ID:    dependency,
			Kind:  "service",
			Label: dependency,
			Evidence: graph.Evidence{
				State:  graph.MetadataVisible,
				Source: evidenceSource,
			},
		})
		edges = append(edges, graph.Edge{
			From: doc.Service.ID,
			To:   dependency,
			Kind: "depends-on",
			Evidence: graph.Evidence{
				State:  graph.MetadataVisible,
				Source: evidenceSource,
			},
		})
	}
	return nodes, edges, seen
}

func runtimeFacts(target selection.BlackBox, source selection.InputSource) ([]graph.Node, []graph.Edge, observedFields) {
	var seen observedFields
	data, err := os.ReadFile(source.Path)
	if err != nil {
		return []graph.Node{inputNode(source.ID, "runtime", source.Path, stateForReadError(err), reasonForReadError(err))}, nil, seen
	}
	var doc runtimeDocument
	if err := json.Unmarshal(data, &doc); err != nil {
		return []graph.Node{inputNode(source.ID, "runtime", source.Path, graph.CannotVerify, "malformed runtime JSON")}, nil, seen
	}
	if doc.SchemaVersion != "" && doc.SchemaVersion != selection.SchemaVersion {
		return []graph.Node{inputNode(source.ID, "runtime", source.Path, graph.CannotVerify, fmt.Sprintf("runtime schema_version must be %q", selection.SchemaVersion))}, nil, seen
	}

	evidenceSource := evidenceSource(doc.Source, source.Path)
	nodes := []graph.Node{inputNode(source.ID, "runtime", source.Path, graph.RuntimeVisible, "")}
	var edges []graph.Edge
	partialCoverageRecorded := false
	for _, observation := range doc.Observations {
		if isContractRuntimeObservation(observation) {
			newNodes, newEdges, observed, partialCoverage := contractRuntimeFacts(target, source.ID, evidenceSource, observation)
			nodes = append(nodes, newNodes...)
			edges = append(edges, newEdges...)
			seen.runtimeEndpoints = seen.runtimeEndpoints || observed
			if partialCoverage && !partialCoverageRecorded {
				coverageNodes, coverageEdges := partialRuntimeCoverageFacts(target, source.ID, evidenceSource, observation.Coverage)
				nodes = append(nodes, coverageNodes...)
				edges = append(edges, coverageEdges...)
				partialCoverageRecorded = true
			}
			continue
		}
		if observation.Service == "" || observation.Endpoint == "" {
			continue
		}
		if observation.Service != target.ID {
			nodes = append(nodes, graph.Node{
				ID:    source.ID + ":orphan:" + observation.Service,
				Kind:  "unknown",
				Label: observation.Service,
				Evidence: graph.Evidence{
					State:  graph.CannotVerify,
					Source: evidenceSource,
					Reason: fmt.Sprintf("runtime observation references undeclared service %q", observation.Service),
				},
			})
			continue
		}
		seen.runtimeEndpoints = true
		endpointID := target.ID + ":endpoint:" + observation.Endpoint
		nodes = append(nodes, graph.Node{
			ID:    endpointID,
			Kind:  "runtime",
			Label: observation.Endpoint,
			Evidence: graph.Evidence{
				State:  graph.RuntimeVisible,
				Source: evidenceSource,
			},
		})
		edges = append(edges, graph.Edge{
			From: target.ID,
			To:   endpointID,
			Kind: "observes",
			Evidence: graph.Evidence{
				State:  graph.RuntimeVisible,
				Source: evidenceSource,
			},
		})
	}
	return nodes, edges, seen
}

func isContractRuntimeObservation(observation runtimeObservation) bool {
	return observation.ID != "" || observation.From != "" || observation.To != "" || observation.Kind != "" || observation.Coverage != "" || observation.Source != ""
}

func contractRuntimeFacts(target selection.BlackBox, sourceID, defaultSource string, observation runtimeObservation) ([]graph.Node, []graph.Edge, bool, bool) {
	evidenceSource := evidenceSource(observation.Source, defaultSource)
	coverage, coverageOK := normalizeRuntimeCoverage(observation.Coverage)
	if !coverageOK {
		return []graph.Node{{
			ID:    sourceID + ":invalid-coverage:" + runtimeSubjectID(observation.ID),
			Kind:  "unknown",
			Label: runtimeObservationLabel(observation),
			Evidence: graph.Evidence{
				State:  graph.CannotVerify,
				Source: evidenceSource,
				Reason: fmt.Sprintf("runtime observation has unsupported coverage %q", observation.Coverage),
			},
		}}, nil, false, false
	}
	if observation.From == "" || observation.To == "" {
		return []graph.Node{{
			ID:    sourceID + ":invalid-observation:" + runtimeSubjectID(observation.ID),
			Kind:  "unknown",
			Label: runtimeObservationLabel(observation),
			Evidence: graph.Evidence{
				State:  graph.CannotVerify,
				Source: evidenceSource,
				Reason: "runtime observation requires from and to",
			},
		}}, nil, false, false
	}
	if observation.From != target.ID {
		return []graph.Node{{
			ID:    sourceID + ":orphan:" + runtimeSubjectID(observation.From),
			Kind:  "unknown",
			Label: observation.From,
			Evidence: graph.Evidence{
				State:  graph.CannotVerify,
				Source: evidenceSource,
				Reason: fmt.Sprintf("runtime observation references undeclared source %q", observation.From),
			},
		}}, nil, false, coverage != "complete"
	}

	targetID := runtimeSubjectID(observation.To)
	reason := runtimeObservationReason(observation, coverage)
	return []graph.Node{{
			ID:    targetID,
			Kind:  "runtime",
			Label: observation.To,
			Evidence: graph.Evidence{
				State:  graph.RuntimeVisible,
				Source: evidenceSource,
				Reason: reason,
			},
		}}, []graph.Edge{{
			From: target.ID,
			To:   targetID,
			Kind: "observes",
			Evidence: graph.Evidence{
				State:  graph.RuntimeVisible,
				Source: evidenceSource,
				Reason: reason,
			},
		}}, true, coverage != "complete"
}

func partialRuntimeCoverageFacts(target selection.BlackBox, sourceID, source, coverage string) ([]graph.Node, []graph.Edge) {
	if coverage == "" {
		coverage = "unknown"
	}
	id := target.ID + ":unknown:runtime-topology"
	reason := fmt.Sprintf("%s runtime observation coverage does not prove complete topology", coverage)
	return []graph.Node{{
			ID:    id,
			Kind:  "unknown",
			Label: "runtime topology",
			Evidence: graph.Evidence{
				State:  graph.Unknown,
				Source: source,
				Reason: reason,
			},
		}}, []graph.Edge{{
			From: target.ID,
			To:   id,
			Kind: "unknown",
			Evidence: graph.Evidence{
				State:  graph.Unknown,
				Source: source,
				Reason: reason,
			},
		}}
}

func runtimeObservationLabel(observation runtimeObservation) string {
	if observation.ID != "" {
		return observation.ID
	}
	if observation.From != "" || observation.To != "" {
		return strings.TrimSpace(observation.From + " -> " + observation.To)
	}
	return "runtime observation"
}

func normalizeRuntimeCoverage(value string) (string, bool) {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "":
		return "unknown", true
	case "complete", "partial", "unknown", "not_assessed":
		return strings.ToLower(strings.TrimSpace(value)), true
	default:
		return "", false
	}
}

func runtimeObservationReason(observation runtimeObservation, coverage string) string {
	parts := []string{}
	if observation.ID != "" {
		parts = append(parts, "id "+observation.ID)
	}
	if observation.Kind != "" {
		parts = append(parts, "kind "+observation.Kind)
	}
	if coverage != "" {
		parts = append(parts, "coverage "+coverage)
	}
	if observation.ObservedAt != "" {
		parts = append(parts, "observed_at "+observation.ObservedAt)
	}
	if len(parts) == 0 {
		return "runtime observation"
	}
	return "runtime observation " + strings.Join(parts, "; ")
}

func runtimeSubjectID(value string) string {
	value = strings.TrimSpace(value)
	var b strings.Builder
	lastSeparator := false
	for _, r := range value {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '-' || r == '_' || r == '.' || r == ':' {
			b.WriteRune(r)
			lastSeparator = false
			continue
		}
		if !lastSeparator {
			b.WriteByte('-')
			lastSeparator = true
		}
	}
	id := strings.Trim(b.String(), "-")
	if id == "" {
		return "runtime-subject"
	}
	runes := []rune(id)
	if len(runes) > 128 {
		id = strings.TrimRight(string(runes[:128]), "-")
	}
	if id == "" {
		return "runtime-subject"
	}
	return id
}

func claimFacts(source selection.ClaimSource, existingNodeIDs map[string]struct{}) ([]graph.Node, []graph.Edge, observedFields) {
	var seen observedFields
	data, err := os.ReadFile(source.Path)
	if err != nil {
		return []graph.Node{inputNode(source.ID, "claim", source.Path, stateForReadError(err), reasonForReadError(err))}, nil, seen
	}
	var doc claimDocument
	if err := json.Unmarshal(data, &doc); err != nil {
		return []graph.Node{inputNode(source.ID, "claim", source.Path, graph.CannotVerify, "malformed claim JSON")}, nil, seen
	}

	nodesByID := map[string]graph.Node{
		source.ID: inputNode(source.ID, "claim", source.Path, graph.ClaimOnly, ""),
	}
	var edges []graph.Edge
	for _, claim := range doc.Claims {
		if claim.Subject == "" || claim.Object == "" {
			continue
		}
		sourceLabel := evidenceSource(claim.Source, source.Path)
		addClaimNode(nodesByID, existingNodeIDs, claim.Subject, sourceLabel)
		addClaimNode(nodesByID, existingNodeIDs, claim.Object, sourceLabel)
		if claim.Predicate == "depends-on" {
			seen.dependencies = true
		}
		edges = append(edges, graph.Edge{
			From: claim.Subject,
			To:   claim.Object,
			Kind: normalizeEdgeKind(claim.Predicate),
			Evidence: graph.Evidence{
				State:  graph.ClaimOnly,
				Source: sourceLabel,
			},
		})
	}

	nodes := make([]graph.Node, 0, len(nodesByID))
	for _, node := range nodesByID {
		nodes = append(nodes, node)
	}
	return nodes, edges, seen
}

func missingExpectedFacts(target selection.BlackBox, seen observedFields) ([]graph.Node, []graph.Edge) {
	var nodes []graph.Node
	var edges []graph.Edge
	for _, expected := range target.Expected {
		missing := false
		switch expected {
		case "owner":
			missing = !seen.owner
		case "dependencies":
			missing = !seen.dependencies
		case "runtime-endpoints":
			missing = !seen.runtimeEndpoints
		}
		if !missing {
			continue
		}
		unknownID := target.ID + ":unknown:" + expected
		reason := fmt.Sprintf("expected black-box %s evidence is missing", expected)
		nodes = append(nodes, graph.Node{
			ID:    unknownID,
			Kind:  "unknown",
			Label: expected,
			Evidence: graph.Evidence{
				State:  graph.Unknown,
				Source: "selection",
				Reason: reason,
			},
		})
		edges = append(edges, graph.Edge{
			From: target.ID,
			To:   unknownID,
			Kind: "unknown",
			Evidence: graph.Evidence{
				State:  graph.Unknown,
				Source: "selection",
				Reason: reason,
			},
		})
	}
	return nodes, edges
}

func addNodes(nodesByID map[string]graph.Node, existingNodeIDs map[string]struct{}, nodes []graph.Node) {
	for _, node := range nodes {
		if _, exists := existingNodeIDs[node.ID]; exists {
			continue
		}
		if existing, exists := nodesByID[node.ID]; exists {
			if existing.Evidence.State != graph.Unknown || node.Evidence.State == graph.Unknown {
				continue
			}
		}
		nodesByID[node.ID] = node
	}
}

func addClaimNode(nodesByID map[string]graph.Node, existingNodeIDs map[string]struct{}, id, source string) {
	if _, exists := existingNodeIDs[id]; exists {
		return
	}
	if _, exists := nodesByID[id]; exists {
		return
	}
	nodesByID[id] = graph.Node{
		ID:    id,
		Kind:  "unknown",
		Label: id,
		Evidence: graph.Evidence{
			State:  graph.ClaimOnly,
			Source: source,
		},
	}
}

func targetNode(target selection.BlackBox, state graph.EvidenceState, source, reason string) graph.Node {
	label := target.Label
	if label == "" {
		label = target.ID
	}
	return graph.Node{
		ID:    target.ID,
		Kind:  target.Kind,
		Label: label,
		Evidence: graph.Evidence{
			State:  state,
			Source: source,
			Reason: reason,
		},
	}
}

func inputNode(id, kind, source string, state graph.EvidenceState, reason string) graph.Node {
	return graph.Node{
		ID:    id,
		Kind:  kind,
		Label: id,
		Evidence: graph.Evidence{
			State:  state,
			Source: source,
			Reason: reason,
		},
	}
}

func stateForReadError(err error) graph.EvidenceState {
	if os.IsNotExist(err) {
		return graph.CannotVerify
	}
	return graph.CannotVerify
}

func reasonForReadError(err error) string {
	if os.IsNotExist(err) {
		return "path does not exist"
	}
	return err.Error()
}

func evidenceSource(source, fallback string) string {
	if source != "" {
		return source
	}
	return fallback
}

func normalizeEdgeKind(kind string) string {
	switch kind {
	case "owns", "depends-on", "exposes", "imports", "observes", "claims":
		return kind
	default:
		return "unknown"
	}
}
