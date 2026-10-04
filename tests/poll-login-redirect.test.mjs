import assert from "node:assert/strict";
import { test } from "node:test";
import { getPollLoginRedirect } from "../src/lib/poll-login-redirect.ts";

test("returns to the shared poll after signing in", () => {
  const path = "/votaciones/12345678-1234-1234-1234-123456789abc";
  assert.equal(getPollLoginRedirect(path), path);
});

test("rejects external, malformed and unrelated redirect destinations", () => {
  for (const value of [
    null,
    undefined,
    "",
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/parking",
    "/votaciones/invalid",
    "/votaciones/12345678-1234-1234-1234-123456789abc?next=https://example.com",
    "/votaciones/12345678-1234-1234-1234-123456789abc\n",
  ]) {
    assert.equal(getPollLoginRedirect(value), "/", String(value));
  }
});
