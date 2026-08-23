/**
 * The sea-trial orchestrator (sea-trial tasks.md 5.1–5.2).
 *
 * `runSeaTrial` is the public gate: corpus guard (no fixture shortcut),
 * the checkout's own BOM and manifests as oracle, the expedition's chart
 * and answers artifact — then the unchecked pipeline below. The verdict
 * is a fixed gate tree, not a score (design.md, decision 7): FAIL on any
 * refuted anchor, any failed machine check, any unanswered question, any
 * enumerated guess, or a negative Governor's verdict; otherwise PASS.
 *
 * `executeTrial` exists for unit tests of the pipeline (report structure,
 * gate tree, Governor capture); a report it produces is stamped
 * `UNVERIFIED — unit-test execution` so a fixture run can never pose as
 * a real trial. The Governor's verdict is captured verbatim through an
 * injectable prompt — the runner never infers it.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import readline from "node:readline";
import {
  chartDir,
  readChart,
  soundEdge,
  type ChartEntry,
  type IndexedEntry,
} from "../../core/src/index";
import { sheetFileName } from "../../core/src/sheets";
import { readBom, type Bom } from "./bom";
import { answersPathFor, loadAnswers, type LoadedAnswers } from "./answers";
import { assertRealCorpus, findBomPath, findComponentRoots } from "./corpus";
import { deriveHadoopManifestDependents, type ManifestDerivation } from "./oracle";
import { gradeAnswers, type GradingResult } from "./grading";
import { fabricationGate, unsurveyedHonestyGate } from "./gates";
import {
  fairwayCompleteness,
  stalenessFlip,
  trustDistribution,
  type FairwayCompleteness,
  type StalenessFlip,
  type TrustDistribution,
} from "./metrics";
import { renderTrialReport, type GovernorRead } from "./report";
import { GOVERNOR_SHEET_VESSELS } from "./questions";

export function reportPathFor(targetRoot: string): string {
  return join(targetRoot, ".portolan", "sea-trial", "report.md");
}

/**
 * The default Governor prompt: present the designated sheets on stdout,
 * read one verdict line from stdin (EOF counts as not captured — the
 * runner never infers the verdict).
 */
export async function promptGovernorOnStdin(presentation: string): Promise<string> {
  process.stdout.write(presentation + "\n");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let settled = false;
  return await new Promise<string>((resolvePromise) => {
    const done = (value: string): void => {
      if (settled) return;
      settled = true;
      rl.close();
      resolvePromise(value);
    };
    rl.on("close", () => done(""));
    rl.question('Governor\'s read — "Is this the real Bigtop?" (yes/no): ', done);
  });
}

/** Presents the designated sheets and returns the Governor's verdict verbatim. */
export type GovernorPrompt = (presentation: string) => Promise<string> | string;

export interface TrialOptions {
  targetRoot: string;
  /** Answers artifact path; defaults to `<target>/.portolan/sea-trial/answers.jsonl`. */
  answersPath?: string;
  /** Verdict prompt; defaults to the interactive stdin prompt in run.ts. */
  governor?: GovernorPrompt;
}

export interface TrialResult {
  verdict: "PASS" | "FAIL";
  reasons: string[];
  reportPath: string;
  report: string;
  grading: GradingResult;
  staleness: StalenessFlip;
  governor: GovernorRead;
}

/**
 * The public gate. Throws on unusable inputs (refused corpus, unreadable
 * artifact, absent chart); otherwise returns the trial result with the
 * report already written.
 */
export async function runSeaTrial(options: TrialOptions): Promise<TrialResult> {
  const targetRoot = resolve(options.targetRoot);
  const bomPath = findBomPath(targetRoot);
  const bom = readBom(bomPath);
  const componentRoots = findComponentRoots(targetRoot, bom);
  const shape = assertRealCorpus(targetRoot, bom, componentRoots);

  let chartEntries: IndexedEntry[];
  try {
    chartEntries = readChart(targetRoot);
  } catch (err) {
    throw new Error(
      `no chart to try: ${(err as Error).message} — an expedition must survey the target ` +
        `(writing <target>/.portolan/chart/) before the sea trial runs`,
    );
  }

  const answersPath = options.answersPath ?? answersPathFor(targetRoot);
  const answers = loadAnswers(answersPath);
  const derivation = deriveHadoopManifestDependents(targetRoot, bom, componentRoots);

  return executeTrial({
    targetRoot,
    bom,
    bomPathRelative: relative(targetRoot, bomPath) || bomPath,
    corpusAttestation: shape.attestation,
    chartEntries,
    answers,
    derivation,
    governor: options.governor ?? promptGovernorOnStdin,
  });
}

export interface ExecuteTrialInput {
  targetRoot: string;
  bom: Bom;
  bomPathRelative: string;
  corpusAttestation: string;
  chartEntries: IndexedEntry[];
  answers: LoadedAnswers;
  derivation: ManifestDerivation;
  governor?: GovernorPrompt;
}

/** A charted vessel as stored in the index (entry plus store metadata). */
type IndexedVessel = Extract<IndexedEntry, { kind: "vessel" }>;

/** Sample up to `limit` import claims through sound.edge (reported, never failing). */
function sampleQ3Imports(
  targetRoot: string,
  chartEntries: IndexedEntry[],
  answers: LoadedAnswers,
  limit = 3,
): string[] {
  const q3 = answers.answers.get("Q3");
  if (q3 === undefined || q3.claims === undefined) return [];
  const vessels = chartEntries.filter(
    (e): e is IndexedVessel => e.kind === "vessel",
  );
  const byName = new Map(vessels.map((v) => [v.name.toLowerCase(), v]));
  const hadoop = byName.get("hadoop");
  const lines: string[] = [];
  if (hadoop === undefined) {
    lines.push("sound.edge sampling skipped: no charted vessel named hadoop");
    return lines;
  }
  const claimed = Object.entries(q3.claims)
    .filter(([, via]) => via === "import" || via === "both")
    .map(([label]) => label)
    .sort()
    .slice(0, limit);
  for (const label of claimed) {
    const source = byName.get(label.toLowerCase());
    if (source === undefined) {
      lines.push(`sound.edge sample ${label} → hadoop: no charted vessel named ${label}`);
      continue;
    }
    try {
      const fairway: ChartEntry = {
        kind: "fairway",
        id: `q3-sample-${label}-hadoop`,
        from: source.id,
        to: hadoop.id,
        anchors: [...source.anchors].slice(0, 1),
        trust: "reported",
      };
      const result = soundEdge(targetRoot, { fairway, source, target: hadoop });
      lines.push(`sound.edge sample ${label} → hadoop: ${result.report}`);
    } catch (err) {
      lines.push(`sound.edge sample ${label} → hadoop could not run: ${(err as Error).message}`);
    }
  }
  if (lines.length === 0 && claimed.length === 0) {
    // Nothing claimed via imports: the manifest side already covered it.
    return [];
  }
  return lines;
}

function presentGovernorSheets(targetRoot: string, chartEntries: IndexedEntry[]): GovernorRead["presentedSheets"] {
  const dir = chartDir(targetRoot);
  const presented: GovernorRead["presentedSheets"] = [];
  for (const name of GOVERNOR_SHEET_VESSELS) {
    const vessel = chartEntries.find(
      (e): e is IndexedVessel =>
        e.kind === "vessel" &&
        (e.name.toLowerCase() === name || e.id.toLowerCase() === name),
    );
    let content: string | undefined;
    if (vessel !== undefined) {
      try {
        content = readFileSync(join(dir, sheetFileName(vessel.id)), "utf8");
      } catch {
        content = undefined;
      }
    }
    presented.push({ vessel: name, content });
  }
  return presented;
}

/** A verdict is a positive read only when it says yes. */
export function isPositiveVerdict(text: string): boolean {
  return /^yes\b/i.test(text.trim());
}

/**
 * The full pipeline over pre-loaded, pre-guarded inputs. Unit tests drive
 * this directly with fixtures; the report it emits is stamped with the
 * corpus attestation they pass in, so it can never pose as a real trial.
 */
export async function executeTrial(input: ExecuteTrialInput): Promise<TrialResult> {
  const { targetRoot, bom, chartEntries, answers, derivation } = input;

  const grading = gradeAnswers(bom, derivation, answers);
  const q3Samples = sampleQ3Imports(targetRoot, chartEntries, answers);
  if (q3Samples.length > 0) {
    const q3 = grading.grades.find((g) => g.qid === "Q3");
    if (q3 !== undefined) q3.detail += `; ${q3Samples.join("; ")}`;
  }
  const fabrication = fabricationGate(targetRoot, answers);
  const fairway: FairwayCompleteness = fairwayCompleteness(bom, chartEntries);
  const trust: TrustDistribution = trustDistribution(chartEntries);
  const staleness = stalenessFlip(targetRoot, chartEntries);
  const honesty = unsurveyedHonestyGate(chartEntries, answers.answers.get("Q12"));

  // The Governor's read comes after every machine gate is evaluated.
  const presentedSheets = presentGovernorSheets(targetRoot, chartEntries);
  const presentation =
    `Bigtop Sea Trial — Governor's read\n` +
    `The designated vessel sheets follow. Answer one question: "Is this the real Bigtop?"\n\n` +
    presentedSheets
      .map((s) =>
        `--- ${s.vessel} ---\n${s.content ?? "(no sheet charted for this vessel)"}\n`,
      )
      .join("\n");
  let verdictText = "";
  if (input.governor !== undefined) {
    verdictText = String(await input.governor(presentation)).trim();
  }
  const governor: GovernorRead = {
    presentedSheets,
    verdict: verdictText,
    captured: verdictText.length > 0,
    positive: verdictText.length > 0 && isPositiveVerdict(verdictText),
  };

  // The fixed gate tree (design.md, decision 7) — FAIL causes, in order.
  const reasons: string[] = [];
  for (const r of fabrication.refuted) {
    reasons.push(`fabricated anchor: ${r.qid} cites \`${r.anchor}\` — ${r.report}`);
  }
  for (const g of grading.machineFailures) {
    reasons.push(`failed machine check ${g.qid}: ${g.detail} (expected: ${g.expectation})`);
  }
  if (staleness.status !== "pass") {
    reasons.push(`staleness flip ${staleness.status}: ${staleness.detail}`);
  }
  for (const g of grading.unanswered) {
    reasons.push(`unanswered ${g.qid}: ${g.detail}`);
  }
  if (honesty.guesses.length > 0) {
    for (const g of honesty.guesses) {
      reasons.push(
        `enumerated guess: \`${g.entry}\` claims ${JSON.stringify(g.claim)} (${g.axis}) under trust \`${g.trust}\``,
      );
    }
  }
  if (!honesty.q12.answered) {
    reasons.push(`unsurveyed honesty: ${honesty.q12.detail}`);
  } else if (!honesty.passed && honesty.guesses.length === 0) {
    reasons.push(`unsurveyed honesty: ${honesty.q12.detail}`);
  }
  if (!governor.captured) {
    reasons.push("Governor's verdict not captured — the final sign is missing");
  } else if (!governor.positive) {
    reasons.push(`negative Governor's verdict: ${JSON.stringify(governor.verdict)}`);
  }
  const verdict: "PASS" | "FAIL" = reasons.length === 0 ? "PASS" : "FAIL";

  const report = renderTrialReport({
    targetRoot,
    bom,
    bomPathRelative: input.bomPathRelative,
    corpusAttestation: input.corpusAttestation,
    chartEntries: chartEntries.length,
    answers,
    derivation,
    grading,
    fabrication,
    honesty,
    fairway,
    trust,
    staleness,
    governor,
    verdict,
    reasons,
    runAt: new Date().toISOString(),
  });
  const reportPath = reportPathFor(targetRoot);
  mkdirSync(join(targetRoot, ".portolan", "sea-trial"), { recursive: true });
  writeFileSync(reportPath, report);

  return { verdict, reasons, reportPath, report, grading, staleness, governor };
}
