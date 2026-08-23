import { test, expect } from "bun:test";
import Ajv2020 from "ajv/dist/2020";
import schema from "../schema/chart.schema.json";

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile(schema);

const file = (path: string, line?: number) =>
  line === undefined ? { type: "file", path } : { type: "file", path, line };

const goodFixtures: Record<string, Record<string, unknown>> = {
  vessel: {
    kind: "vessel",
    id: "web",
    name: "Web frontend",
    behavior: "Serves the SPA and the JSON API.",
    paths: ["services/web"],
    anchors: [file("services/web/main.ts", 1)],
    trust: "charted",
  },
  fairway: {
    kind: "fairway",
    id: "f-web-db",
    from: "web",
    to: "db",
    anchors: [file("services/web/db.ts", 7)],
    trust: "measured",
  },
  portOfEntry: {
    kind: "portOfEntry",
    id: "p-upload",
    vessel: "web",
    protocol: "http",
    note: "POST /upload",
    anchors: [file("services/web/server.ts", 12)],
    trust: "measured",
  },
  beacon: {
    kind: "beacon",
    id: "b-port",
    vessel: "web",
    surface: "env",
    key: "PORT",
    anchors: [{ type: "manifest", path: "deploy/values.yaml", key: "env.PORT" }],
    trust: "charted",
  },
  light: {
    kind: "light",
    id: "l-users",
    vessel: "web",
    name: "GET /api/users",
    anchors: [file("services/web/router.ts", 42)],
    trust: "measured",
  },
  danger: {
    kind: "danger",
    id: "d-dup",
    vessel: "web",
    category: "wreck",
    note: "Duplicated JSON parsing in two handlers.",
    anchors: [file("services/web/util.ts", 10)],
    trust: "measured",
  },
};

test("schema accepts a well-formed entry of every kind", () => {
  for (const [kind, entry] of Object.entries(goodFixtures)) {
    const ok = validate(entry);
    expect(`${kind}: ${JSON.stringify(validate.errors)}`).toBe(`${kind}: null`);
    expect(ok).toBe(true);
  }
});

test("schema accepts all five trust labels", () => {
  for (const trust of ["measured", "charted", "reported", "doubtful", "unsurveyed"]) {
    expect(validate({ ...goodFixtures.vessel, trust })).toBe(true);
  }
});

test("schema accepts all three anchor types", () => {
  const anchors = [
    file("a.ts", 3),
    { type: "manifest", path: "package.json", key: "dependencies.ajv" },
    { type: "receipt", id: "run-001" },
  ];
  expect(validate({ ...goodFixtures.vessel, anchors })).toBe(true);
});

test("schema rejects an entry without anchors", () => {
  const { anchors: _anchors, ...rest } = goodFixtures.vessel as Record<string, unknown>;
  expect(validate(rest)).toBe(false);
});

test("schema rejects an entry with an empty anchors array", () => {
  expect(validate({ ...goodFixtures.vessel, anchors: [] })).toBe(false);
});

test("schema rejects a trust label outside the five-value vocabulary", () => {
  expect(validate({ ...goodFixtures.vessel, trust: "guessed" })).toBe(false);
});

test("schema rejects a missing required field", () => {
  const { to: _to, ...fairway } = goodFixtures.fairway as Record<string, unknown>;
  expect(validate(fairway)).toBe(false);
});

test("schema rejects an unknown property", () => {
  expect(validate({ ...goodFixtures.vessel, vibes: "good" })).toBe(false);
});

test("schema rejects an unknown kind", () => {
  expect(validate({ ...goodFixtures.vessel, kind: "lighthouse" })).toBe(false);
});

test("schema rejects a malformed anchor", () => {
  expect(
    validate({ ...goodFixtures.vessel, anchors: [{ type: "file", path: "" }] })
  ).toBe(false);
  expect(
    validate({ ...goodFixtures.vessel, anchors: [{ type: "vibe", target: "gut" }] })
  ).toBe(false);
});
