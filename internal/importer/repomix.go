package importer

import (
	"bytes"
	"fmt"
	"html"
	"os"
	"regexp"
	"strings"

	"github.com/fall-out-bug/portolan/internal/graph"
)

var repomixFilePathPattern = regexp.MustCompile(`(?m)^<file\s+path="([^"]+)">\s*$`)

func RunRepomix(opts Options) (graph.Graph, error) {
	if opts.InputPath == "" {
		return graph.Graph{}, fmt.Errorf("--in is required")
	}
	if opts.OutputPath == "" {
		return graph.Graph{}, fmt.Errorf("--out is required")
	}
	if err := validateOutputPath(opts.OutputPath, opts.Force); err != nil {
		return graph.Graph{}, err
	}

	data, err := os.ReadFile(opts.InputPath)
	if err != nil {
		g := graph.New()
		g.Nodes = append(g.Nodes, repomixSourceNode(opts.InputPath, graph.CannotVerify, fmt.Sprintf("read Repomix pack: %v", err)))
		return g, nil
	}

	g := graph.New()
	sourceState := graph.MetadataVisible
	sourceReason := "Repomix pack metadata imported; packed source snippets are not architecture evidence"
	if bytes.Contains(data, []byte("Security check has been disabled")) {
		sourceState = graph.CannotVerify
		sourceReason = "Repomix pack says security check has been disabled; treat packed content as sensitive"
	}
	g.Nodes = append(g.Nodes, repomixSourceNode(opts.InputPath, sourceState, sourceReason))

	matches := repomixFilePathPattern.FindAllSubmatch(data, -1)
	if len(matches) == 0 {
		g.Nodes[0].Evidence.State = graph.CannotVerify
		g.Nodes[0].Evidence.Reason = appendReason(g.Nodes[0].Evidence.Reason, "no <file path> entries found")
		return g, nil
	}

	seen := map[string]struct{}{}
	for _, match := range matches {
		path := strings.TrimSpace(html.UnescapeString(string(match[1])))
		if path == "" {
			continue
		}
		id := repomixFileNodeID(path)
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		g.Nodes = append(g.Nodes, graph.Node{
			ID:    id,
			Kind:  "unknown",
			Label: path,
			Evidence: graph.Evidence{
				State:  graph.MetadataVisible,
				Source: opts.InputPath,
				Reason: "file path listed by local Repomix pack; contents are context only",
			},
		})
		g.Edges = append(g.Edges, graph.Edge{
			From: "repomix:source",
			To:   id,
			Kind: "owns",
			Evidence: graph.Evidence{
				State:  graph.MetadataVisible,
				Source: opts.InputPath,
				Reason: "file path listed by local Repomix pack",
			},
		})
	}

	sortGraph(&g)
	return g, nil
}

func repomixSourceNode(path string, state graph.EvidenceState, reason string) graph.Node {
	return graph.Node{
		ID:    "repomix:source",
		Kind:  "unknown",
		Label: "Repomix pack",
		Evidence: graph.Evidence{
			State:  state,
			Source: path,
			Reason: reason,
		},
	}
}

func repomixFileNodeID(path string) string {
	return "repomix:file:" + path
}
