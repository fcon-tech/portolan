package app

import (
	"fmt"
	"io"
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

	fmt.Fprintln(stderr, "scan is not implemented in this bootstrap build")
	fmt.Fprintln(stderr, "run `portolan scan --help` to inspect the planned contract")
	return 2
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
  portolan scan [targets...] [flags]

Planned contract:
  Build a local, read-only evidence graph across repositories, metadata exports,
  runtime observations, and explicit human claims.

Evidence states:
  source-visible     source code was inspected directly
  metadata-visible   metadata or exported inventory was inspected
  runtime-visible    runtime observation or telemetry was inspected
  claim-only         only a human or tool claim was supplied
  unknown            no usable evidence was available
  cannot_verify      evidence was present but could not be validated

The current bootstrap build does not collect data yet.
`)
}
