import test from "node:test";
import assert from "node:assert/strict";
import { databaseTest, testDatabase } from "./database.mjs";
import { savePhotoObjects, deletePhotoObjects, cleanupPendingPhotos } from "../lib/photo-objects.ts";

function storage({ failUpload = 0, failRemove = false } = {}) {
  const objects = new Map();
  let uploads = 0;
  return {
    objects,
    async upload(name, buffer) {
      if (++uploads === failUpload) return { error: new Error("upload failed") };
      objects.set(name, buffer);
      return { error: null };
    },
    async remove(names) {
      if (failRemove) return { error: new Error("remove failed") };
      for (const name of names) objects.delete(name);
      return { error: null };
    },
  };
}

test("concurrent uploads reserve quota atomically before storage writes", databaseTest, async () => {
  const { db, close } = await testDatabase();
  const bucket = storage();
  try {
    const results = await Promise.allSettled(Array.from({ length: 6 }, () => savePhotoObjects(db, bucket, [Buffer.alloc(6)], 10)));
    assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
    assert.equal((await db.storedPhoto.aggregate({ _sum: { size: true } }))._sum.size, 6);
    assert.equal(bucket.objects.size, 1);
    const url = results.find(result => result.status === "fulfilled").value[0];
    await deletePhotoObjects(db, bucket, [url, "https://example.test/photo.webp", "/uploads/../bad"]);
    assert.equal(await db.storedPhoto.count(), 0);
    assert.equal(bucket.objects.size, 0);
  } finally {
    await close();
  }
});

test("failed uploads remove earlier objects and release their quota", databaseTest, async () => {
  const { db, close } = await testDatabase();
  const bucket = storage({ failUpload: 2 });
  try {
    await assert.rejects(savePhotoObjects(db, bucket, [Buffer.alloc(4), Buffer.alloc(4)], 10));
    assert.equal(bucket.objects.size, 0);
    assert.equal(await db.storedPhoto.count(), 0);
  } finally {
    await close();
  }
});

test("failed cleanup retains quota and a later request retries stale reservations", databaseTest, async () => {
  const { db, close } = await testDatabase();
  const failed = storage({ failUpload: 1, failRemove: true });
  const healthy = storage();
  try {
    await assert.rejects(savePhotoObjects(db, failed, [Buffer.alloc(4)], 10));
    assert.equal(await db.storedPhoto.count(), 1);
    await db.storedPhoto.updateMany({ data: { createdAt: new Date(Date.now() - 7200000) } });
    await cleanupPendingPhotos(db, healthy);
    assert.equal(await db.storedPhoto.count(), 0);
  } finally {
    await close();
  }
});

test("application tables use a private schema with row-level security enabled", databaseTest, async () => {
  const { db, close } = await testDatabase();
  try {
    const rows = await db.$queryRawUnsafe("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'easelife'");
    assert.ok(rows.length >= 10);
    assert.ok(rows.every(row => row.rowsecurity));
    const grants = await db.$queryRawUnsafe("SELECT privilege_type FROM information_schema.usage_privileges WHERE object_schema = 'easelife' AND grantee = 'PUBLIC'");
    assert.deepEqual(grants, []);
  } finally {
    await close();
  }
});

test("failed deletion is kept for retry without freeing storage too early", databaseTest, async () => {
  const { db, close } = await testDatabase();
  const bucket = storage();
  try {
    const urls = await savePhotoObjects(db, bucket, [Buffer.alloc(4)], 10);
    const unavailable = { ...bucket, async remove() { return { error: new Error("unavailable") }; } };
    await assert.rejects(deletePhotoObjects(db, unavailable, urls));
    assert.equal((await db.storedPhoto.findFirstOrThrow()).status, "deleting");
    assert.equal(bucket.objects.size, 1);
    await cleanupPendingPhotos(db, bucket);
    assert.equal(bucket.objects.size, 0);
    assert.equal(await db.storedPhoto.count(), 0);
  } finally {
    await close();
  }
});
