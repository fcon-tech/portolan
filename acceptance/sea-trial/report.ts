/**
 * The trial report (sea-trial tasks.md 5.3, spec "The trial leaves a
 * reviewable report"): plain markdown at
 * `<target>/.portolan/sea-trial/report.md` — per-question grades, the
 * three metrics, the gate outcomes, the Governor's verdict verbatim, and
 * the answers-artifact hash. Suitable for git review as a diff.
 */
import { TRUST_LABELS, formatAnchor } from "../../core/src/index";
import type { Bom } from "./bom";
import type { LoadedAnswers } from "./answers";
import type { GradingResult } from "./grading";
import type { FabricationOutcome, HonestyOutcome } from "./gates";
import type {
  FairwayCompleteness,
  StalenessFlip,
  TrustDistribution,
} from "./metrics";
import type { ManifestDerivation } from "./oracle";

export interface GovernorRead {
  /** The designated vessel sheets as presented, name → content (or absence note). */
  presentedSheets: Array<{ vessel: string; content: string | undefined }>;
  /** The verdict exactly as entered, verbatim. */
  verdict: string;
  captured: boolean;
  positive: boolean;
}

export interface TrialReportInput {
  targetRoot: string;
  bom: Bom;
  bomPathRelative: string;
  corpusAttestation: string;
  chartEntries: number;
  answers: LoadedAnswers;
  derivation: ManifestDerivation;
  grading: GradingResult;
  fabrication: FabricationOutcome;
  honesty: HonestyOutcome;
  fairway: FairwayCompleteness;
  trust: TrustDistribution;
  staleness: StalenessFlip;
  governor: GovernorRead;
  verdict: "PASS" | "FAIL";
  reasons: string[];
  runAt: string;
}

function pct(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

export function renderTrialReport(input: TrialReportInput): string {
  const l: string[] = [];
  const push = (s = "") => l.push(s);

  push("# Bigtop Sea Trial — report");
  push();
  push(`- Target: \`${input.targetRoot}\``);
  push(`- Run at: ${input.runAt}`);
  push(`- BOM: \`${input.bomPathRelative}\` (${input.bom.components.length} pinned components)`);
  push(`- Chart: \`.portolan/chart/index.jsonl\` (${input.chartEntries} entries)`);
  push(
    `- Answers artifact: \`${input.answers.path}\` — sha256 \`${input.answers.hash}\`${
      input.answers.absent ? " (absent: no artifact was produced)" : ""
    }`,
  );
  push(`- Corpus shape: ${input.corpusAttestation}`);
  push();
  push(`## Verdict: ${input.verdict}`);
  push();
  if (input.reasons.length === 0) {
    push("All gates passed.");
  } else {
    push("Reasons:");
    for (const reason of input.reasons) push(`- ${reason}`);
  }
  push();

  push("## Fabrication gate");
  push();
  if (input.fabrication.passed) {
    push(`PASS — ${input.fabrication.sounded} cited anchor(s) sounded, all confirmed.`);
  } else {
    push(
      `FAIL — ${input.fabrication.refuted.length} refuted anchor(s) sink the trial regardless of every other gate:`,
    );
    for (const r of input.fabrication.refuted) {
      push(`- ${r.qid} cites \`${r.anchor}\` — ${r.report}`);
    }
  }
  push();

  push("## Unsurveyed honesty");
  push();
  if (input.honesty.passed) {
    push(
      `PASS — Q12 ${input.honesty.q12.detail}; no chart entry guesses the fixed axes ` +
        `(runtime topology, deployed versions). Marking reported to the Governor.`,
    );
  } else {
    push("FAIL — the trial does not accept guesses where the honest label is `unsurveyed`:");
    if (input.honesty.q12.detail.length > 0) push(`- Q12: ${input.honesty.q12.detail}`);
    for (const g of input.honesty.guesses) {
      push(`- \`${g.entry}\` claims ${JSON.stringify(g.claim)} (${g.axis}) under trust \`${g.trust}\``);
    }
  }
  push();

  push("## Questions");
  push();
  push("| Q | area | mode | outcome | detail |");
  push("| --- | --- | --- | --- | --- |");
  for (const g of input.grading.grades) {
    const detail = g.detail.replace(/\|/g, "\\|");
    push(`| ${g.qid} | ${g.area} | ${g.mode} | ${g.outcome} | ${detail} |`);
  }
  push();
  push("Machine expectations actually used (derived from this checkout):");
  push();
  for (const g of input.grading.grades) {
    if (g.expectation !== undefined) push(`- ${g.qid}: ${g.expectation}`);
  }
  if (input.derivation.caveats.length > 0) {
    push();
    push("Manifest read caveats (reported, never hidden):");
    for (const c of input.derivation.caveats) push(`- \`${c.path}\`: ${c.problem}`);
  }
  push();

  push("### Expert-judged answers recorded for the Governor");
  push();
  for (const g of input.grading.grades) {
    if (g.mode !== "expert") continue;
    const anchors = (g.anchors ?? []).map(formatAnchor).join("; ") || "(none)";
    push(`- **${g.qid}** (trust: ${g.trust}) — anchors: ${anchors}`);
  }
  push();

  push("## Metrics");
  push();
  push("### Fairway completeness");
  push();
  push(
    `- Charted fairways: ${input.fairway.charted}/${input.fairway.bomPairs} of the BOM-derived ` +
      `dependency list (${pct(input.fairway.ratio)}).`,
  );
  if (input.fairway.missing.length > 0) {
    push(`- Uncharted dependencies (${input.fairway.missing.length}):`);
    for (const m of input.fairway.missing) push(`  - ${m}`);
  } else {
    push("- Uncharted dependencies: none.");
  }
  if (input.fairway.extraFairways.length > 0) {
    push(`- Charted fairways beyond the BOM list (${input.fairway.extraFairways.length}):`);
    for (const e of input.fairway.extraFairways) push(`  - ${e}`);
  }
  push();

  push("### Trust distribution");
  push();
  push(`- ${input.trust.total} chart entries${input.trust.invalid > 0 ? `, ${input.trust.invalid} with a label outside the vocabulary` : ""}`);
  for (const label of TRUST_LABELS) {
    push(`  - ${label}: ${input.trust.counts[label]} (${pct(input.trust.shares[label])})`);
  }
  push();

  push("### Staleness flip");
  push();
  push(`- Status: ${input.staleness.status} — ${input.staleness.detail}`);
  if (input.staleness.file !== undefined) {
    push(`- Touched file: \`${input.staleness.file}\` (vessel \`${input.staleness.vessel}\`)`);
    push(`- sha256 before: \`${input.staleness.hashBefore}\``);
    push(`- sha256 after revert: \`${input.staleness.hashAfterRevert}\` (byte-identical: ${input.staleness.fileRestoredByteIdentical})`);
    push(`- Chart restored byte-identical: ${input.staleness.chartRestoredByteIdentical}`);
    push(`- Vessels flipped to pending correction: [${input.staleness.changedVessels.join(", ")}]`);
  }
  push();

  push("## Governor's read");
  push();
  for (const sheet of input.governor.presentedSheets) {
    push(`### Sheet: ${sheet.vessel}`);
    push();
    if (sheet.content === undefined) {
      push("(no sheet charted for this vessel)");
    } else {
      // Indented verbatim: sheet content carries its own fences.
      for (const line of sheet.content.split("\n")) push(`    ${line}`);
    }
    push();
  }
  push(`Verdict (recorded verbatim): ${JSON.stringify(input.governor.verdict)}`);
  push(`Captured: ${input.governor.captured}; positive: ${input.governor.positive}`);
  push();
  return l.join("\n");
}
