package configuration

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"unicode/utf8"

	"github.com/fcon-tech/portolan/internal/graph"
)

const MaxCandidateBytes int64 = 1 << 20

type Result struct {
	Surfaces []Surface
	Issues   []Issue
}

type Surface struct {
	Kind          string
	Name          string
	Sources       []string
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
	Role string
}

var (
	envRefPattern       = regexp.MustCompile(`\$\{?([A-Z][A-Z0-9_]{2,})\}?|process\.env\.([A-Z][A-Z0-9_]{2,})|os\.Getenv\("([A-Z][A-Z0-9_]{2,})"\)`)
	envAssignment       = regexp.MustCompile(`^\s*([A-Z][A-Z0-9_]{2,})\s*=`)
	portPattern         = regexp.MustCompile(`(?i)\b(?:port|listen|expose|containerPort|targetPort)\b[^0-9]{0,20}([0-9]{2,5})\b`)
	featureFlagPattern  = regexp.MustCompile(`\b(FEATURE_[A-Z0-9_]+|[A-Za-z0-9_-]*(?:feature|Feature|FEATURE|flag|Flag|FLAG)[_-][A-Za-z0-9_-]+)\b`)
	secretKeyPattern    = regexp.MustCompile(`^\s*["']?([A-Za-z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE_KEY|DATABASE_URL|API_KEY)[A-Za-z0-9_]*)["']?\s*[:=]`)
	secretNameComponent = regexp.MustCompile(`(?i)(SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE_KEY|DATABASE_URL|API_KEY)`)
)

func Detect(root string) Result {
	candidates, issues := candidateFiles(root)
	surfaces := map[string]Surface{}
	for _, candidate := range candidates {
		rel, err := filepath.Rel(root, candidate.Path)
		if err != nil {
			rel = candidate.Path
		}
		rel = filepath.ToSlash(rel)
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
		if candidate.Role != "" {
			addSurface(surfaces, candidate.Role, rel, rel)
		}
		scanner := bufio.NewScanner(strings.NewReader(string(data)))
		for scanner.Scan() {
			line := scanner.Text()
			detectLineSurfaces(surfaces, line, rel)
		}
		if err := scanner.Err(); err != nil {
			issues = append(issues, Issue{
				Path:          candidate.Path,
				Reason:        "cannot scan candidate file: " + err.Error(),
				Status:        "cannot_verify",
				EvidenceState: graph.CannotVerify,
			})
		}
	}
	return Result{
		Surfaces: sortedSurfaces(surfaces),
		Issues:   sortedIssues(issues),
	}
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
		role, ok := candidateRole(rel)
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
				Reason:        fmt.Sprintf("candidate file exceeds %d byte native configuration limit", MaxCandidateBytes),
				Status:        "not_assessed",
				EvidenceState: graph.Unknown,
			})
			return nil
		}
		candidates = append(candidates, candidate{Path: path, Role: role})
		return nil
	})
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].Path < candidates[j].Path
	})
	return candidates, issues
}

func candidateRole(rel string) (string, bool) {
	lower := strings.ToLower(filepath.ToSlash(rel))
	base := filepath.Base(lower)
	ext := filepath.Ext(base)
	switch {
	case strings.HasPrefix(lower, ".github/workflows/") || strings.Contains(lower, "/.github/workflows/") || strings.HasPrefix(lower, ".gitlab-ci") || strings.Contains(lower, "/.gitlab-ci") || base == "jenkinsfile":
		return "workflow", true
	case base == "dockerfile" || base == "containerfile" || strings.HasPrefix(base, "dockerfile.") || strings.Contains(base, "compose."):
		return "container", true
	case base == "go.mod" || base == "package.json" || base == "pom.xml" || base == "build.gradle" || base == "build.gradle.kts" || base == "requirements.txt" || base == "pyproject.toml" || base == "cargo.toml" || base == "gemfile" || base == "mix.exs":
		return "manifest", true
	case ext == ".env" || ext == ".yaml" || ext == ".yml" || ext == ".json" || ext == ".toml" || ext == ".ini" || ext == ".conf" || ext == ".cfg" || ext == ".properties":
		return "config-file", true
	case ext == ".go" || ext == ".js" || ext == ".jsx" || ext == ".ts" || ext == ".tsx" || ext == ".py" || ext == ".java" || ext == ".kt" || ext == ".rb" || ext == ".rs" || ext == ".sh":
		return "", true
	default:
		return "", false
	}
}

func detectLineSurfaces(surfaces map[string]Surface, line, source string) {
	for _, match := range envAssignment.FindAllStringSubmatch(line, -1) {
		if len(match) > 1 {
			addSurface(surfaces, "env-var", match[1], source)
			if isSecretName(match[1]) {
				addSurface(surfaces, "secret-reference", match[1], source)
			}
		}
	}
	for _, match := range envRefPattern.FindAllStringSubmatch(line, -1) {
		for _, group := range match[1:] {
			if group != "" {
				addSurface(surfaces, "env-var", group, source)
				if isSecretName(group) {
					addSurface(surfaces, "secret-reference", group, source)
				}
			}
		}
	}
	for _, match := range portPattern.FindAllStringSubmatch(line, -1) {
		if len(match) > 1 && validPort(match[1]) {
			addSurface(surfaces, "port", match[1], source)
		}
	}
	for _, match := range featureFlagPattern.FindAllStringSubmatch(line, -1) {
		if len(match) > 1 {
			addSurface(surfaces, "feature-flag", match[1], source)
		}
	}
	if match := secretKeyPattern.FindStringSubmatch(line); len(match) > 1 {
		addSurface(surfaces, "secret-reference", match[1], source)
	}
}

func addSurface(surfaces map[string]Surface, kind, name, source string) {
	if kind == "" || name == "" {
		return
	}
	name = normalizeName(kind, name)
	key := kind + ":" + name
	surface := surfaces[key]
	if surface.Kind == "" {
		surface = Surface{
			Kind:          kind,
			Name:          name,
			EvidenceState: graph.SourceVisible,
		}
	}
	for _, existing := range surface.Sources {
		if existing == source {
			surfaces[key] = surface
			return
		}
	}
	surface.Sources = append(surface.Sources, source)
	sort.Strings(surface.Sources)
	surfaces[key] = surface
}

func isSecretName(name string) bool {
	return secretNameComponent.MatchString(name)
}

func sortedSurfaces(surfaces map[string]Surface) []Surface {
	out := make([]Surface, 0, len(surfaces))
	for _, surface := range surfaces {
		out = append(out, surface)
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Kind != out[j].Kind {
			return out[i].Kind < out[j].Kind
		}
		return out[i].Name < out[j].Name
	})
	return out
}

func sortedIssues(issues []Issue) []Issue {
	sort.Slice(issues, func(i, j int) bool {
		if issues[i].Path != issues[j].Path {
			return issues[i].Path < issues[j].Path
		}
		return issues[i].Reason < issues[j].Reason
	})
	return issues
}

func normalizeName(kind, name string) string {
	name = strings.TrimSpace(name)
	switch kind {
	case "port":
		return name
	default:
		return strings.ToUpper(strings.ReplaceAll(name, "-", "_"))
	}
}

func validPort(value string) bool {
	if value == "" {
		return false
	}
	var port int
	for _, r := range value {
		if r < '0' || r > '9' {
			return false
		}
		port = port*10 + int(r-'0')
	}
	return port > 0 && port <= 65535
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
