import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { clientIdentity, consumeRateLimit } from "../lib/rate-limit.ts";

function database() {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: "file::memory:" }) });
}

test("client identity ignores untrusted forwarding headers", () => {
  const headers = new Headers({ "x-forwarded-for": "192.0.2.1", "x-real-ip": "192.0.2.2" });
  assert.equal(clientIdentity(headers), "shared");
  assert.equal(clientIdentity(headers, "x-real-ip"), "192.0.2.2");
  headers.set("x-real-ip", "192.0.2.2, 198.51.100.1");
  assert.equal(clientIdentity(headers, "x-real-ip"), "shared");
});

test("database limits are atomic, isolate callers, expire, and avoid storing raw identities", async () => {
  const db = database();
  try {
    await db.$executeRawUnsafe('CREATE TABLE "RequestLimit" ("key" TEXT PRIMARY KEY, "count" INTEGER NOT NULL, "expiresAt" INTEGER NOT NULL)');
    const results = await Promise.all(Array.from({ length: 20 }, () => consumeRateLimit(db, "login", "192.0.2.1", 5, 60, 100)));
    assert.equal(results.filter(result => result.allowed).length, 5);
    assert.equal(results[0].retryAfter, 20);
    assert.equal((await consumeRateLimit(db, "login", "192.0.2.2", 5, 60, 100)).allowed, true);
    assert.equal((await consumeRateLimit(db, "enquiry", "192.0.2.1", 5, 60, 100)).allowed, true);
    assert.equal((await consumeRateLimit(db, "login", "192.0.2.1", 5, 60, 120)).allowed, true);
    const rows = await db.$queryRawUnsafe('SELECT * FROM "RequestLimit"');
    assert.equal(rows.length, 1);
    assert.ok(rows.every(row => !row.key.includes("192.0.2.1")));
  } finally {
    await db.$disconnect();
  }
});

test("owner access rejects another listing's token and protects updates", async () => {
  const { findOwnedListing, updateOwnedListing, deleteOwnedListing } = await import("../lib/listing-access.ts");
  const db = database();
  try {
    await db.$executeRawUnsafe('CREATE TABLE "Listing" ("id" TEXT PRIMARY KEY, "managementToken" TEXT UNIQUE NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "price" REAL NOT NULL, "currency" TEXT NOT NULL, "paymentFrequency" TEXT NOT NULL, "listingCategory" TEXT NOT NULL, "isDemo" BOOLEAN NOT NULL, "maxGuests" INTEGER NOT NULL, "vibe" TEXT NOT NULL, "propertyType" TEXT NOT NULL, "bedrooms" INTEGER NOT NULL, "bathrooms" INTEGER NOT NULL, "city" TEXT NOT NULL, "state" TEXT NOT NULL, "address" TEXT NOT NULL, "landlordName" TEXT NOT NULL, "landlordEmail" TEXT NOT NULL, "landlordPhone" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)');
    await db.$executeRawUnsafe('CREATE TABLE "Photo" ("id" TEXT PRIMARY KEY, "url" TEXT NOT NULL, "order" INTEGER NOT NULL, "listingId" TEXT NOT NULL REFERENCES "Listing"("id") ON DELETE CASCADE)');
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
    await db.$disconnect();
  }
});
