package app

import (
	"flag"
	"fmt"
	"io"
	"os"

	"github.com/fall-out-bug/portolan/internal/importer"
	"github.com/fall-out-bug/portolan/internal/packet"
	"github.com/fall-out-bug/portolan/internal/scan"
	"github.com/fall-out-bug/portolan/internal/selection"
)

const Version = "dev"

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
	default:
		fmt.Fprintf(stderr, "unknown command %q\n\n", args[0])
		writeUsage(stderr)
		return 2
	}
}

func runImport(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 || args[0] == "-h" || args[0] == "--help" || args[0] == "help" {
		writeImportUsage(stdout)
		return 0
	}
	switch args[0] {
	case "cyclonedx":
		return runImportCycloneDX(args[1:], stdout, stderr)
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

func runSelection(args []string, stdout io.Writer, stderr io.Writer) int {
	if len(args) == 0 || args[0] == "-h" || args[0] == "--help" || args[0] == "help" {
		writeSelectionUsage(stdout)
		return 0
	}
	switch args[0] {
	case "validate":
		return runSelectionValidate(args[1:], stdout, stderr)
	default:
		fmt.Fprintf(stderr, "unknown selection command %q\n", args[0])
		return 2
	}
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
  portolan selection validate --selection selection.json
  portolan packet render --graph graph.json --out packet.md
  portolan scan --help

Portolan is local-first and read-only by default. The bootstrap build documents
the contract before it collects repository, metadata, runtime, or claim evidence.
`)
}

func writeImportUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan import cyclonedx --in bom.cdx.json --out graph.json [--force]

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

func writeSelectionUsage(w io.Writer) {
	fmt.Fprint(w, `Usage:
  portolan selection validate --selection selection.json

Validate local selection inventory without reading target contents.

Default selection behavior is local-first, makes no network calls, and does not
modify selected paths.
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
