package graphslice

import (
	"fmt"
	"strings"
	"testing"

	"github.com/fcon-tech/portolan/internal/graph"
)

func TestSampleEdgesSpreadsTruncatedSamples(t *testing.T) {
	edges := make([]graph.Edge, 0, 100)
	for i := 0; i < 100; i++ {
		edges = append(edges, graph.Edge{
			From: fmt.Sprintf("repo-%03d", i),
			To:   fmt.Sprintf("dep-%03d", i),
			Kind: "depends-on",
			Evidence: graph.Evidence{
				State:  graph.MetadataVisible,
				Source: "fixture",
			},
		})
	}

	samples := sampleEdges(edges, 5)

	if got := len(samples); got != 5 {
		t.Fatalf("samples = %d, want 5", got)
	}
	want := []string{"repo-000", "repo-025", "repo-050", "repo-074", "repo-099"}
	for i, from := range want {
		if samples[i].From != from {
			t.Fatalf("samples[%d].from = %q, want %q; samples = %#v", i, samples[i].From, from, samples)
		}
	}
}

func TestSliceRulesExplainFindingOnlyAndTruncatedEdges(t *testing.T) {
	rules := sliceRules("finding-kind", "relationships", Truncated{Edges: 10, Findings: 5})
	joined := fmt.Sprint(rules)

	for _, want := range []string{"Finding-kind slices contain matching findings", "do not extrapolate", "Truncated samples are incomplete"} {
		if !strings.Contains(joined, want) {
			t.Fatalf("rules = %#v, want %q", rules, want)
		}
	}
}
