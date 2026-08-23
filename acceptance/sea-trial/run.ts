/**
 * The gate-runner entry point (sea-trial tasks.md 1.1):
 *
 *   bun acceptance/sea-trial/run.ts --target <bigtop-checkout> [--answers <answers.jsonl>]
 *
 * Launches the sea trial against a real Apache Bigtop landscape checkout,
 * grades the expedition's answers artifact, computes the metrics, presents
 * the designated vessel sheets, captures the Governor's verdict, and
 * writes `<target>/.portolan/sea-trial/report.md`. Exit codes: 0 PASS,
 * 1 FAIL (the trial ran), 2 unusable input (usage, refused corpus,
 * unreadable artifact, absent chart).
 */
import { runSeaTrial } from "./trial";

const USAGE = `usage: bun acceptance/sea-trial/run.ts --target <bigtop-checkout> [--answers <answers.jsonl>]

  --target    the Apache Bigtop landscape checkout to try (required)
  --answers   the expedition's answers artifact
              (default: <target>/.portolan/sea-trial/answers.jsonl)`;

interface Args {
  target?: string;
  answers?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (arg === "--target" || arg === "--answers") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`${arg} needs a value\n\n${USAGE}`);
      }
      if (arg === "--target") args.target = value;
      else args.answers = value;
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      throw new Error(USAGE);
    } else {
      throw new Error(`unknown argument ${JSON.stringify(arg)}\n\n${USAGE}`);
    }
  }
  return args;
}

/** The CLI main, exported for smoke tests. Returns the process exit code. */
export async function main(argv: string[]): Promise<number> {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    return 2;
  }
  if (args.target === undefined) {
    process.stderr.write(`--target is required\n\n${USAGE}\n`);
    return 2;
  }
  try {
    const result = await runSeaTrial({
      targetRoot: args.target,
      ...(args.answers !== undefined ? { answersPath: args.answers } : {}),
    });
    process.stdout.write(
      `\nSea trial verdict: ${result.verdict}\n` +
        (result.reasons.length > 0
          ? result.reasons.map((r) => `- ${r}`).join("\n") + "\n"
          : "") +
        `Report: ${result.reportPath}\n`,
    );
    return result.verdict === "PASS" ? 0 : 1;
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    return 2;
  }
}

if (import.meta.main) {
  process.exitCode = await main(process.argv.slice(2));
}
