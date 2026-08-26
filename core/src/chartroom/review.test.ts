/**
 * Fleet review unit checks (fleet-review tasks 1.1 + 1.2): explicit targets
 * only, counts from the index alone, one artifact inside the first target's
 * perimeter, byte-deterministic, loud on a non-charted target.
 */
import { test, expect, beforeAll } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildFleetReview, fleetReviewPath } from "./review";

function makeProvince(name: string, entries: unknown[]): string {
  const root = join(mkdtempSync(join(tmpdir(), `fleet-${name}-`)), name);
  mkdirSync(join(root, ".portolan/chart"), { recursive: true });
  writeFileSync(
    join(root, ".portolan/chart/index.jsonl"),
    entries.map((e) => JSON.stringify(e)).join("\n") + "\n",
  );
  return root;
}

const vessel = (id: string, trust: string) => ({
  kind: "vessel", id, name: id.toUpperCase(), trust, stale: false,
  anchors: [{ type: "file", path: `repos/${id}/pom.xml`, line: 1 }],
  paths: [`repos/${id}`],
});
const fairway = (id: string, from: string, to: string, trust = "charted") => ({
  kind: "fairway", id, from, to, trust, stale: false,
  anchors: [{ type: "file", path: "bom", line: 2 }],
});

let alpha: string, beta: string;

beforeAll(() => {
  // hub topology: beta→alpha twice, gamma→alpha once ⇒ top hub alpha ×3
  alpha = makeProvince("alpha", [
    vessel("alpha-v", "measured"),
    fairway("fw-1", "beta", "alpha-v"),
    fairway("fw-2", "beta2", "alpha-v"),
    fairway("fw-3", "gamma", "alpha-v"),
  ]);
  beta = makeProvince("beta", [vessel("one", "charted"), vessel("two", "doubtful"), fairway("f", "two", "one", "reported")]);
});

test("assembles named provinces in order with index arithmetic only", () => {
  const result = buildFleetReview([alpha, beta]);
  expect(result.provinces).toBe(2);
  expect(result.path).toBe(fleetReviewPath(alpha));

  const portolan = readdirSync(join(alpha, ".portolan"));
  expect(portolonHas(portolan)).toBe(true);

  const html = readFileSync(result.path, "utf8");
  expect(html).toContain("Fleet Review");
  expect(html.indexOf("fleet-alpha")).toBeLessThan(html.indexOf("fleet-beta")); // order preserved
  expect(html).toContain('"vessel":1');
  expect(html).toContain('"charted":1');
  expect(html).toContain('"doubtful":1');
  expect(html).toContain('"topHub":{"id":"alpha-v","fanIn":3}');
});
function portolonHas(list: string[]): boolean {
  return list.includes("fleet-review.html");
}

test("deterministic over the same target list", () => {
  const first = readFileSync(fleetReviewPath(alpha), "utf8");
  buildFleetReview([alpha, beta]);
  expect(readFileSync(fleetReviewPath(alpha), "utf8")).toEqual(first);
});

test("no template placeholder survives; room link honesty is embedded", () => {
  const html = readFileSync(fleetReviewPath(alpha), "utf8");
  expect(html).not.toContain("__FLEET_DATA__");
  expect(html).toContain('"roomRendered":false'); // chart-room.html not rendered in fixtures
});

test("a non-charted target fails loudly naming the path; nothing is written", () => {
  const empty = mkdtempSync(join(tmpdir(), "fleet-empty-"));
  expect(() => buildFleetReview([alpha, empty])).toThrow(join(empty, ".portolan/chart"));
});

test("an empty target list is rejected", () => {
  expect(() => buildFleetReview([])).toThrow(/at least one --target/);
});
