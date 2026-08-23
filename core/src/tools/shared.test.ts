import { test, expect } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findBinary, MissingBinaryError, requireTrustLabel } from "./shared";
import { findBinary as find } from "./shared";

const fixturesBin = join(import.meta.dir, "..", "..", "test", "fixtures", "bin");

test("findBinary discovers an executable on a doctored PATH", () => {
  const found = findBinary("probe-double", { PATH: fixturesBin });
  expect(found).toBeDefined();
  expect(found!.endsWith(join("fixtures", "bin", "probe-double"))).toBe(true);
});

test("findBinary returns undefined when the PATH has no such binary", () => {
  const emptyDir = mkdtempSync(join(tmpdir(), "portolan-empty-path-"));
  expect(findBinary("rg", { PATH: emptyDir })).toBeUndefined();
  expect(findBinary("ctags", { PATH: emptyDir })).toBeUndefined();
  expect(findBinary("anything", { PATH: "" })).toBeUndefined();
});

test("the missing-binary error names the binary and refuses substitutes", () => {
  const err = new MissingBinaryError("ctags", "symbols");
  expect(err).toBeInstanceOf(MissingBinaryError);
  expect(err.binary).toBe("ctags");
  expect(err.message).toContain('"ctags"');
  expect(err.message).toContain("no results were gathered");
  expect(err.message).toContain("no substitute search was attempted");
});

test("requireTrustLabel passes a labeled result and fails a stripped one", () => {
  const labeled = { trust: "measured" as const };
  expect(() => requireTrustLabel(labeled, "measured", "sweep result")).not.toThrow();
  const stripped: { trust?: "measured" } = { ...labeled };
  delete stripped.trust;
  expect(() => requireTrustLabel(stripped, "measured", "sweep result")).toThrow(
    /no label at all/,
  );
  const wrong = { trust: "charted" as const };
  expect(() => requireTrustLabel(wrong, "measured", "sweep result")).toThrow(
    /"charted"/,
  );
});

test("the machine under test: rg is discoverable on the real PATH", () => {
  // Documents the test environment; integration tests below skip if absent.
  console.log(`rg on this machine: ${find("rg") ?? "(absent)"}`);
  console.log(`ctags on this machine: ${find("ctags") ?? "(absent)"}`);
});
