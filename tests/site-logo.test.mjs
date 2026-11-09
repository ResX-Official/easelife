import test from "node:test";
import assert from "node:assert/strict";
import { loadSiteLogo } from "../lib/site-logo.ts";

test("site logo lookup falls back to the name when the database is unavailable", async () => {
  assert.equal(await loadSiteLogo({ siteSetting: { findUnique: async () => { throw new Error("Database unavailable"); } } }), null);
});

test("site logo lookup preserves an existing logo and handles an unset logo", async () => {
  assert.equal(await loadSiteLogo({ siteSetting: { findUnique: async () => ({ value: "/uploads/logo.webp" }) } }), "/uploads/logo.webp");
  assert.equal(await loadSiteLogo({ siteSetting: { findUnique: async () => null } }), null);
});
