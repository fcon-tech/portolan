package app

import (
	"flag"
	"fmt"
	"io"
	"os"

	"github.com/fall-out-bug/portolan/internal/scan"
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
	default:
		fmt.Fprintf(stderr, "unknown command %q\n\n", args[0])
		writeUsage(stderr)
		return 2
	}
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
  portolan scan --help

Portolan is local-first and read-only by default. The bootstrap build documents
the contract before it collects repository, metadata, runtime, or claim evidence.
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
`)
}
