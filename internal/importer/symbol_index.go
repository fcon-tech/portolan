package importer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/fcon-tech/portolan/internal/graph"
)

type symbolIndexExport struct {
	Producer  string                `json:"producer"`
	Documents []symbolIndexDocument `json:"documents"`
}

type symbolIndexDocument struct {
	Path     string              `json:"path"`
	URI      string              `json:"uri"`
	Language string              `json:"language"`
	Symbols  []symbolIndexSymbol `json:"symbols"`
}

type symbolIndexSymbol struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Kind  string `json:"kind"`
	Role  string `json:"role"`
	Range string `json:"range"`
}

func RunSymbolIndex(opts Options) (graph.Graph, error) {
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
		g.Nodes = append(g.Nodes, symbolIndexSourceNode(opts.InputPath, graph.CannotVerify, fmt.Sprintf("read symbol-index JSON: %v", err)))
		return g, nil
	}

	var raw symbolIndexExport
	decoder := json.NewDecoder(bytes.NewReader(data))
	if err := decoder.Decode(&raw); err != nil {
		g := graph.New()
		g.Nodes = append(g.Nodes, symbolIndexSourceNode(opts.InputPath, graph.CannotVerify, "malformed symbol-index JSON: "+err.Error()))
		return g, nil
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		g := graph.New()
		g.Nodes = append(g.Nodes, symbolIndexSourceNode(opts.InputPath, graph.CannotVerify, "malformed symbol-index JSON: trailing JSON content"))
		return g, nil
	}
	if len(raw.Documents) == 0 {
		g := graph.New()
		g.Nodes = append(g.Nodes, symbolIndexSourceNode(opts.InputPath, graph.CannotVerify, "symbol-index JSON contains no documents"))
		return g, nil
	}

	producer := strings.TrimSpace(raw.Producer)
	if producer == "" {
		producer = "symbol-index"
	}
	g := graph.New()
	g.Nodes = append(g.Nodes, symbolIndexSourceNode(opts.InputPath, graph.MetadataVisible, "local symbol-index export imported from "+producer))

	seenDocuments := map[string]struct{}{}
	seenSymbols := map[string]struct{}{}
	for _, document := range raw.Documents {
		docIDValue := symbolIndexDocumentPath(document)
		if docIDValue == "" {
			continue
		}
		docID := "symbol-index:document:" + docIDValue
		if _, ok := seenDocuments[docID]; !ok {
			seenDocuments[docID] = struct{}{}
			g.Nodes = append(g.Nodes, graph.Node{
				ID:    docID,
				Kind:  "unknown",
				Label: docIDValue,
				Evidence: graph.Evidence{
					State:  graph.MetadataVisible,
					Source: opts.InputPath,
					Reason: symbolIndexReason(document.Language, "document listed by local symbol-index export"),
				},
			})
			g.Edges = append(g.Edges, graph.Edge{
				From: "symbol-index:source",
				To:   docID,
				Kind: "owns",
				Evidence: graph.Evidence{
					State:  graph.MetadataVisible,
					Source: opts.InputPath,
					Reason: "document listed by local symbol-index export",
				},
			})
		}

		for _, symbol := range document.Symbols {
			symbolIDValue := strings.TrimSpace(symbol.ID)
			if symbolIDValue == "" {
				symbolIDValue = strings.TrimSpace(symbol.Name)
			}
			if symbolIDValue == "" {
				continue
			}
			symbolID := "symbol-index:symbol:" + symbolIDValue
			if _, ok := seenSymbols[symbolID]; !ok {
				seenSymbols[symbolID] = struct{}{}
				g.Nodes = append(g.Nodes, graph.Node{
					ID:    symbolID,
					Kind:  "unknown",
					Label: symbolIndexSymbolLabel(symbol),
					Evidence: graph.Evidence{
						State:  graph.MetadataVisible,
						Source: symbolIndexSource(opts.InputPath, docIDValue, symbol.Range),
						Reason: symbolIndexReason(symbol.Kind, "symbol identity/range listed by local export; semantic correctness and call relationships not assessed"),
					},
				})
			}
			g.Edges = append(g.Edges, graph.Edge{
				From: docID,
				To:   symbolID,
				Kind: "owns",
				Evidence: graph.Evidence{
					State:  graph.MetadataVisible,
					Source: symbolIndexSource(opts.InputPath, docIDValue, symbol.Range),
					Reason: symbolIndexReason(symbol.Role, "symbol occurrence listed by local export; not a complete call graph"),
				},
			})
		}
	}

	sortGraph(&g)
	return g, nil
}

func symbolIndexSourceNode(path string, state graph.EvidenceState, reason string) graph.Node {
	return graph.Node{
		ID:    "symbol-index:source",
		Kind:  "unknown",
		Label: "symbol-index export",
		Evidence: graph.Evidence{
			State:  state,
			Source: path,
			Reason: reason,
		},
	}
}

func symbolIndexDocumentPath(document symbolIndexDocument) string {
	if path := strings.TrimSpace(document.Path); path != "" {
		return path
	}
	return strings.TrimSpace(document.URI)
}

func symbolIndexSymbolLabel(symbol symbolIndexSymbol) string {
	if name := strings.TrimSpace(symbol.Name); name != "" {
		return name
	}
	return strings.TrimSpace(symbol.ID)
}

func symbolIndexSource(inputPath string, documentPath string, symbolRange string) string {
	parts := []string{inputPath}
	if documentPath = strings.TrimSpace(documentPath); documentPath != "" {
		parts = append(parts, documentPath)
	}
	if symbolRange = strings.TrimSpace(symbolRange); symbolRange != "" {
		parts = append(parts, symbolRange)
	}
	return strings.Join(parts, ":")
}

func symbolIndexReason(value string, reason string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return reason
	}
	return reason + " (" + value + ")"
}
