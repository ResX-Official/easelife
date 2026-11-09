import test from "node:test";
import assert from "node:assert/strict";
import { databaseTest, testDatabase } from "./database.mjs";
import { deleteOwnedListing, deleteListingsWithPhotos } from "../lib/listing-access.ts";

async function listing(db) {
  const record = await db.listing.create({ data: {
    title: "Delete test", description: "Temporary test", price: 100, propertyType: "Apartment", bedrooms: 2, bathrooms: 1,
    city: "Lagos", state: "Lagos", address: "Test", landlordName: "Owner", landlordEmail: "owner@example.test", landlordPhone: "08000000000",
    photos: { create: { url: "/uploads/delete-test.webp", order: 0 } },
    messages: { create: { senderName: "Guest", senderEmail: "guest@example.test", body: "Test enquiry" } },
  } });
  await db.storedPhoto.create({ data: { filename: "delete-test.webp", size: 100, status: "ready" } });
  return record;
}

test("deletion is safe to repeat and queues cleanup before releasing the listing", databaseTest, async () => {
  const { db, close } = await testDatabase();
  try {
    const record = await listing(db);
    await assert.rejects(deleteOwnedListing(db, record.id, "wrong-token"));
    assert.equal((await db.storedPhoto.findUniqueOrThrow({ where: { filename: "delete-test.webp" } })).status, "ready");
    const results = await Promise.all([deleteOwnedListing(db, record.id, record.managementToken), deleteOwnedListing(db, record.id, record.managementToken)]);
    assert.equal(results.flat().length, 1);
    assert.equal(await db.listing.count(), 0);
    assert.equal(await db.photo.count(), 0);
    assert.equal(await db.message.count(), 0);
    const photo = await db.storedPhoto.findUniqueOrThrow({ where: { filename: "delete-test.webp" } });
    assert.equal(photo.status, "deleting");
    assert.equal(photo.size, 100);
    assert.deepEqual(await deleteOwnedListing(db, record.id, record.managementToken), []);
  } finally { await close(); }
});

test("failed database deletion rolls back the cleanup queue as well", databaseTest, async () => {
  const { db, close } = await testDatabase();
  try {
    const record = await listing(db);
    await db.$executeRawUnsafe(`CREATE FUNCTION easelife.reject_test_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Simulated delete failure'; END; $$`);
    await db.$executeRawUnsafe('CREATE TRIGGER reject_test_delete BEFORE DELETE ON "easelife"."Listing" FOR EACH ROW EXECUTE FUNCTION easelife.reject_test_delete()');
    await assert.rejects(deleteOwnedListing(db, record.id, record.managementToken));
    assert.equal(await db.listing.count(), 1);
    assert.equal(await db.photo.count(), 1);
    assert.equal(await db.message.count(), 1);
    assert.equal((await db.storedPhoto.findUniqueOrThrow({ where: { filename: "delete-test.webp" } })).status, "ready");
  } finally { await close(); }
});

test("admin deletion queues photo cleanup and supports a repeat request", databaseTest, async () => {
  const { db, close } = await testDatabase();
  try {
    const record = await listing(db);
    assert.deepEqual(await deleteListingsWithPhotos(db, { id: record.id }), ["/uploads/delete-test.webp"]);
    assert.equal((await db.storedPhoto.findUniqueOrThrow({ where: { filename: "delete-test.webp" } })).status, "deleting");
    assert.deepEqual(await deleteListingsWithPhotos(db, { id: record.id }), []);
    assert.equal(await db.listing.count(), 0);
  } finally { await close(); }
});
