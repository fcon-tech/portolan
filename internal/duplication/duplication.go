package duplication

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"unicode/utf8"

	"github.com/fcon-tech/portolan/internal/graph"
)

const MaxCandidateBytes int64 = 1 << 20

type Result struct {
	Clusters []Cluster
	Issues   []Issue
}

type Cluster struct {
	Kind          string
	Files         []string
	EvidenceState graph.EvidenceState
}

type Issue struct {
	Path          string
	Reason        string
	Status        string
	EvidenceState graph.EvidenceState
}

type candidate struct {
	Path string
	Kind string
}

func Detect(root string) Result {
	candidates, issues := candidateFiles(root)
	groups := map[string]Cluster{}
	for _, candidate := range candidates {
		data, err := os.ReadFile(candidate.Path)
		if err != nil {
			issues = append(issues, Issue{
				Path:          candidate.Path,
				Reason:        "cannot read candidate file: " + err.Error(),
				Status:        "cannot_verify",
				EvidenceState: graph.CannotVerify,
			})
			continue
		}
		if !utf8.Valid(data) || looksBinary(data) {
			continue
		}
		normalized := normalizeText(data)
		if len(normalized) < 32 {
			continue
		}
		sum := sha256.Sum256([]byte(normalized))
		key := candidate.Kind + ":" + hex.EncodeToString(sum[:])
		cluster := groups[key]
		if cluster.Kind == "" {
			cluster = Cluster{
				Kind:          candidate.Kind,
				EvidenceState: graph.SourceVisible,
			}
		}
		rel, err := filepath.Rel(root, candidate.Path)
		if err != nil {
			rel = candidate.Path
		}
		cluster.Files = append(cluster.Files, filepath.ToSlash(rel))
		groups[key] = cluster
	}

	var clusters []Cluster
	for _, cluster := range groups {
		if len(cluster.Files) < 2 {
			continue
		}
		sort.Strings(cluster.Files)
		clusters = append(clusters, cluster)
	}
	sort.Slice(clusters, func(i, j int) bool {
		if clusters[i].Kind != clusters[j].Kind {
			return clusters[i].Kind < clusters[j].Kind
		}
		return strings.Join(clusters[i].Files, "\x00") < strings.Join(clusters[j].Files, "\x00")
	})
	sort.Slice(issues, func(i, j int) bool {
		if issues[i].Path != issues[j].Path {
			return issues[i].Path < issues[j].Path
		}
		return issues[i].Reason < issues[j].Reason
	})
	return Result{Clusters: clusters, Issues: issues}
}

func candidateFiles(root string) ([]candidate, []Issue) {
	var candidates []candidate
	var issues []Issue
	_ = filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			issues = append(issues, Issue{
				Path:          path,
				Reason:        "cannot inspect candidate path: " + err.Error(),
				Status:        "cannot_verify",
				EvidenceState: graph.CannotVerify,
			})
			return nil
		}
		if path == root {
			return nil
		}
		rel, relErr := filepath.Rel(root, path)
		if relErr != nil {
			return nil
		}
		rel = filepath.ToSlash(rel)
		if entry.IsDir() {
			if skipDir(rel) {
				return filepath.SkipDir
			}
			return nil
		}
		if skipFile(rel) {
			return nil
		}
		kind, ok := candidateKind(rel)
		if !ok {
			return nil
		}
		info, statErr := entry.Info()
		if statErr != nil {
			issues = append(issues, Issue{
				Path:          path,
				Reason:        "cannot inspect candidate file: " + statErr.Error(),
				Status:        "cannot_verify",
				EvidenceState: graph.CannotVerify,
			})
			return nil
		}
		if info.Size() > MaxCandidateBytes {
			issues = append(issues, Issue{
				Path:          path,
				Reason:        fmt.Sprintf("candidate file exceeds %d byte native duplication limit", MaxCandidateBytes),
				Status:        "not_assessed",
				EvidenceState: graph.Unknown,
			})
			return nil
		}
		candidates = append(candidates, candidate{Path: path, Kind: kind})
		return nil
	})
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].Path < candidates[j].Path
	})
	return candidates, issues
}

func skipDir(rel string) bool {
	for _, part := range strings.Split(rel, "/") {
		switch part {
		case ".git", ".hg", ".svn", ".portolan", "node_modules", "vendor", "dist", "build", "target", "out", "coverage", ".next":
			return true
		}
	}
	return false
}

func skipFile(rel string) bool {
	base := strings.ToLower(filepath.Base(rel))
	if strings.HasSuffix(base, ".min.js") || strings.Contains(base, "generated") {
		return true
	}
	switch base {
	case "go.sum", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "cargo.lock", "composer.lock", "gemfile.lock":
		return true
	default:
		return false
	}
}

func candidateKind(rel string) (string, bool) {
	base := strings.ToLower(filepath.Base(rel))
	ext := strings.ToLower(filepath.Ext(base))
	switch base {
	case "dockerfile", "compose.yaml", "compose.yml", "docker-compose.yaml", "docker-compose.yml", ".env", ".env.example":
		return "exact-config", true
	}
	switch ext {
	case ".json", ".yaml", ".yml", ".toml", ".properties", ".ini", ".env":
		return "exact-config", true
	case ".go", ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".kt", ".scala", ".rb", ".php", ".cs", ".rs", ".c", ".cc", ".cpp", ".h", ".hpp", ".swift", ".sh":
		return "exact-source", true
	default:
		return "", false
	}
}

func normalizeText(data []byte) string {
	text := strings.ReplaceAll(string(data), "\r\n", "\n")
	text = strings.ReplaceAll(text, "\r", "\n")
	lines := strings.Split(text, "\n")
	for i := range lines {
		lines[i] = strings.TrimRight(lines[i], " \t")
	}
	return strings.TrimSpace(strings.Join(lines, "\n"))
}

func looksBinary(data []byte) bool {
	limit := len(data)
	if limit > 4096 {
		limit = 4096
	}
	for i := 0; i < limit; i++ {
		if data[i] == 0 {
			return true
		}
	}
	return false
}
