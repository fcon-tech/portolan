package maprun

import (
	"testing"

	"github.com/fcon-tech/portolan/internal/graph"
)

func TestDetectOverlapFindings_OverlappingCapabilities(t *testing.T) {
	g := graph.New()
	// Two repository-units that share 3 external dependencies.
	g.Nodes = []graph.Node{
		{ID: "repo-a", Kind: "repository", Label: "Repo A", Evidence: graph.Evidence{State: graph.SourceVisible}},
		{ID: "repo-b", Kind: "repository", Label: "Repo B", Evidence: graph.Evidence{State: graph.SourceVisible}},
		{ID: "ext-1", Kind: "external", Label: "Ext1", Evidence: graph.Evidence{State: graph.Unknown}},
		{ID: "ext-2", Kind: "external", Label: "Ext2", Evidence: graph.Evidence{State: graph.Unknown}},
		{ID: "ext-3", Kind: "external", Label: "Ext3", Evidence: graph.Evidence{State: graph.Unknown}},
	}
	g.Edges = []graph.Edge{
		{From: "repo-a", To: "ext-1", Kind: "depends-on"},
		{From: "repo-a", To: "ext-2", Kind: "depends-on"},
		{From: "repo-a", To: "ext-3", Kind: "depends-on"},
		{From: "repo-b", To: "ext-1", Kind: "depends-on"},
		{From: "repo-b", To: "ext-2", Kind: "depends-on"},
		{From: "repo-b", To: "ext-3", Kind: "depends-on"},
	}

	findings := detectOverlapFindings(g)

	var overlapFinding *Finding
	var dupConceptFinding *Finding
	var altCapFinding *Finding
	for i := range findings {
		switch findings[i].Kind {
		case "overlapping-capabilities":
			overlapFinding = &findings[i]
		case "duplicated-concept":
			dupConceptFinding = &findings[i]
		case "alternative-capability":
			altCapFinding = &findings[i]
		}
	}

	if overlapFinding == nil {
		t.Fatal("expected an overlapping-capabilities finding")
	}
	if overlapFinding.Severity != "minor" {
		t.Errorf("expected severity minor, got %s", overlapFinding.Severity)
	}
	if overlapFinding.EvidenceState != "metadata-visible" {
		t.Errorf("expected evidence_state metadata-visible, got %s", overlapFinding.EvidenceState)
	}
	if overlapFinding.Confidence <= 0 {
		t.Error("expected confidence > 0 for overlapping-capabilities")
	}

	if dupConceptFinding == nil {
		t.Error("expected a duplicated-concept not_assessed placeholder")
	} else if dupConceptFinding.EvidenceState != "not_assessed" {
		t.Errorf("expected duplicated-concept to be not_assessed, got %s", dupConceptFinding.EvidenceState)
	}

	if altCapFinding == nil {
		t.Error("expected an alternative-capability not_assessed placeholder")
	} else if altCapFinding.EvidenceState != "not_assessed" {
		t.Errorf("expected alternative-capability to be not_assessed, got %s", altCapFinding.EvidenceState)
	}
}

func TestDetectOverlapFindings_NoOverlapBelowThreshold(t *testing.T) {
	g := graph.New()
	g.Nodes = []graph.Node{
		{ID: "repo-a", Kind: "repository", Evidence: graph.Evidence{State: graph.SourceVisible}},
		{ID: "repo-b", Kind: "repository", Evidence: graph.Evidence{State: graph.SourceVisible}},
		{ID: "ext-1", Kind: "external", Evidence: graph.Evidence{State: graph.Unknown}},
		{ID: "ext-2", Kind: "external", Evidence: graph.Evidence{State: graph.Unknown}},
	}
	g.Edges = []graph.Edge{
		{From: "repo-a", To: "ext-1", Kind: "depends-on"},
		{From: "repo-a", To: "ext-2", Kind: "depends-on"},
		{From: "repo-b", To: "ext-1", Kind: "depends-on"},
		{From: "repo-b", To: "ext-2", Kind: "depends-on"},
	}

	findings := detectOverlapFindings(g)

	for _, f := range findings {
		if f.Kind == "overlapping-capabilities" {
			t.Fatal("should not emit overlapping-capabilities when shared deps < threshold (3)")
		}
	}
}

func TestDetectOverlapFindings_LegacyStaleOverlap(t *testing.T) {
	g := graph.New()
	g.Nodes = []graph.Node{
		{ID: "repo-a", Kind: "repository", Label: "Repo A", Evidence: graph.Evidence{State: graph.SourceVisible}},
		{ID: "repo-b", Kind: "repository", Label: "Repo B", Evidence: graph.Evidence{State: graph.SourceVisible}},
		{ID: "stale-dep", Kind: "external", Label: "Deprecated Stale Dep", Evidence: graph.Evidence{State: graph.Unknown}},
	}
	g.Edges = []graph.Edge{
		{From: "repo-a", To: "stale-dep", Kind: "depends-on"},
		{From: "repo-b", To: "stale-dep", Kind: "references"},
	}

	findings := detectOverlapFindings(g)

	var staleFinding *Finding
	for i := range findings {
		if findings[i].Kind == "legacy-stale-semantic-overlap" {
			staleFinding = &findings[i]
		}
	}

	if staleFinding == nil {
		t.Fatal("expected a legacy-stale-semantic-overlap finding for a deprecated target")
	}
	if staleFinding.Confidence <= 0 {
		t.Error("expected confidence > 0 for legacy-stale overlap")
	}
	if len(staleFinding.SubjectIDs) < 2 {
		t.Errorf("expected >= 2 subject_ids, got %d", len(staleFinding.SubjectIDs))
	}
}

func TestDetectOverlapFindings_NoLegacyStaleForNormalExternalDeps(t *testing.T) {
	g := graph.New()
	g.Nodes = []graph.Node{
		{ID: "repo-a", Kind: "repository", Label: "Repo A", Evidence: graph.Evidence{State: graph.SourceVisible}},
		{ID: "repo-b", Kind: "repository", Label: "Repo B", Evidence: graph.Evidence{State: graph.SourceVisible}},
		{ID: "ext-dep", Kind: "external", Label: "Normal Lib", Evidence: graph.Evidence{State: graph.Unknown}},
	}
	g.Edges = []graph.Edge{
		{From: "repo-a", To: "ext-dep", Kind: "depends-on"},
		{From: "repo-b", To: "ext-dep", Kind: "references"},
	}

	findings := detectOverlapFindings(g)

	for _, f := range findings {
		if f.Kind == "legacy-stale-semantic-overlap" {
			t.Fatal("should NOT emit legacy-stale for a normal external dep without retirement signal")
		}
	}
}

func TestDetectOverlapFindings_EmptyGraph(t *testing.T) {
	g := graph.New()
	findings := detectOverlapFindings(g)
	if len(findings) != 0 {
		t.Errorf("expected 0 findings for empty graph, got %d", len(findings))
	}
}

func TestDetectOverlapFindings_SingleRepo(t *testing.T) {
	g := graph.New()
	g.Nodes = []graph.Node{
		{ID: "repo-a", Kind: "repository", Evidence: graph.Evidence{State: graph.SourceVisible}},
		{ID: "ext-1", Kind: "external", Evidence: graph.Evidence{State: graph.Unknown}},
	}
	g.Edges = []graph.Edge{
		{From: "repo-a", To: "ext-1", Kind: "depends-on"},
	}

	findings := detectOverlapFindings(g)
	// No overlap with only one repo; no not_assessed placeholders (need >= 2 repos).
	if len(findings) != 0 {
		t.Errorf("expected 0 findings for single-repo graph, got %d", len(findings))
	}
}
