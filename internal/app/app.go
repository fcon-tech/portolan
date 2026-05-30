package app

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/fcon-tech/portolan/internal/adapter"
	"github.com/fcon-tech/portolan/internal/contextprep"
	"github.com/fcon-tech/portolan/internal/corpus"
	graphdiff "github.com/fcon-tech/portolan/internal/diff"
	"github.com/fcon-tech/portolan/internal/graphslice"
	"github.com/fcon-tech/portolan/internal/importer"
	"github.com/fcon-tech/portolan/internal/maprun"
	"github.com/fcon-tech/portolan/internal/packet"
	"github.com/fcon-tech/portolan/internal/query"
	"github.com/fcon-tech/portolan/internal/scan"
	"github.com/fcon-tech/portolan/internal/selection"
)

var Version = "dev"

func Run(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 {
		writeUsage(stdout)
		return 0
	}

	switch args[0] {
	case "-h", "--help", "help":
		writeUsage(stdout)
		return 0
	case "-v", "--version", "version":
		fmt.Fprintf(stdout, "portolan %s\n", Version)
		return 0
	case "scan":
		return runScan(args[1:], stdout, stderr)
	case "selection":
		return runSelection(args[1:], stdout, stderr)
	case "packet":
		return runPacket(args[1:], stdout, stderr)
	case "import":
		return runImport(args[1:], stdout, stderr)
	case "produce":
		return runProduce(args[1:], stdout, stderr)
	case "diff":
		return runDiff(args[1:], stdout, stderr)
	case "map":
		return runMap(args[1:], stdout, stderr)
	case "graph":
		return runGraph(args[1:], stdout, stderr)
	case "query":
		return runQuery(args[1:], stdout, stderr)
	case "context":
		return runContext(args[1:], stdout, stderr)
	case "adapter":
		return runAdapter(args[1:], stdout, stderr)
	default:
		fmt.Fprintf(stderr, "unknown command %q\n\n", args[0])
		writeUsage(stderr)
		return 2
	}
}

func runProduce(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 || args[0] == "-h" || args[0] == "--help" || args[0] == "help" {
		writeProduceUsage(stdout)
		return 0
	}
	switch args[0] {
	case "semgrep":
		return runProduceSemgrep(args[1:], stdout, stderr)
	case "repomix":
		return runProduceRepomix(args[1:], stdout, stderr)
	case "graphify":
		return runProduceGraphify(args[1:], stdout, stderr)
	default:
		fmt.Fprintf(stderr, "unknown produce command %q\nRun 'portolan produce --help' for available subcommands.\n", args[0])
		return 2
	}
}

func runProduceGraphify(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeProduceGraphifyUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("produce graphify", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	rootPath := flags.String("root", "", "local target root")
	outputDir := flags.String("out", "", "output directory for graphify-out")
	graphifyBin := flags.String("graphify", "graphify", "installed Graphify executable")
	force := flags.Bool("force", false, "overwrite an existing output directory")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeProduceGraphifyUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected produce graphify argument %q\n", flags.Arg(0))
		return 2
	}
	if *rootPath == "" || *outputDir == "" {
		fmt.Fprintln(stderr, "produce graphify: --root and --out are required")
		return 2
	}
	if err := validateProducerOutputDir(*outputDir, *force); err != nil {
		fmt.Fprintf(stderr, "produce graphify: %v\n", err)
		return 2
	}
	rootInfo, err := os.Stat(*rootPath)
	if err != nil {
		fmt.Fprintf(stderr, "produce graphify: inspect root: %v\n", err)
		return 2
	}
	if !rootInfo.IsDir() {
		fmt.Fprintln(stderr, "produce graphify: root must be a directory")
		return 2
	}
	if err := os.MkdirAll(*outputDir, 0o755); err != nil {
		fmt.Fprintf(stderr, "produce graphify: create output directory: %v\n", err)
		return 2
	}

	stagedRoot := filepath.Join(*outputDir, "source-copy")
	if err := copyProducerTree(*rootPath, stagedRoot); err != nil {
		fmt.Fprintf(stderr, "produce graphify: stage source copy: %v\n", err)
		return 2
	}

	cmd := exec.Command(*graphifyBin, "update", stagedRoot, "--force", "--no-cluster")
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	if err := cmd.Run(); err != nil {
		fmt.Fprintf(stderr, "produce graphify: %v\n", err)
		return 1
	}
	graphPath := filepath.Join(stagedRoot, "graphify-out", "graph.json")
	info, err := os.Stat(graphPath)
	if err != nil {
		fmt.Fprintf(stderr, "produce graphify: inspect output: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote %s (%d bytes)\n", graphPath, info.Size())
	return 0
}

func runProduceRepomix(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeProduceRepomixUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("produce repomix", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	rootPath := flags.String("root", "", "local target root")
	outputPath := flags.String("out", "", "output Repomix file")
	style := flags.String("style", "xml", "repomix output style")
	noSecurityCheck := flags.Bool("no-security-check", false, "pass --no-security-check to Repomix")
	force := flags.Bool("force", false, "overwrite an existing output file")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeProduceRepomixUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected produce repomix argument %q\n", flags.Arg(0))
		return 2
	}
	if *rootPath == "" || *outputPath == "" {
		fmt.Fprintln(stderr, "produce repomix: --root and --out are required")
		return 2
	}
	if *style != "xml" && *style != "markdown" && *style != "plain" {
		fmt.Fprintln(stderr, "produce repomix: --style must be xml, markdown, or plain")
		return 2
	}
	if err := validateProducerOutputPath(*outputPath, *force); err != nil {
		fmt.Fprintf(stderr, "produce repomix: %v\n", err)
		return 2
	}
	if _, err := os.Stat(*rootPath); err != nil {
		fmt.Fprintf(stderr, "produce repomix: inspect root: %v\n", err)
		return 2
	}

	cmdArgs := []string{*rootPath, "--output", *outputPath, "--style", *style}
	if *noSecurityCheck {
		cmdArgs = append(cmdArgs, "--no-security-check")
	}
	cmd := exec.Command("repomix", cmdArgs...)
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	if err := cmd.Run(); err != nil {
		fmt.Fprintf(stderr, "produce repomix: %v\n", err)
		return 1
	}
	info, err := os.Stat(*outputPath)
	if err != nil {
		fmt.Fprintf(stderr, "produce repomix: inspect output: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote %s (%d bytes)\n", *outputPath, info.Size())
	return 0
}

func runProduceSemgrep(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeProduceSemgrepUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("produce semgrep", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	rootPath := flags.String("root", "", "local target root")
	configPath := flags.String("config", "", "local Semgrep config")
	outputPath := flags.String("out", "", "output Semgrep JSON path")
	force := flags.Bool("force", false, "overwrite an existing output file")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeProduceSemgrepUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected produce semgrep argument %q\n", flags.Arg(0))
		return 2
	}
	if *rootPath == "" || *configPath == "" || *outputPath == "" {
		fmt.Fprintln(stderr, "produce semgrep: --root, --config, and --out are required")
		return 2
	}
	if err := validateProducerOutputPath(*outputPath, *force); err != nil {
		fmt.Fprintf(stderr, "produce semgrep: %v\n", err)
		return 2
	}
	if _, err := os.Stat(*rootPath); err != nil {
		fmt.Fprintf(stderr, "produce semgrep: inspect root: %v\n", err)
		return 2
	}
	if _, err := os.Stat(*configPath); err != nil {
		fmt.Fprintf(stderr, "produce semgrep: inspect config: %v\n", err)
		return 2
	}

	cmd := exec.Command("semgrep", "scan", "--config", *configPath, "--json", "--json-output", *outputPath, "--metrics=off", *rootPath)
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	if err := cmd.Run(); err != nil {
		fmt.Fprintf(stderr, "produce semgrep: %v\n", err)
		return 1
	}
	info, err := os.Stat(*outputPath)
	if err != nil {
		fmt.Fprintf(stderr, "produce semgrep: inspect output: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote %s (%d bytes)\n", *outputPath, info.Size())
	return 0
}

func validateProducerOutputPath(path string, force bool) error {
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

func validateProducerOutputDir(path string, force bool) error {
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
			return fmt.Errorf("output directory must not be a symlink")
		}
		if !info.IsDir() {
			return fmt.Errorf("output path already exists and is not a directory")
		}
		if !force {
			return fmt.Errorf("output directory already exists; use --force to overwrite")
		}
		if err := os.RemoveAll(path); err != nil {
			return fmt.Errorf("remove existing output directory: %w", err)
		}
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("inspect output directory: %w", err)
	}
	return nil
}

func copyProducerTree(srcRoot string, dstRoot string) error {
	srcRoot, err := filepath.Abs(srcRoot)
	if err != nil {
		return err
	}
	dstRoot, err = filepath.Abs(dstRoot)
	if err != nil {
		return err
	}
	return filepath.WalkDir(srcRoot, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		absPath, err := filepath.Abs(path)
		if err != nil {
			return err
		}
		if pathWithin(absPath, dstRoot) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		rel, err := filepath.Rel(srcRoot, path)
		if err != nil {
			return err
		}
		name := entry.Name()
		if entry.IsDir() && rel != "." && (name == ".git" || name == ".portolan" || name == "graphify-out") {
			return filepath.SkipDir
		}
		if strings.HasPrefix(rel, "..") {
			return fmt.Errorf("source path escaped root: %s", path)
		}
		dstPath := filepath.Join(dstRoot, rel)
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if info.Mode()&os.ModeSymlink != 0 {
			return nil
		}
		if entry.IsDir() {
			return os.MkdirAll(dstPath, info.Mode().Perm())
		}
		if !info.Mode().IsRegular() {
			return nil
		}
		if err := os.MkdirAll(filepath.Dir(dstPath), 0o755); err != nil {
			return err
		}
		return copyProducerFile(path, dstPath, info.Mode().Perm())
	})
}

func pathWithin(path string, root string) bool {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return false
	}
	return rel == "." || (rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator)))
}

func copyProducerFile(srcPath string, dstPath string, perm os.FileMode) error {
	src, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer src.Close()
	dst, err := os.OpenFile(dstPath, os.O_CREATE|os.O_EXCL|os.O_WRONLY, perm)
	if err != nil {
		return err
	}
	if _, err := io.Copy(dst, src); err != nil {
		_ = dst.Close()
		return err
	}
	return dst.Close()
}

func runQuery(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 || args[0] == "-h" || args[0] == "--help" || args[0] == "help" {
		writeQueryUsage(stdout)
		return 0
	}
	switch args[0] {
	case "findings":
		return runQueryFindings(args[1:], stdout, stderr)
	case "gaps":
		return runQueryGaps(args[1:], stdout, stderr)
	default:
		fmt.Fprintf(stderr, "unknown query command %q\nRun 'portolan query --help' for available subcommands.\n", args[0])
		return 2
	}
}

func runQueryFindings(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeQueryFindingsUsage(stdout)
		return 0
	}
	flags := flag.NewFlagSet("query findings", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	bundlePath := flags.String("bundle", "", "map bundle directory")
	kind := flags.String("kind", "", "finding kind")
	limit := flags.Int("limit", query.DefaultLimit, "maximum records returned")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeQueryFindingsUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected query findings argument %q\n", flags.Arg(0))
		return 2
	}
	if *limit < 1 || *limit > query.MaxLimit {
		fmt.Fprintf(stderr, "query findings: --limit must be between 1 and %d\n", query.MaxLimit)
		return 2
	}
	result, err := query.Run(query.Options{
		BundlePath: *bundlePath,
		Family:     query.FamilyFindings,
		Kind:       *kind,
		Limit:      *limit,
	})
	if err != nil {
		fmt.Fprintf(stderr, "query findings: %v\n", err)
		return 2
	}
	if err := writeQueryResult(stdout, result); err != nil {
		fmt.Fprintf(stderr, "query findings: %v\n", err)
		return 2
	}
	return 0
}

func runQueryGaps(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeQueryGapsUsage(stdout)
		return 0
	}
	flags := flag.NewFlagSet("query gaps", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	bundlePath := flags.String("bundle", "", "map bundle directory")
	limit := flags.Int("limit", query.DefaultLimit, "maximum records returned")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeQueryGapsUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected query gaps argument %q\n", flags.Arg(0))
		return 2
	}
	if *limit < 1 || *limit > query.MaxLimit {
		fmt.Fprintf(stderr, "query gaps: --limit must be between 1 and %d\n", query.MaxLimit)
		return 2
	}
	result, err := query.Run(query.Options{
		BundlePath: *bundlePath,
		Family:     query.FamilyGaps,
		Limit:      *limit,
	})
	if err != nil {
		fmt.Fprintf(stderr, "query gaps: %v\n", err)
		return 2
	}
	if err := writeQueryResult(stdout, result); err != nil {
		fmt.Fprintf(stderr, "query gaps: %v\n", err)
		return 2
	}
	return 0
}

func writeQueryResult(w io.Writer, result query.Result) error {
	encoder := json.NewEncoder(w)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(result); err != nil {
		return fmt.Errorf("encode result: %w", err)
	}
	return nil
}

func runAdapter(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 || args[0] == "-h" || args[0] == "--help" || args[0] == "help" {
		writeAdapterUsage(stdout)
		return 0
	}
	switch args[0] {
	case "validate":
		return runAdapterValidate(args[1:], stdout, stderr)
	default:
		fmt.Fprintf(stderr, "unknown adapter command %q\nRun 'portolan adapter --help' for available subcommands.\n", args[0])
		return 2
	}
}

func runAdapterValidate(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeAdapterValidateUsage(stdout)
		return 0
	}
	flags := flag.NewFlagSet("adapter validate", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	inputPath := flags.String("in", "", "adapter contract JSON path")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeAdapterValidateUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected adapter validate argument %q\n", flags.Arg(0))
		return 2
	}
	result, err := adapter.ValidateFile(*inputPath)
	if err != nil {
		fmt.Fprintf(stderr, "adapter validate: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "validated adapter %s (%s/%s)\n", result.Contract.ID, result.Contract.Family, result.Contract.OutputKind)
	return 0
}

func runGraph(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 || args[0] == "-h" || args[0] == "--help" || args[0] == "help" {
		writeGraphUsage(stdout)
		return 0
	}
	switch args[0] {
	case "slice":
		return runGraphSlice(args[1:], stdout, stderr)
	default:
		fmt.Fprintf(stderr, "unknown graph command %q\nRun 'portolan graph --help' for available subcommands.\n", args[0])
		return 2
	}
}

func runGraphSlice(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeGraphSliceUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("graph slice", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	bundlePath := flags.String("bundle", "", "map bundle directory")
	outputPath := flags.String("out", "", "output graph slice JSON path")
	outputPathShort := flags.String("o", "", "output graph slice JSON path")
	repoID := flags.String("repo", "", "repository node ID")
	edgeKind := flags.String("edge-kind", "", "edge kind")
	findingKind := flags.String("finding-kind", "", "finding kind")
	limit := flags.Int("limit", 100, "maximum samples per section")
	force := flags.Bool("force", false, "overwrite an existing output file")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeGraphSliceUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected graph slice argument %q\n", flags.Arg(0))
		return 2
	}
	if *outputPath != "" && *outputPathShort != "" && *outputPath != *outputPathShort {
		fmt.Fprintf(stderr, "graph slice: --out and -o must match when both are provided\n")
		return 2
	}
	if *outputPath == "" {
		*outputPath = *outputPathShort
	}

	result, err := graphslice.Run(graphslice.Options{
		BundlePath:  *bundlePath,
		OutputPath:  *outputPath,
		RepoID:      *repoID,
		EdgeKind:    *edgeKind,
		FindingKind: *findingKind,
		Limit:       *limit,
		Force:       *force,
	})
	if err != nil {
		fmt.Fprintf(stderr, "graph slice: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote graph slice %s\n", result.OutputPath)
	return 0
}

func runContext(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 || args[0] == "-h" || args[0] == "--help" || args[0] == "help" {
		writeContextUsage(stdout)
		return 0
	}
	switch args[0] {
	case "prepare":
		return runContextPrepare(args[1:], stdout, stderr)
	default:
		fmt.Fprintf(stderr, "unknown context command %q\nRun 'portolan context --help' for available subcommands.\n", args[0])
		return 2
	}
}

func runContextPrepare(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeContextPrepareUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("context prepare", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	rootPath := flags.String("root", "", "local landscape root path")
	outputPath := flags.String("out", "", "output context pack directory")
	profile := flags.String("profile", "cursor", "agent profile")
	force := flags.Bool("force", false, "replace an existing output directory")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeContextPrepareUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected context prepare argument %q\n", flags.Arg(0))
		return 2
	}

	result, err := contextprep.Run(contextprep.Options{
		RootPath:   *rootPath,
		OutputPath: *outputPath,
		Profile:    *profile,
		Force:      *force,
		Version:    Version,
	})
	if err != nil {
		fmt.Fprintf(stderr, "context prepare: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote context pack %s\n", result.OutputPath)
	return 0
}

func runMap(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeMapUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("map", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	rootPath := flags.String("root", "", "local root path")
	selectionPath := flags.String("selection", "", "local landscape selection JSON path")
	outputPath := flags.String("out", "", "output artifact bundle directory")
	force := flags.Bool("force", false, "replace an existing output directory")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeMapUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected map argument %q\n", flags.Arg(0))
		return 2
	}

	result, err := maprun.Run(maprun.Options{
		RootPath:      *rootPath,
		SelectionPath: *selectionPath,
		OutputPath:    *outputPath,
		Force:         *force,
		Version:       Version,
	})
	if err != nil {
		fmt.Fprintf(stderr, "map: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote map bundle %s\n", result.OutputPath)
	return 0
}

func runDiff(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeDiffUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("diff", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	basePath := flags.String("base", "", "base evidence graph JSON path")
	headPath := flags.String("head", "", "head evidence graph JSON path")
	outputPath := flags.String("out", "", "output evidence diff JSON path")
	force := flags.Bool("force", false, "overwrite an existing output file")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeDiffUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected diff argument %q\n", flags.Arg(0))
		return 2
	}

	result, err := graphdiff.Run(graphdiff.Options{
		BasePath: *basePath,
		HeadPath: *headPath,
	})
	if err != nil {
		fmt.Fprintf(stderr, "diff: %v\n", err)
		return 2
	}
	if err := graphdiff.Write(*outputPath, result, *force); err != nil {
		fmt.Fprintf(stderr, "diff: %v\n", err)
		return 2
	}
	info, err := os.Stat(*outputPath)
	if err != nil {
		fmt.Fprintf(stderr, "diff: inspect output: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote %s (%d bytes)\n", *outputPath, info.Size())
	return 0
}

func runImport(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 || args[0] == "-h" || args[0] == "--help" || args[0] == "help" {
		writeImportUsage(stdout)
		return 0
	}
	switch args[0] {
	case "cyclonedx":
		return runImportCycloneDX(args[1:], stdout, stderr)
	case "graphify":
		return runImportGraphify(args[1:], stdout, stderr)
	case "repomix":
		return runImportRepomix(args[1:], stdout, stderr)
	case "symbol-index":
		return runImportSymbolIndex(args[1:], stdout, stderr)
	default:
		fmt.Fprintf(stderr, "unknown import command %q\nRun 'portolan import --help' for available subcommands.\n", args[0])
		return 2
	}
}

func runImportCycloneDX(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeImportCycloneDXUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("import cyclonedx", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	inputPath := flags.String("in", "", "local CycloneDX JSON file")
	outputPath := flags.String("out", "", "output evidence graph JSON path")
	force := flags.Bool("force", false, "overwrite an existing output file")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeImportCycloneDXUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected import cyclonedx argument %q\n", flags.Arg(0))
		return 2
	}

	g, err := importer.RunCycloneDX(importer.Options{
		InputPath:  *inputPath,
		OutputPath: *outputPath,
		Force:      *force,
	})
	if err != nil {
		fmt.Fprintf(stderr, "import cyclonedx: %v\n", err)
		return 2
	}
	if err := importer.Write(*outputPath, g, *force); err != nil {
		fmt.Fprintf(stderr, "import cyclonedx: %v\n", err)
		return 2
	}
	info, err := os.Stat(*outputPath)
	if err != nil {
		fmt.Fprintf(stderr, "import cyclonedx: inspect output: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote %s (%d bytes)\n", *outputPath, info.Size())
	return 0
}

func runImportGraphify(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeImportGraphifyUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("import graphify", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	inputPath := flags.String("in", "", "local Graphify graph.json file")
	outputPath := flags.String("out", "", "output evidence graph JSON path")
	rootPath := flags.String("root", "", "optional local source root for source-backed EXTRACTED facts")
	force := flags.Bool("force", false, "overwrite an existing output file")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeImportGraphifyUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected import graphify argument %q\n", flags.Arg(0))
		return 2
	}

	g, err := importer.RunGraphify(importer.Options{
		InputPath:  *inputPath,
		OutputPath: *outputPath,
		RootPath:   *rootPath,
		Force:      *force,
	})
	if err != nil {
		fmt.Fprintf(stderr, "import graphify: %v\n", err)
		return 2
	}
	if err := importer.Write(*outputPath, g, *force); err != nil {
		fmt.Fprintf(stderr, "import graphify: %v\n", err)
		return 2
	}
	info, err := os.Stat(*outputPath)
	if err != nil {
		fmt.Fprintf(stderr, "import graphify: inspect output: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote %s (%d bytes)\n", *outputPath, info.Size())
	return 0
}

func runImportRepomix(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeImportRepomixUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("import repomix", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	inputPath := flags.String("in", "", "local Repomix packed output file")
	outputPath := flags.String("out", "", "output evidence graph JSON path")
	force := flags.Bool("force", false, "overwrite an existing output file")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeImportRepomixUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected import repomix argument %q\n", flags.Arg(0))
		return 2
	}

	g, err := importer.RunRepomix(importer.Options{
		InputPath:  *inputPath,
		OutputPath: *outputPath,
		Force:      *force,
	})
	if err != nil {
		fmt.Fprintf(stderr, "import repomix: %v\n", err)
		return 2
	}
	if err := importer.Write(*outputPath, g, *force); err != nil {
		fmt.Fprintf(stderr, "import repomix: %v\n", err)
		return 2
	}
	info, err := os.Stat(*outputPath)
	if err != nil {
		fmt.Fprintf(stderr, "import repomix: inspect output: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote %s (%d bytes)\n", *outputPath, info.Size())
	return 0
}

func runImportSymbolIndex(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeImportSymbolIndexUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("import symbol-index", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	inputPath := flags.String("in", "", "local symbol-index JSON export")
	outputPath := flags.String("out", "", "output evidence graph JSON path")
	force := flags.Bool("force", false, "overwrite an existing output file")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeImportSymbolIndexUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected import symbol-index argument %q\n", flags.Arg(0))
		return 2
	}

	g, err := importer.RunSymbolIndex(importer.Options{
		InputPath:  *inputPath,
		OutputPath: *outputPath,
		Force:      *force,
	})
	if err != nil {
		fmt.Fprintf(stderr, "import symbol-index: %v\n", err)
		return 2
	}
	if err := importer.Write(*outputPath, g, *force); err != nil {
		fmt.Fprintf(stderr, "import symbol-index: %v\n", err)
		return 2
	}
	info, err := os.Stat(*outputPath)
	if err != nil {
		fmt.Fprintf(stderr, "import symbol-index: inspect output: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote %s (%d bytes)\n", *outputPath, info.Size())
	return 0
}

func runSelection(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 || args[0] == "-h" || args[0] == "--help" || args[0] == "help" {
		writeSelectionUsage(stdout)
		return 0
	}
	switch args[0] {
	case "validate":
		return runSelectionValidate(args[1:], stdout, stderr)
	case "generate-bigtop":
		return runSelectionGenerateBigtop(args[1:], stdout, stderr)
	default:
		fmt.Fprintf(stderr, "unknown selection command %q\n", args[0])
		return 2
	}
}

func runSelectionGenerateBigtop(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeSelectionGenerateBigtopUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("selection generate-bigtop", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	manifestPath := flags.String("manifest", "", "local Bigtop corpus manifest JSON path")
	repoDir := flags.String("repo-dir", "", "directory containing local repository checkouts by manifest id")
	outputPath := flags.String("out", "", "output selection JSON path")
	force := flags.Bool("force", false, "overwrite an existing selection file")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeSelectionGenerateBigtopUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected selection generate-bigtop argument %q\n", flags.Arg(0))
		return 2
	}

	sel, err := corpus.GenerateBigtopSelection(corpus.BigtopSelectionOptions{
		ManifestPath: *manifestPath,
		RepoDir:      *repoDir,
		OutputPath:   *outputPath,
		Force:        *force,
	})
	if err != nil {
		fmt.Fprintf(stderr, "selection generate-bigtop: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote Bigtop selection %s (%d repositories)\n", *outputPath, len(sel.Targets))
	return 0
}

func runSelectionValidate(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeSelectionValidateUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("selection validate", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	selectionPath := flags.String("selection", "", "local JSON selection file")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeSelectionValidateUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected selection validate argument %q\n", flags.Arg(0))
		return 2
	}
	if *selectionPath == "" {
		fmt.Fprintln(stderr, "selection: --selection is required")
		return 2
	}

	if _, err := selection.Load(*selectionPath); err != nil {
		fmt.Fprintf(stderr, "selection: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "selection valid: %s\n", *selectionPath)
	return 0
}

func runPacket(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 || args[0] == "-h" || args[0] == "--help" || args[0] == "help" {
		writePacketUsage(stdout)
		return 0
	}
	switch args[0] {
	case "render":
		return runPacketRender(args[1:], stdout, stderr)
	default:
		fmt.Fprintf(stderr, "unknown packet command %q\n", args[0])
		return 2
	}
}

func runPacketRender(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writePacketRenderUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("packet render", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	graphPath := flags.String("graph", "", "evidence graph JSON path")
	outputPath := flags.String("out", "", "output Markdown packet path")
	force := flags.Bool("force", false, "overwrite an existing output file")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writePacketRenderUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected packet render argument %q\n", flags.Arg(0))
		return 2
	}

	data, err := packet.Run(packet.Options{
		GraphPath:  *graphPath,
		OutputPath: *outputPath,
		Force:      *force,
	})
	if err != nil {
		fmt.Fprintf(stderr, "packet: %v\n", err)
		return 2
	}
	if err := packet.Write(*outputPath, data, *force); err != nil {
		fmt.Fprintf(stderr, "packet: %v\n", err)
		return 2
	}
	info, err := os.Stat(*outputPath)
	if err != nil {
		fmt.Fprintf(stderr, "packet: inspect output: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote %s (%d bytes)\n", *outputPath, info.Size())
	return 0
}

func runScan(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 1 && (args[0] == "-h" || args[0] == "--help") {
		writeScanUsage(stdout)
		return 0
	}

	flags := flag.NewFlagSet("scan", flag.ContinueOnError)
	flags.SetOutput(stderr)
	flags.Usage = func() {}
	selectionPath := flags.String("selection", "", "local JSON selection file")
	outputPath := flags.String("out", "", "output evidence graph JSON path")
	force := flags.Bool("force", false, "overwrite an existing output file")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			writeScanUsage(stdout)
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintf(stderr, "unexpected scan argument %q\n", flags.Arg(0))
		return 2
	}

	g, err := scan.Run(scan.Options{
		SelectionPath: *selectionPath,
		OutputPath:    *outputPath,
		Force:         *force,
	})
	if err != nil {
		fmt.Fprintf(stderr, "scan: %v\n", err)
		return 2
	}
	if err := scan.Write(*outputPath, g, *force); err != nil {
		fmt.Fprintf(stderr, "scan: %v\n", err)
		return 2
	}
	info, err := os.Stat(*outputPath)
	if err != nil {
		fmt.Fprintf(stderr, "scan: inspect output: %v\n", err)
		return 2
	}
	fmt.Fprintf(stdout, "wrote %s (%d bytes)\n", *outputPath, info.Size())
	return 0
}

func writeUsage(w io.Writer) {
	fmt.Fprint(w, `Portolan maps incomplete software landscapes into an honest evidence graph.

Usage:
  portolan --version
  portolan import cyclonedx --in bom.cdx.json --out graph.json
  portolan import graphify --in graphify-out/graph.json --out graph.json
  portolan import repomix --in repomix-output.xml --out graph.json
  portolan import symbol-index --in symbols.json --out graph.json
  portolan produce semgrep --root . --config .semgrep.yml --out semgrep.json
  portolan produce repomix --root . --out repomix-output.xml
  portolan produce graphify --root . --out graphify-run
  portolan context prepare --root . --out .portolan/context --profile cursor
  portolan map --selection selection.json --out .portolan/run
  portolan map --root . --out .portolan/run
  portolan query findings --bundle .portolan/run --kind relationships --limit 20
  portolan query gaps --bundle .portolan/run --limit 20
  portolan graph slice --bundle .portolan/run --repo repo-id --out slice.json
  portolan adapter validate --in adapter.json
  portolan diff --base old-graph.json --head new-graph.json --out diff.json
  portolan selection generate-bigtop --manifest corpora/apache-bigtop/manifest.json --repo-dir /path/to/repos --out selection.json
  portolan selection validate --selection selection.json
  portolan packet render --graph graph.json --out packet.md
  portolan scan --help

Portolan is local-first and read-only by default. For source checkouts without
an installed binary, build .portolan/bin/portolan with scripts/bootstrap-portolan.
`)
}

func writeProduceUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan produce semgrep --root . --config .semgrep.yml --out semgrep.json [--force]
  portolan produce repomix --root . --out repomix-output.xml [--style xml] [--force]
  portolan produce graphify --root . --out graphify-run [--force]

Run supported local OSS producers into explicit output files.

Produce commands are local-first, make no network calls by themselves, and do
not mutate the target root. They require the named OSS tool to be installed and
write only to the selected output path.
`)
}

func writeProduceSemgrepUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan produce semgrep --root . --config .semgrep.yml --out semgrep.json [--force]

Run installed Semgrep locally and write Semgrep JSON output for later Portolan
context preparation or evidence review.

Flags:
  --root path    local target root to scan
  --config path  local Semgrep config file
  --out path     output Semgrep JSON path
  --force        overwrite an existing output file

Portolan invokes:

  semgrep scan --config <config> --json --json-output <out> --metrics=off <root>

The command treats Semgrep as a first-class local OSS dependency. Portolan does
not download rules, fetch registries, or pass credentials.
`)
}

func writeProduceRepomixUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan produce repomix --root . --out repomix-output.xml [--style xml] [--force]

Run installed Repomix locally and write a packed output file for later Portolan
file-inventory import or agent context use.

Flags:
  --root path             local target root to pack
  --out path              output Repomix packed file
  --style xml|markdown|plain
  --no-security-check     pass --no-security-check through to Repomix
  --force                 overwrite an existing output file

Portolan invokes:

  repomix <root> --output <out> --style <style>

The command treats Repomix as a first-class local OSS dependency. Portolan does
not use remote packing or MCP behavior. Security checks are left enabled unless
--no-security-check is explicitly supplied.
`)
}

func writeProduceGraphifyUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan produce graphify --root . --out graphify-run [--graphify graphify] [--force]

Run installed Graphify locally and write a Graphify graph under an explicit
output directory for later Portolan graphify import.

Flags:
  --root path        local target root to analyze
  --out dir          output directory; Portolan writes <dir>/source-copy/graphify-out/graph.json
  --graphify path    installed Graphify executable (default: graphify)
  --force            overwrite an existing output directory

Portolan stages a source copy under the selected output directory and invokes:

  graphify update <out>/source-copy --force --no-cluster

This treats Graphify as a first-class local OSS dependency while preserving the
Portolan target-root boundary. The target checkout is read-only; Graphify output
is produced inside --out. Symlinks, .git, .portolan, and existing graphify-out
directories are not copied into the staging tree.
`)
}

func writeQueryUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan query findings --bundle <map-run-dir> --kind <kind> [--limit 20]
  portolan query gaps --bundle <map-run-dir> [--limit 20]

Ask bounded, read-only questions against an existing map bundle without loading
full graph.json into an agent context.

Available subcommands:
  findings   print bounded finding records by kind as JSON
  gaps       print weak unknown, cannot_verify, and not_assessed records as JSON

The query surface reads local bundle artifacts only, writes JSON to stdout, and
starts no daemon. Future MCP compatibility is a deferred contract, not runtime
behavior in this command.
`)
}

func writeQueryFindingsUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan query findings --bundle <map-run-dir> --kind <kind> [--limit 20]

Print bounded finding records from findings.jsonl. Each record includes its
evidence state, status, source artifact, and stable portolan:// reference.

Flags:
  --bundle path   existing portolan map bundle directory
  --kind kind     finding kind, for example relationships, duplication, configuration, or technical-debt
  --limit n       maximum records, 1..200 (default 20)
`)
}

func writeQueryGapsUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan query gaps --bundle <map-run-dir> [--limit 20]

Print weak coverage and finding records from coverage.json and findings.jsonl.
This includes unknown, cannot_verify, not_assessed, missing, and blocked records
so agents can explain missing evidence instead of turning gaps into success.

Flags:
  --bundle path   existing portolan map bundle directory
  --limit n       maximum records, 1..200 (default 20)
`)
}

func writeAdapterUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan adapter validate --in adapter.json

Validate local OSS/tool-output adapter contracts.

Available subcommands:
  validate   validate one adapter contract JSON file
`)
}

func writeAdapterValidateUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan adapter validate --in adapter.json

Validate a local OSS/tool-output adapter contract. The command performs no
network calls, starts no daemons, and does not run the adapter tool.

Flags:
  --in path   adapter contract JSON path
`)
}

func writeGraphUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan graph slice --bundle <map-run-dir> --repo <id> --out slice.json [--limit 100] [--force]
  portolan graph slice --bundle <map-run-dir> --edge-kind <kind> --out slice.json [--limit 100] [--force]
  portolan graph slice --bundle <map-run-dir> --finding-kind <kind> --out slice.json [--limit 100] [--force]

Extract bounded, read-only graph slices from an existing map bundle.

Available subcommands:
  slice   write a bounded JSON slice by repository, edge kind, or finding kind
`)
}

func writeGraphSliceUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan graph slice --bundle <map-run-dir> --repo <id> --out slice.json [--limit 100] [--force]
  portolan graph slice --bundle <map-run-dir> --edge-kind <kind> --out slice.json [--limit 100] [--force]
  portolan graph slice --bundle <map-run-dir> --finding-kind <kind> --out slice.json [--limit 100] [--force]

Extract a bounded JSON graph slice from an existing local map bundle. The
command reads graph.json and findings.jsonl locally, writes only to --out, and
does not mutate the target repositories or map bundle.

Flags:
  --bundle path       existing portolan map bundle directory
  --repo id           repository node ID to slice around
  --edge-kind kind    edge kind to sample
  --finding-kind kind finding kind to sample
  --out path          output graph slice JSON path
  -o path             output graph slice JSON path
  --limit n           maximum samples per section, 1..1000 (default 100)
  --force             overwrite an existing output file

Exactly one of --repo, --edge-kind, or --finding-kind is required. The slice is
not the full graph; use it after summary.json and graph-index.json and before
loading large graph.json into an agent prompt.
`)
}

func writeContextUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan context prepare --root <dir> --out <dir> --profile cursor [--force]

Prepare local, read-only agent context packs.

Available subcommands:
  prepare   write agent-brief.md, answer-contract.md, query-plan.md, evidence-index.jsonl, repos.json, tool-registry.json, oss-plan.json, and gaps.jsonl
`)
}

func writeContextPrepareUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan context prepare --root <dir> --out <dir> --profile cursor [--force]

Prepare a Cursor-readable local context pack before an agent answers broad
codebase or architecture questions. The command discovers bounded local Git
repositories and candidate OSS/tool-output files, uses no network calls, starts
no daemons, writes only to --out, and does not mutate the target root.

Flags:
  --root path       local landscape root path
  --out path        output context pack directory
  --profile name    agent profile; currently only "cursor"
  --force           replace an existing output directory

The context pack contains agent-brief.md, answer-contract.md, query-plan.md,
evidence-index.jsonl, repos.json, tool-registry.json, oss-plan.json, and
gaps.jsonl. The OSS plan records local producer availability and safe output
paths; it does not run external scanners.
`)
}

func writeMapUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan map --selection selection.json --out .portolan/run [--force]
  portolan map --root . --out .portolan/run [--force]

Build a local, read-only artifact bundle for agent landscape mapping.

Flags:
  --selection path   local landscape selection JSON path
  --root path        local root path
  --out path         output bundle directory
  --force            replace an existing output directory

The bundle contains run.json, coverage.json, graph.json, graph-index.json,
findings.jsonl, summary.json, and map.md. Use context prepare before broad
agent answers. Agents should read summary.json and graph-index.json before
loading full graph.json. Use --selection for curated local inventories and
--root for bounded local discovery of the root, direct child Git repositories,
and repos/* Git repositories. The command makes no network calls, does not
mutate selected repositories, and writes only to the selected output directory.
`)
}

func writeDiffUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan diff --base old-graph.json --head new-graph.json --out diff.json [--force]

Compare two local Portolan evidence graph JSON files.

Flags:
  --base path   base evidence graph JSON path
  --head path   head evidence graph JSON path
  --out path    output evidence diff JSON path
  --force       overwrite an existing output file

The diff is machine-readable JSON. It reports added, removed, unchanged, and
changed graph facts plus evidence-state transitions. It makes no network calls
and does not emit readiness, pass/fail, improvement, or degradation verdicts.
`)
}

func writeImportUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan import cyclonedx --in bom.cdx.json --out graph.json [--force]
  portolan import graphify --in graphify-out/graph.json --out graph.json [--root source-root] [--force]
  portolan import repomix --in repomix-output.xml --out graph.json [--force]
  portolan import symbol-index --in symbols.json --out graph.json [--force]

Import local tool output into a Portolan evidence graph.

Default import behavior is local-first, makes no network calls, does not invoke
external tools, and records imported facts as metadata-visible unless evidence
cannot be verified from the input.
`)
}

func writeImportCycloneDXUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan import cyclonedx --in bom.cdx.json --out graph.json [--force]

Import a local CycloneDX JSON SBOM into package nodes and dependency edges.

Flags:
  --in path    local CycloneDX JSON input file
  --out path   output evidence graph JSON path
  --force      overwrite an existing output file

The importer reads only the selected local file, makes no network calls, and
records supported component and dependency facts as metadata-visible evidence.
`)
}

func writeImportGraphifyUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan import graphify --in graphify-out/graph.json --out graph.json [--force]

Import a local Graphify node-link graph into Portolan node and edge records.

Flags:
  --in path    local Graphify graph.json input file
  --out path   output evidence graph JSON path
  --root path  optional local source root used to verify source_file paths
  --force      overwrite an existing output file

The importer reads only the selected local file, makes no network calls, and
does not run Graphify. Graphify EXTRACTED facts become source-visible only
when --root is supplied and the referenced source_file is readable inside that
root; otherwise EXTRACTED remains metadata-visible. INFERRED facts become
claim-only, and AMBIGUOUS or unknown confidence stays cannot_verify.
`)
}

func writeImportRepomixUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan import repomix --in repomix-output.xml --out graph.json [--force]

Import local Repomix packed output into file-inventory metadata records.

Flags:
  --in path    local Repomix packed output file
  --out path   output evidence graph JSON path
  --force      overwrite an existing output file

The importer reads only the selected local file, makes no network calls, and
does not run Repomix. File paths listed in the pack become metadata-visible
inventory. Packed source snippets remain context only, not architecture facts.
If the pack says the security check was disabled, the pack source is marked
cannot_verify while file inventory remains metadata-visible.
`)
}

func writeImportSymbolIndexUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan import symbol-index --in symbols.json --out graph.json [--force]

Import a local SCIP/Serena-style symbol-index JSON export into metadata records.

Flags:
  --in path    local symbol-index JSON input file
  --out path   output evidence graph JSON path
  --force      overwrite an existing output file

The importer reads only the selected local file, makes no network calls, and
does not start SCIP indexers, language servers, or Serena MCP/HTTP servers.
Document, symbol identity, and range records become metadata-visible. Semantic
correctness, diagnostics, language coverage, and call graph completeness remain
not_assessed unless backed by separate evidence.
`)
}

func writeSelectionUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan selection validate --selection selection.json
  portolan selection generate-bigtop --manifest manifest.json --repo-dir repos --out selection.json [--force]

Validate local selection inventory without reading target contents.

Default selection behavior is local-first, makes no network calls, and does not
modify selected paths.
`)
}

func writeSelectionGenerateBigtopUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan selection generate-bigtop --manifest corpora/apache-bigtop/manifest.json --repo-dir /path/to/repos --out selection.json [--force]

Generate a full-corpus Bigtop landscape selection from the committed manifest
and an explicit local checkout directory. The command does not clone, fetch, or
mutate repositories; it only writes the selected output JSON.

Flags:
  --manifest path   local Bigtop corpus manifest JSON path
  --repo-dir path   directory containing local repository checkouts named by manifest id
  --out path        output selection JSON path
  --force           overwrite an existing selection file
`)
}

func writeSelectionValidateUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan selection validate --selection selection.json

Validate a local JSON selection file before running a scan.

Flags:
  --selection path   local JSON selection file

Validation checks schema shape, IDs, supported kinds, and local path strings.
It makes no network calls and does not read target contents.
`)
}

func writePacketUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan packet render --graph graph.json --out packet.md [--force]

Render a Markdown evidence packet from an existing graph-only input.

Default packet behavior makes no network calls and does not inspect target
repositories.
`)
}

func writePacketRenderUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan packet render --graph graph.json --out packet.md [--force]

Render a Markdown packet from an existing evidence graph without adding facts.

Flags:
  --graph path   evidence graph JSON path
  --out path     output Markdown packet path
  --force        overwrite an existing output file

The renderer uses graph-only input, makes no network calls, and cites graph ids
for non-aggregate statements.
`)
}

func writeScanUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan scan --selection selection.json --out graph.json [--force]

Build a local, read-only evidence graph from an explicit selection file.

Flags:
  --selection path   local JSON selection file
  --out path         output evidence graph JSON path
  --force            overwrite an existing output file

Evidence states:
  source-visible     source code was inspected directly
  metadata-visible   metadata or exported inventory was inspected
  runtime-visible    runtime observation or telemetry was inspected
  claim-only         only a human or tool claim was supplied
  unknown            no usable evidence was available
  cannot_verify      evidence was present but could not be validated

Default scan behavior makes no network calls and does not modify selected
repositories. Output paths inside selected repositories are refused.

Black-box systems can be represented from local metadata files, runtime exports,
and claim files. Default scans do not query live telemetry or network endpoints.
`)
}
