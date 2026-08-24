/**
 * Through-the-server wiring tests. Where the unit suites pin the tool
 * implementations and the registry table, this file proves the MCP layer:
 * every call goes through the real stdio server entry point, and the result
 * that comes back is the tool's own structured result, unchanged.
 * specs/harness/spec.md
 */
import { test, expect } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  childEnv,
  envWithCtagsDouble,
  envWithoutCtags,
  errorTextOf,
  fixturesBin,
  makeProvince,
  structuredOf,
  withServer,
} from "./test-harness";
import { V1_TOOL_NAMES } from "./registry";
import { readChart } from "../chart-store";
import { sweep } from "../tools/sweep";
import { symbols } from "../tools/symbols";
import { readManifest } from "../tools/manifests";
import { soundAnchor, soundEdge } from "../tools/sound";
import { findBinary } from "../tools/shared";

const rgPresent = findBinary("rg") !== undefined;

test("tools/list through the server returns all nine v1 tools under Portolan names", async () => {
  const target = makeProvince();
  await withServer({ targetRoot: target }, async (client) => {
    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name)).toEqual(V1_TOOL_NAMES);
    for (const tool of listed.tools) {
      expect((tool.description ?? "").length).toBeGreaterThan(0);
      expect((tool.inputSchema as { type?: string }).type).toBe("object");
    }
  });
});

/** A minimal, valid chart: two vessels and the fairway between them. */
function sampleEntries(): unknown[] {
  return [
    {
      kind: "vessel",
      id: "v-cart",
      name: "cart",
      behavior: "holds the shopping cart",
      paths: ["src"],
      anchors: [{ type: "file", path: "src/cart.ts", line: 4 }],
      trust: "measured",
    },
    {
      kind: "vessel",
      id: "v-checkout",
      name: "checkout",
      paths: ["src"],
      anchors: [{ type: "file", path: "src/checkout.ts", line: 1 }],
      trust: "measured",
    },
    {
      kind: "fairway",
      id: "f-checkout-cart",
      from: "v-checkout",
      to: "v-cart",
      anchors: [{ type: "file", path: "src/checkout.ts", line: 1 }],
      trust: "measured",
    },
  ];
}

test("chart.write through the server persists; chart.read reads it back verbatim", async () => {
  const target = makeProvince();
  await withServer({ targetRoot: target }, async (client) => {
    const write = await client.callTool({
      name: "chart.write",
      arguments: { entries: sampleEntries() },
    });
    expect(write.isError).toBeUndefined();
    const result = structuredOf(write) as { dir: string; notices: unknown[] };
    expect(result.dir).toBe(join(target, ".portolan", "chart"));
    expect(result.notices.length).toBe(3); // three additions

    // The write persisted on disk inside the province perimeter.
    expect(existsSync(join(target, ".portolan", "chart", "index.jsonl"))).toBe(true);

    // Reading back through the server returns exactly what the store holds.
    const read = await client.callTool({ name: "chart.read", arguments: {} });
    expect(read.isError).toBeUndefined();
    const { entries } = structuredOf(read) as { entries: unknown[] };
    expect(entries).toEqual(readChart(target));
    expect(entries.length).toBe(3);
  });
});

test("log.append through the server leaves a receipt; log.read resolves it by id and filter", async () => {
  const target = makeProvince();
  await withServer({ targetRoot: target }, async (client) => {
    const first = await client.callTool({
      name: "log.append",
      arguments: {
        command: "sweep pattern=CartService",
        scope: "src",
        outcome: "ok: 4 chunks",
      },
    });
    expect(first.isError).toBeUndefined();
    const receipt = structuredOf(first) as { id: string; command: string; outcome: string };
    expect(receipt.id).toBe("r1");
    expect(receipt.command).toBe("sweep pattern=CartService");

    const second = await client.callTool({
      name: "log.append",
      arguments: { command: "symbols name=CartService", outcome: "ok: 1 definition" },
    });
    expect((structuredOf(second) as { id: string }).id).toBe("r2");

    const byId = await client.callTool({ name: "log.read", arguments: { id: "r1" } });
    const idReceipts = (structuredOf(byId) as { receipts: Array<{ command: string; outcome: string }> }).receipts;
    expect(idReceipts.length).toBe(1);
    expect(idReceipts[0]!.command).toBe("sweep pattern=CartService");
    expect(idReceipts[0]!.outcome).toBe("ok: 4 chunks");

    const byFilter = await client.callTool({
      name: "log.read",
      arguments: { filter: { command: "symbols name=CartService" } },
    });
    expect((structuredOf(byFilter) as { receipts: unknown[] }).receipts.length).toBe(1);

    // A dead id is an honest empty read, not an error.
    const dead = await client.callTool({ name: "log.read", arguments: { id: "r404" } });
    expect((structuredOf(dead) as { receipts: unknown[] }).receipts).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tasks.md 2.3: every probe and sounding, called through the server, returns
// the tool's own structured, anchored, trust-labeled result unchanged —
// proven by deep equality with a direct in-process call on the same target.
// ---------------------------------------------------------------------------

test.skipIf(!rgPresent)("sweep through the server passes anchored measured chunks through unchanged", async () => {
  const target = makeProvince();
  const direct = sweep(target, "CartService");
  await withServer({ targetRoot: target }, async (client) => {
    const result = await client.callTool({ name: "sweep", arguments: { pattern: "CartService" } });
    expect(result.isError).toBeUndefined();
    expect(structuredOf(result)).toEqual(direct);

    const labeled = structuredOf(result) as { trust: string; chunks: Array<{ anchor: unknown }> };
    expect(labeled.trust).toBe("measured");
    for (const chunk of labeled.chunks) expect(chunk.anchor).toBeObject();

    // An honest empty result stays an honest empty result through the server.
    const none = await client.callTool({ name: "sweep", arguments: { pattern: "NOWHERE_XYZ" } });
    expect((structuredOf(none) as { chunks: unknown[] }).chunks).toEqual([]);
  });
});

test("symbols through the server: definitions pass through; missing ctags is an honest tool error", async () => {
  const target = makeProvince();
  const doubleEnv = childEnv(fixturesBin);
  const direct = symbols(target, "CartService", { env: doubleEnv });
  await withServer({ targetRoot: target, env: doubleEnv }, async (client) => {
    const result = await client.callTool({
      name: "symbols",
      arguments: { name: "CartService" },
    });
    expect(result.isError).toBeUndefined();
    expect(structuredOf(result)).toEqual(direct);
    const labeled = structuredOf(result) as { trust: string; definitions: unknown[] };
    expect(labeled.trust).toBe("measured");
    expect(labeled.definitions.length).toBe(1);
  });

  // ctags is absent (PATH restricted to a bin holding only rg): the server
  // must still be serving, and the symbols call must come back as a tool
  // error naming ctags — never a substitute search.
  const noCtags = envWithoutCtags();
  if (noCtags === undefined) return;
  await withServer({ targetRoot: target, env: noCtags }, async (client) => {
    const rejected = await client.callTool({
      name: "symbols",
      arguments: { name: "CartService" },
    });
    expect(rejected.isError).toBe(true);
    const text = (rejected.content as Array<{ type: string; text: string }>).map((p) => p.text).join("\n");
    expect(text).toContain("ctags");
    expect(text).toContain("no results were gathered");

    // The server survived the missing-binary rejection.
    const alive = await client.callTool({ name: "manifests", arguments: { path: "package.json" } });
    expect(alive.isError).toBeUndefined();
  });
});

test("manifests through the server returns charted, anchored facts unchanged", async () => {
  const target = makeProvince();
  const direct = readManifest(target, "package.json");
  await withServer({ targetRoot: target }, async (client) => {
    // Called without naming any root: the operation runs against the
    // launched target's files (the server is bound to one province).
    const result = await client.callTool({ name: "manifests", arguments: { path: "package.json" } });
    expect(result.isError).toBeUndefined();
    expect(structuredOf(result)).toEqual(direct);

    const read = structuredOf(result) as {
      facts: Array<{ trust: string; anchor: { type: string } }>;
    };
    for (const fact of read.facts) {
      expect(fact.trust).toBe("charted");
      expect(fact.anchor.type).toBe("manifest");
    }

    // An unsupported kind is a structured report, not a guessed fact set.
    const unsupported = await client.callTool({
      name: "manifests",
      arguments: { path: "README.md" },
    });
    expect(unsupported.isError).toBeUndefined();
    const report = structuredOf(unsupported) as { supported: boolean; reason: string };
    expect(report.supported).toBe(false);
    expect(report.reason).toContain("unsupported manifest kind");
  });
});

test.skipIf(!rgPresent)("sound.anchor through the server: confirmed and refuted verdicts pass through", async () => {
  const target = makeProvince();
  const confirmed = soundAnchor(target, {
    anchor: { type: "file", path: "src/cart.ts", line: 4 },
    content: "export class CartService {",
  });
  const refuted = soundAnchor(target, { anchor: { type: "file", path: "src/ghost.ts", line: 1 } });
  await withServer({ targetRoot: target }, async (client) => {
    const ok = await client.callTool({
      name: "sound.anchor",
      arguments: {
        anchor: { type: "file", path: "src/cart.ts", line: 4 },
        content: "export class CartService {",
      },
    });
    expect(ok.isError).toBeUndefined();
    expect(structuredOf(ok)).toEqual(confirmed);
    expect((structuredOf(ok) as { verdict: string }).verdict).toBe("confirmed");

    const bad = await client.callTool({
      name: "sound.anchor",
      arguments: { anchor: { type: "file", path: "src/ghost.ts", line: 1 } },
    });
    expect(bad.isError).toBeUndefined();
    expect(structuredOf(bad)).toEqual(refuted);
    expect((structuredOf(bad) as { verdict: string }).verdict).toBe("refuted");

    // A dead receipt id is refuted with the cited id named.
    const dead = await client.callTool({
      name: "sound.anchor",
      arguments: { anchor: { type: "receipt", id: "r404" } },
    });
    const deadResult = structuredOf(dead) as { verdict: string; report: string };
    expect(deadResult.verdict).toBe("refuted");
    expect(deadResult.report).toContain("r404");
  });
});

test.skipIf(!rgPresent)("sound.edge through the server: manifest and reference confirmations, and honest unconfirmed", async () => {
  const target = makeProvince();
  const fairway = (from: string, to: string) => ({
    kind: "fairway" as const,
    id: `f-${from}-${to}`,
    from,
    to,
    anchors: [{ type: "manifest" as const, path: "package.json", key: "name" }],
    trust: "reported" as const,
  });
  const vessel = (id: string, name: string, paths: string[]) => ({
    kind: "vessel" as const,
    id,
    name,
    paths,
    anchors: [{ type: "file" as const, path: paths[0]!, line: 1 }],
    trust: "measured" as const,
  });

  const manifestCase = {
    fairway: fairway("v-ui", "v-react"),
    source: vessel("v-ui", "harbor-ui", ["."]),
    target: vessel("v-react", "react", ["."]),
  };
  const directManifest = soundEdge(target, manifestCase);
  const referenceCase = {
    fairway: fairway("v-checkout", "v-cart"),
    source: vessel("v-checkout", "checkout", ["src/checkout.ts"]),
    target: vessel("v-cart", "CartService", ["src/cart.ts"]),
  };
  const directReference = soundEdge(target, referenceCase);

  await withServer({ targetRoot: target }, async (client) => {
    const viaManifest = await client.callTool({ name: "sound.edge", arguments: manifestCase });
    expect(viaManifest.isError).toBeUndefined();
    expect(structuredOf(viaManifest)).toEqual(directManifest);
    const manifestResult = structuredOf(viaManifest) as {
      verdict: string;
      means: Array<{ means: string; found: boolean }>;
    };
    expect(manifestResult.verdict).toBe("confirmed");
    expect(manifestResult.means.find((m) => m.means === "manifest")?.found).toBe(true);

    const viaReferences = await client.callTool({ name: "sound.edge", arguments: referenceCase });
    expect(viaReferences.isError).toBeUndefined();
    expect(structuredOf(viaReferences)).toEqual(directReference);
    const referenceResult = structuredOf(viaReferences) as {
      verdict: string;
      means: Array<{ means: string; found: boolean }>;
    };
    expect(referenceResult.verdict).toBe("confirmed");
    expect(referenceResult.means.find((m) => m.means === "references")?.found).toBe(true);

    // Neither means finds support: unconfirmed reporting both negatives —
    // never a claim that the fairway is absent.
    const unconfirmedCase = {
      fairway: fairway("v-checkout", "v-ghost"),
      source: vessel("v-checkout", "checkout", ["src/checkout.ts"]),
      target: vessel("v-ghost", "NoSuchVesselAnywhere", ["src/cart.ts"]),
    };
    const unconfirmed = await client.callTool({
      name: "sound.edge",
      arguments: unconfirmedCase,
    });
    const unconfirmedResult = structuredOf(unconfirmed) as {
      verdict: string;
      report: string;
      means: Array<{ means: string; found: boolean; report: string }>;
    };
    expect(unconfirmedResult.verdict).toBe("unconfirmed");
    expect(unconfirmedResult.report).toContain("unconfirmed is not refutation");
    expect(unconfirmedResult.means.every((m) => !m.found)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tasks.md 2.4: the province binding. A call carrying a foreign target root
// is refused with an error naming the launched target; echoing the launched
// root passes. Enforced once at the handler boundary, for every tool.
// ---------------------------------------------------------------------------

test("a tool call cannot redirect the target: foreign roots are refused naming the launched province", async () => {
  const target = makeProvince();
  const elsewhere = makeProvince();
  await withServer({ targetRoot: target }, async (client) => {
    // manifests, a call that normally needs no root at all:
    const refused = await client.callTool({
      name: "manifests",
      arguments: { path: "package.json", targetRoot: elsewhere },
    });
    expect(refused.isError).toBe(true);
    const message = errorTextOf(refused);
    expect(message).toContain(target);
    expect(message).toContain(elsewhere);
    expect(message).toContain("launching a new server");

    // The same refusal for a second tool proves the guard is boundary-level,
    // not wired per tool.
    const alsoRefused = await client.callTool({
      name: "sweep",
      arguments: { pattern: "CartService", targetRoot: elsewhere },
    });
    expect(alsoRefused.isError).toBe(true);
    expect(errorTextOf(alsoRefused)).toContain(target);

    // Echoing the launched root is not a redirect and passes.
    const echo = await client.callTool({
      name: "manifests",
      arguments: { path: "package.json", targetRoot: target },
    });
    expect(echo.isError).toBeUndefined();
    expect(structuredOf(echo)).toEqual(readManifest(target, "package.json"));

    // The refused calls did not touch the other province: its chart is absent.
    expect(existsSync(join(elsewhere, ".portolan"))).toBe(false);
  });
});
