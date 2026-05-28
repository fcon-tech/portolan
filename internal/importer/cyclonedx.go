package importer

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/fall-out-bug/portolan/internal/graph"
	"github.com/fall-out-bug/portolan/internal/scan"
)

type Options struct {
	InputPath  string
	OutputPath string
	RootPath   string
	Force      bool
}

type cyclonedxBOM struct {
	BOMFormat   string                `json:"bomFormat"`
	SpecVersion string                `json:"specVersion"`
	Serial      string                `json:"serialNumber"`
	Version     int                   `json:"version"`
	Metadata    cyclonedxMetadata     `json:"metadata"`
	Components  []cyclonedxComponent  `json:"components"`
	Deps        []cyclonedxDependency `json:"dependencies"`
}

type cyclonedxMetadata struct {
	Component cyclonedxComponent `json:"component"`
}

type cyclonedxComponent struct {
	BOMRef  string `json:"bom-ref"`
	Type    string `json:"type"`
	Name    string `json:"name"`
	Version string `json:"version"`
}

type cyclonedxDependency struct {
	Ref       string   `json:"ref"`
	DependsOn []string `json:"dependsOn"`
}

func RunCycloneDX(opts Options) (graph.Graph, error) {
	if opts.InputPath == "" {
		return graph.Graph{}, errors.New("--in is required")
	}
	if opts.OutputPath == "" {
		return graph.Graph{}, errors.New("--out is required")
	}
	if err := validateOutputPath(opts.OutputPath, opts.Force); err != nil {
		return graph.Graph{}, err
	}

	data, err := os.ReadFile(opts.InputPath)
	if err != nil {
		g := graph.New()
		g.Nodes = append(g.Nodes, sourceNode(opts.InputPath, graph.CannotVerify, fmt.Sprintf("read CycloneDX JSON: %v", err)))
		return g, nil
	}

	var bom cyclonedxBOM
	decoder := json.NewDecoder(bytes.NewReader(data))
	if err := decoder.Decode(&bom); err != nil {
		g := graph.New()
		g.Nodes = append(g.Nodes, sourceNode(opts.InputPath, graph.CannotVerify, "malformed CycloneDX JSON: "+err.Error()))
		return g, nil
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		g := graph.New()
		g.Nodes = append(g.Nodes, sourceNode(opts.InputPath, graph.CannotVerify, "malformed CycloneDX JSON: trailing JSON content"))
		return g, nil
	}
	if bom.BOMFormat != "CycloneDX" {
		g := graph.New()
		g.Nodes = append(g.Nodes, sourceNode(opts.InputPath, graph.CannotVerify, "bomFormat is not CycloneDX"))
		return g, nil
	}

	g := graph.New()
	g.Nodes = append(g.Nodes, sourceNode(opts.InputPath, graph.MetadataVisible, ""))
	knownRefs := map[string]struct{}{}
	for _, component := range bom.Components {
		if component.BOMRef == "" {
			continue
		}
		id := componentID(component.BOMRef)
		knownRefs[component.BOMRef] = struct{}{}
		g.Nodes = append(g.Nodes, graph.Node{
			ID:    id,
			Kind:  "package",
			Label: componentLabel(component),
			Evidence: graph.Evidence{
				State:  graph.MetadataVisible,
				Source: opts.InputPath,
			},
		})
	}

	for _, dep := range bom.Deps {
		if dep.Ref == "" {
			continue
		}
		sourceMissing := false
		if _, ok := knownRefs[dep.Ref]; !ok {
			g.Nodes = append(g.Nodes, missingRefNode(dep.Ref, opts.InputPath))
			knownRefs[dep.Ref] = struct{}{}
			sourceMissing = true
		}
		for _, targetRef := range dep.DependsOn {
			if targetRef == "" {
				continue
			}
			state := graph.MetadataVisible
			reason := ""
			if sourceMissing {
				state = graph.CannotVerify
				reason = "dependency ref was not present in CycloneDX components"
			}
			if _, ok := knownRefs[targetRef]; !ok {
				g.Nodes = append(g.Nodes, missingRefNode(targetRef, opts.InputPath))
				knownRefs[targetRef] = struct{}{}
				state = graph.CannotVerify
				reason = "dependency ref was not present in CycloneDX components"
			}
			g.Edges = append(g.Edges, graph.Edge{
				From: componentID(dep.Ref),
				To:   componentID(targetRef),
				Kind: "depends-on",
				Evidence: graph.Evidence{
					State:  state,
					Source: opts.InputPath,
					Reason: reason,
				},
			})
		}
	}

	sortGraph(&g)
	return g, nil
}

func Write(path string, g graph.Graph, force bool) error {
	return scan.Write(path, g, force)
}

func sourceNode(path string, state graph.EvidenceState, reason string) graph.Node {
	return graph.Node{
		ID:    "cyclonedx:source",
		Kind:  "unknown",
		Label: filepath.Base(path),
		Evidence: graph.Evidence{
			State:  state,
			Source: path,
			Reason: reason,
		},
	}
}

func missingRefNode(ref string, source string) graph.Node {
	return graph.Node{
		ID:    componentID(ref),
		Kind:  "package",
		Label: ref,
		Evidence: graph.Evidence{
			State:  graph.CannotVerify,
			Source: source,
			Reason: "dependency ref was not present in CycloneDX components",
		},
	}
}

func componentID(ref string) string {
	return "cyclonedx:" + ref
}

func componentLabel(component cyclonedxComponent) string {
	label := component.Name
	if label == "" {
		label = component.BOMRef
	}
	if component.Version != "" {
		label += "@" + component.Version
	}
	return label
}

func validateOutputPath(path string, force bool) error {
	if path == "" {
		return errors.New("--out is required")
	}
	parent := filepath.Dir(path)
	info, err := os.Stat(parent)
	if err != nil {
		return fmt.Errorf("output parent must exist: %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("output parent is not a directory")
	}
	if info, err := os.Lstat(path); err == nil {
		if info.Mode()&os.ModeSymlink != 0 {
			return fmt.Errorf("output path must not be a symlink")
		}
		if info.IsDir() {
			return fmt.Errorf("output path must not be a directory")
		}
		if !force {
			return fmt.Errorf("output path already exists; use --force to overwrite")
		}
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("inspect output path: %w", err)
	}
	return nil
}

func sortGraph(g *graph.Graph) {
	sort.Slice(g.Nodes, func(i, j int) bool {
		return strings.Compare(g.Nodes[i].ID, g.Nodes[j].ID) < 0
	})
	sort.Slice(g.Edges, func(i, j int) bool {
		left := g.Edges[i].From + "\x00" + g.Edges[i].Kind + "\x00" + g.Edges[i].To
		right := g.Edges[j].From + "\x00" + g.Edges[j].Kind + "\x00" + g.Edges[j].To
		return left < right
	})
}
