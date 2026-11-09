import test from "node:test";
import assert from "node:assert/strict";
import { createPhotoTicket, verifyPhotoTickets } from "../lib/photo-tickets.ts";
import { claimPhotos } from "../lib/claim-photos.ts";
import { databaseTest, testDatabase } from "./database.mjs";

const secret = "photo-ticket-test-secret";

test("photo tickets reject tampering, expiry, duplicate photos, and excess counts", () => {
  const ticket = createPhotoTicket("/uploads/test.webp", secret, 1000);
  assert.deepEqual(verifyPhotoTickets(JSON.stringify([ticket]), secret, 1100), [ticket]);
  for (const tickets of [[{ ...ticket, url: "/uploads/other.webp" }], [{ ...ticket, expiresAt: 9000 }], [ticket, ticket], Array(16).fill(ticket)]) assert.throws(() => verifyPhotoTickets(JSON.stringify(tickets), secret, 1100));
  assert.throws(() => verifyPhotoTickets(JSON.stringify([ticket]), secret, 4600));
  assert.throws(() => verifyPhotoTickets(JSON.stringify([ticket]), "wrong-secret", 1100));
  assert.throws(() => verifyPhotoTickets("not JSON", secret));
});

test("claiming 15 staged photos is atomic and cannot be replayed", databaseTest, async () => {
  const { db, close } = await testDatabase();
  try {
    const tickets = Array.from({ length: 15 }, (_, index) => createPhotoTicket(`/uploads/photo-${index}.webp`, secret));
    await db.storedPhoto.createMany({ data: tickets.map(ticket => ({ filename: ticket.url.split("/").pop(), size: 600000, status: "staged" })) });
    const claims = await Promise.allSettled([db.$transaction(tx => claimPhotos(tx, tickets)), db.$transaction(tx => claimPhotos(tx, tickets))]);
    assert.equal(claims.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(claims.find(result => result.status === "fulfilled").value.length, 15);
    assert.equal(await db.storedPhoto.count({ where: { status: "ready" } }), 15);
  } finally { await close(); }
});

test("failed listing transactions leave staged photos available for retry", databaseTest, async () => {
  const { db, close } = await testDatabase();
  try {
    const ticket = createPhotoTicket("/uploads/retry.webp", secret);
    await db.storedPhoto.create({ data: { filename: "retry.webp", size: 100, status: "staged" } });
    await assert.rejects(db.$transaction(async tx => { await claimPhotos(tx, [ticket]); throw new Error("Database write failed"); }));
    assert.equal((await db.storedPhoto.findUniqueOrThrow({ where: { filename: "retry.webp" } })).status, "staged");
    await db.$transaction(tx => claimPhotos(tx, [ticket]));
    assert.equal((await db.storedPhoto.findUniqueOrThrow({ where: { filename: "retry.webp" } })).status, "ready");
  } finally { await close(); }
});
