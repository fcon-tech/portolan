import { test, expect } from "bun:test";
import {
  ChartValidationError,
  validateEntries,
  validateEntry,
} from "./validate";
import type { ChartEntry } from "./types";

const vessel: ChartEntry = {
  kind: "vessel",
  id: "web",
  name: "Web frontend",
  paths: ["services/web"],
  anchors: [{ type: "file", path: "services/web/main.ts", line: 1 }],
  trust: "charted",
};

const fairway: ChartEntry = {
  kind: "fairway",
  id: "f-web-db",
  from: "web",
  to: "db",
  anchors: [{ type: "file", path: "services/web/db.ts", line: 7 }],
  trust: "measured",
};

test("a valid batch passes through unchanged", () => {
  const batch = [vessel, fairway];
  expect(validateEntries(batch)).toStrictEqual(batch);
});

test("an entry without an anchor is rejected and named by kind and id", () => {
  const anchorLess = { ...fairway, anchors: [] };
  const problem = validateEntry(anchorLess);
  expect(problem?.kind).toBe("fairway");
  expect(problem?.id).toBe("f-web-db");
  expect(problem?.problems.join(" ")).toContain("anchors");
});

test("an entry without a trust label is rejected and named by kind and id", () => {
  const labelLess = { ...vessel } as Partial<typeof vessel>;
  delete labelLess.trust;
  const problem = validateEntry(labelLess);
  expect(problem?.kind).toBe("vessel");
  expect(problem?.id).toBe("web");
  expect(problem?.problems.join(" ")).toContain("trust");
});

test("an unknown trust label is rejected with all five accepted values listed", () => {
  try {
    validateEntries([{ ...vessel, trust: "guessed" }]);
    expect("should have thrown").toBe("it did not");
  } catch (err) {
    expect(err).toBeInstanceOf(ChartValidationError);
    const message = (err as ChartValidationError).message;
    for (const label of ["measured", "charted", "reported", "doubtful", "unsurveyed"]) {
      expect(message).toContain(label);
    }
  }
});

test("an unknown kind is rejected with all six kinds listed", () => {
  const problem = validateEntry({ ...vessel, kind: "lighthouse" });
  expect(problem?.kind).toBe("lighthouse");
  expect(problem?.problems.join(" ")).toContain(
    "vessel, fairway, portOfEntry, beacon, light, danger"
  );
});

test("an entry missing its id is still locatable by batch position", () => {
  const { id: _id, ...noId } = vessel;
  const problem = validateEntry(noId, 3);
  expect(problem?.id).toContain("#3");
});

test("validateEntries names every offending entry in a batch", () => {
  try {
    validateEntries([vessel, { ...fairway, anchors: [] }, { kind: "rock", id: "x" }]);
    expect("should have thrown").toBe("it did not");
  } catch (err) {
    const e = err as ChartValidationError;
    expect(e.name).toBe("ChartValidationError");
    expect(e.message).toContain("fairway/f-web-db");
    expect(e.message).toContain("rock/x");
    expect(e.problems).toHaveLength(2);
  }
});
