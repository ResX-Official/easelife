import test from "node:test";
import assert from "node:assert/strict";
import { databaseTest, testDatabase } from "./database.mjs";
import { clientIdentity, consumeRateLimit } from "../lib/rate-limit.ts";

test("client identity ignores untrusted forwarding headers", () => {
  const headers = new Headers({ "x-forwarded-for": "192.0.2.1", "x-real-ip": "192.0.2.2" });
  assert.equal(clientIdentity(headers), "shared");
  assert.equal(clientIdentity(headers, "x-real-ip"), "192.0.2.2");
  headers.set("x-real-ip", "192.0.2.2, 198.51.100.1");
  assert.equal(clientIdentity(headers, "x-real-ip"), "shared");
});

test("database limits are atomic, isolate callers, expire, and avoid storing raw identities", databaseTest, async () => {
  const { db, close } = await testDatabase();
  try {
    const results = await Promise.all(Array.from({ length: 20 }, () => consumeRateLimit(db, "login", "192.0.2.1", 5, 60, 100)));
    assert.equal(results.filter(result => result.allowed).length, 5);
    assert.equal(results[0].retryAfter, 20);
    assert.equal((await consumeRateLimit(db, "login", "192.0.2.2", 5, 60, 100)).allowed, true);
    assert.equal((await consumeRateLimit(db, "enquiry", "192.0.2.1", 5, 60, 100)).allowed, true);
    assert.equal((await consumeRateLimit(db, "login", "192.0.2.1", 5, 60, 120)).allowed, true);
    const rows = await db.$queryRawUnsafe('SELECT * FROM "easelife"."RequestLimit"');
    assert.equal(rows.length, 1);
    assert.ok(rows.every(row => !row.key.includes("192.0.2.1")));
  } finally {
    await close();
  }
});

test("owner access rejects another listing's token and protects updates", databaseTest, async () => {
  const { findOwnedListing, updateOwnedListing, deleteOwnedListing } = await import("../lib/listing-access.ts");
  const { db, close } = await testDatabase();
  try {
    const values = { title: "Owner's home", description: "Test", price: 100, propertyType: "Apartment", bedrooms: 2, bathrooms: 1, city: "Lagos", state: "Lagos", address: "Test", landlordName: "Owner", landlordEmail: "owner@example.test", landlordPhone: "08000000000" };
    const first = await db.listing.create({ data: values });
    const second = await db.listing.create({ data: values });
    assert.equal(await findOwnedListing(db, first.id, second.managementToken), null);
    assert.equal(await findOwnedListing(db, first.id, ""), null);
    assert.equal((await findOwnedListing(db, first.id, first.managementToken)).id, first.id);
    await assert.rejects(updateOwnedListing(db, first.id, second.managementToken, { title: "Unauthorized" }, []));
    assert.equal((await db.listing.findUniqueOrThrow({ where: { id: first.id } })).title, values.title);
    await updateOwnedListing(db, first.id, first.managementToken, { title: "Updated" }, ["/uploads/test.webp"]);
    assert.equal((await db.listing.findUniqueOrThrow({ where: { id: first.id } })).title, "Updated");
    await assert.rejects(updateOwnedListing(db, first.id, first.managementToken, {}, Array(15).fill("/uploads/extra.webp")));
    assert.equal(await db.photo.count({ where: { listingId: first.id } }), 1);
    await assert.rejects(deleteOwnedListing(db, first.id, second.managementToken));
    assert.equal(await db.listing.count(), 2);
    assert.deepEqual(await deleteOwnedListing(db, first.id, first.managementToken), ["/uploads/test.webp"]);
    assert.equal(await db.photo.count(), 0);
    assert.equal(await db.listing.count(), 1);
  } finally {
    await close();
  }
});

test("server failure refunds only its original rate-limit window", databaseTest, async () => {
  const { releaseRateLimit } = await import("../lib/rate-limit.ts");
  const { db, close } = await testDatabase();
  try {
    const first = await consumeRateLimit(db, "photo-upload", "192.0.2.1", 1, 60, 100);
    assert.equal((await consumeRateLimit(db, "photo-upload", "192.0.2.1", 1, 60, 100)).allowed, false);
    await releaseRateLimit(db, first.key);
    assert.equal((await consumeRateLimit(db, "photo-upload", "192.0.2.1", 1, 60, 100)).allowed, true);
    const next = await consumeRateLimit(db, "photo-upload", "192.0.2.1", 1, 60, 120);
    await releaseRateLimit(db, first.key);
    assert.equal((await consumeRateLimit(db, "photo-upload", "192.0.2.1", 1, 60, 120)).allowed, false);
    assert.notEqual(first.key, next.key);
  } finally { await close(); }
});
