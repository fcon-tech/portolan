/**
 * Publish-gate decision tests — task 4.1. The npm probe is injected, so the
 * three outcomes (publish / skip / blocked) are covered deterministically,
 * without network and without publishing anything.
 */
import { describe, expect, test } from "bun:test";
import { decidePublish } from "./publish-gate";

describe("decidePublish", () => {
  test("unchanged version -> skip, npm never probed", () => {
    let probed = false;
    const r = decidePublish({
      previousVersion: "0.4.4",
      currentVersion: "0.4.4",
      npmView: () => {
        probed = true;
        return { ok: true, stdout: "0.4.4" };
      },
    });
    expect(r.outcome).toBe("skip");
    expect(probed).toBe(false);
  });

  test("shrunk version -> skip (only growth authorizes a publish)", () => {
    const r = decidePublish({
      previousVersion: "0.5.0",
      currentVersion: "0.4.4",
      npmView: () => ({ ok: true, stdout: "0.4.4" }),
    });
    expect(r.outcome).toBe("skip");
  });

  test("grown version + package on npm -> publish", () => {
    const r = decidePublish({
      previousVersion: "0.4.4",
      currentVersion: "0.4.5",
      npmView: () => ({ ok: true, stdout: "0.4.4" }),
    });
    expect(r.outcome).toBe("publish");
  });

  test("grown version + npm 404 -> blocked, naming the Governor step", () => {
    const r = decidePublish({
      previousVersion: "0.4.4",
      currentVersion: "0.4.5",
      npmView: () => ({ ok: false, notFound: true }),
    });
    expect(r.outcome).toBe("blocked");
    expect(r.message).toContain("Governor");
  });

  test("grown version + npm network error -> blocked (conservative)", () => {
    const r = decidePublish({
      previousVersion: "0.4.4",
      currentVersion: "0.4.5",
      npmView: () => ({ ok: false, notFound: false }),
    });
    expect(r.outcome).toBe("blocked");
  });
});
