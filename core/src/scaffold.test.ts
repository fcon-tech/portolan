import { test, expect } from "bun:test";
import Ajv2020 from "ajv/dist/2020";

test("bun test harness runs in @portolan/core", () => {
  expect(1 + 1).toBe(2);
});

test("ajv compiles and applies a trivial draft 2020-12 schema", () => {
  const ajv = new Ajv2020();
  const validate = ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: { sound: { type: "boolean" } },
    required: ["sound"],
    additionalProperties: false,
  });
  expect(validate({ sound: true })).toBe(true);
  expect(validate({ sound: "yes" })).toBe(false);
  expect(validate({})).toBe(false);
});
