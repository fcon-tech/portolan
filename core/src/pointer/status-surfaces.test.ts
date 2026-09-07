/**
 * Pointer status surfaces — the served surfaces carry the Pointer status
 * (openspec/changes/pointer-bridge/specs/pointer/spec.md, "The Pointer
 * status is a reported fact"; tasks.md 4.1–4.2), written red before the
 * wiring exists.
 *
 * The tests run against the CURRENT return shapes of `trust.report`
 * (core/src/tools/trust-report.ts) and `expeditions.propose`
 * (core/src/harbor/proposals.ts) plus the NEW field, read through a cast
 * so the suite compiles until task 4 lands:
 *
 *   // pointer-bridge: new field, red until task 4
 *   TrustReport.pointer: PointerStatus
 *   ProposeResult.pointer: PointerStatus
 *
 * Scenario map:
 * - "Both surfaces agree" (one test per state: current, stale via a
 *   behind version line, stale via diverged bytes, unparseable, missing)
 *   -> both surfaces carry the same status with the same version facts.
 * - "A stale Pointer proposes nothing" -> the queue rows are identical
 *   with a healthy and a stale or missing Pointer — the status is never a
 *   queue input.
 * - "The status check writes nothing" -> AGENTS.md is byte-identical (and
 *   mtime-identical) after both surfaces run.
 */
import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeChart } from "../chart-store";
import { trustReport, type TrustReport } from "../tools/trust-report";
import { computeProposals, type ProposeResult } from "../harbor/proposals";
import type { ChartEntry } from "../types";
import {
  POINTER_FORMAT_VERSION,
  renderPointer,
  skillNameFromFrontmatter,
  type PointerStatus,
} from "./index";

const REPO_ROOT = join(import.meta.dir, "..", "..", "..");
const BEGIN = "<!-- portolan:harbor:begin -->";
const END = "<!-- portolan:harbor:end -->";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

/** The skill name the surfaces' parse derives from the shipped frontmatter. */
function shippedSkillName(): string {
  return skillNameFromFrontmatter(readFileSync(join(REPO_ROOT, "skill", "SKILL.md"), "utf8"));
}

/**
 * A minimal charted province: one vessel over one real file, so the
 * report's live re-sounding confirms and the queue holds a row to compare.
 */
function makeChartedProvince(agents: string | undefined): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-pointer-surfaces-"));
  targets.push(target);
  mkdirSync(join(target, "tug"), { recursive: true });
  writeFileSync(join(target, "tug", "tug.ts"), "// the tug pulls on its own\n");
  const entries: ChartEntry[] = [
    {
      kind: "vessel",
      id: "tug",
      name: "tug",
      behavior: "Pulls other vessels.",
      paths: ["tug"],
      anchors: [{ type: "file", path: "tug/tug.ts", line: 1 }],
      trust: "measured",
    },
  ];
  writeChart(target, entries);
  if (agents !== undefined) writeFileSync(join(target, "AGENTS.md"), agents);
  return target;
}

// pointer-bridge: new field, red until task 4
function reportPointer(target: string): PointerStatus | undefined {
  return (trustReport(target) as TrustReport & { pointer?: PointerStatus }).pointer;
}

// pointer-bridge: new field, red until task 4
function proposePointer(target: string): PointerStatus | undefined {
  return (computeProposals(target) as ProposeResult & { pointer?: PointerStatus }).pointer;
}

/**
 * The four states (stale in both of its shapes), as fixture builders —
 * called inside each test, so the red failure is per-test, not a module
 * load error.
 */
interface StateCase {
  name: string;
  agents: () => string;
  expected: PointerStatus;
}

const STATE_CASES: StateCase[] = [
  {
    name: "current",
    agents: () => renderPointer(shippedSkillName()),
    expected: { state: "current", version: POINTER_FORMAT_VERSION },
  },
  {
    name: "stale (version line behind)",
    agents: () =>
      renderPointer(shippedSkillName()).replace(
        /portolan-pointer\s+\d+\.\d+\.\d+/,
        "portolan-pointer 0.0.9",
      ),
    expected: { state: "stale", found: "0.0.9", current: POINTER_FORMAT_VERSION },
  },
  {
    name: "stale (bytes diverged, version intact)",
    agents: () => renderPointer(shippedSkillName()).replace(END, `\nHand note.\n${END}`),
    expected: { state: "stale", found: POINTER_FORMAT_VERSION, current: POINTER_FORMAT_VERSION },
  },
  {
    name: "unparseable",
    agents: () => `${BEGIN}\n\nSomeone's prose took over this block.\n\n${END}`,
    expected: { state: "unparseable" },
  },
];

// Scenario: Both surfaces agree — one test per Pointer state
for (const state of STATE_CASES) {
  test(`trust.report and expeditions.propose agree the Pointer is ${state.name}`, () => {
    const target = makeChartedProvince(state.agents());

    // pointer-bridge: new field, red until task 4
    expect(
      reportPointer(target),
      `trust.report carries the Pointer status (${state.name})`,
    ).toEqual(state.expected);
    expect(
      proposePointer(target),
      `expeditions.propose carries the same status (${state.name})`,
    ).toEqual(state.expected);
  });
}

// Scenario: Both surfaces agree — missing: no AGENTS.md at all; the
// province is left to install, and the status is still a reported fact.
test("trust.report and expeditions.propose agree the Pointer is missing when the province has no AGENTS.md", () => {
  const target = makeChartedProvince(undefined);

  expect(reportPointer(target), "trust.report reports missing").toEqual({ state: "missing" });
  expect(proposePointer(target), "expeditions.propose reports the same").toEqual({
    state: "missing",
  });
});

// Scenario: A stale Pointer proposes nothing — the queue computed with a
// stale or missing Pointer has exactly the rows of a healthy one.
test("a stale or missing Pointer adds no proposal row", () => {
  const target = makeChartedProvince(renderPointer(shippedSkillName()));
  const healthy = computeProposals(target).proposals;

  writeFileSync(
    join(target, "AGENTS.md"),
    renderPointer(shippedSkillName()).replace(
      /portolan-pointer\s+\d+\.\d+\.\d+/,
      "portolan-pointer 0.0.9",
    ),
  );
  const stale = computeProposals(target).proposals;

  const missing = computeProposals(makeChartedProvince(undefined)).proposals;

  expect(healthy.length, "guard: the fixture queue is non-empty so the comparison has teeth")
    .toBeGreaterThan(0);
  expect(stale, "the stale Pointer adds no proposal").toEqual(healthy);
  expect(missing, "the missing Pointer adds no proposal").toEqual(healthy);
});

// Scenario: The status check writes nothing — AGENTS.md is byte-identical
// (and mtime-identical) after both surfaces compute the status. (Writes
// under .portolan/ — staleness refresh, snapshot — are the surfaces' own
// established behavior, not an AGENTS.md write.)
test("computing the Pointer status through both surfaces leaves AGENTS.md byte-identical", () => {
  const target = makeChartedProvince(renderPointer(shippedSkillName()));
  const agentsPath = join(target, "AGENTS.md");
  const fingerprint = (): string =>
    `${statSync(agentsPath).mtimeMs}:${createHash("sha1").update(readFileSync(agentsPath)).digest("hex")}`;
  const before = fingerprint();

  trustReport(target);
  computeProposals(target);

  expect(fingerprint(), "AGENTS.md untouched by both surfaces").toBe(before);
});
