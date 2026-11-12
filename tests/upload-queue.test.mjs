import test from "node:test";
import assert from "node:assert/strict";
import { createPhotoUploadQueue } from "../lib/upload-queue.ts";

const ticket = index => ({ url: `/uploads/${index}.webp`, expiresAt: Math.floor(Date.now() / 1000) + 3600, signature: "test" });

test("photo uploads run concurrently within a fixed limit and reuse completed work", async () => {
  let active = 0;
  let peak = 0;
  let calls = 0;
  const queue = createPhotoUploadQueue(async file => {
    calls++;
    peak = Math.max(peak, ++active);
    await new Promise(resolve => setTimeout(resolve, 5));
    active--;
    return ticket(file.name);
  }, 3);
  const files = Array.from({ length: 15 }, (_, index) => new File(["photo"], String(index)));
  const results = await Promise.all(files.map(file => queue.get(file)));
  assert.equal(results.length, 15);
  assert.equal(peak, 3);
  assert.equal(calls, 15);
  await Promise.all(files.map(file => queue.get(file)));
  assert.equal(calls, 15);
});

test("pending uploads are shared and failed photos can be retried", async () => {
  let calls = 0;
  const queue = createPhotoUploadQueue(async () => {
    if (++calls === 1) throw new Error("Temporary failure");
    return ticket("retry");
  });
  const file = new File(["photo"], "retry");
  const failed = await Promise.allSettled([queue.get(file), queue.get(file)]);
  assert.ok(failed.every(result => result.status === "rejected"));
  assert.equal(calls, 1);
  await queue.get(file);
  assert.equal(calls, 2);
});

test("a rate-limited upload stops queued photos without discarding completed work", async context => {
  let now = Date.now();
  context.mock.method(Date, "now", () => now);
  const { PhotoUploadError } = await import("../lib/upload-queue.ts");
  let calls = 0;
  const queue = createPhotoUploadQueue(async file => {
    calls++;
    if (file.name === "limited") throw new PhotoUploadError("Wait before retrying", 60);
    return ticket(file.name);
  }, 1);
  const saved = new File(["photo"], "saved");
  await queue.get(saved);
  const files = [new File(["photo"], "limited"), ...Array.from({ length: 14 }, (_, i) => new File(["photo"], `waiting-${i}`))];
  const results = await Promise.allSettled(files.map(file => queue.get(file)));
  assert.ok(results.every(result => result.status === "rejected"));
  assert.equal(calls, 2);
  await queue.get(saved);
  await assert.rejects(queue.get(files[1]), /Wait before retrying/);
  assert.equal(calls, 2);
  now += 61000;
  await queue.get(files[1]);
  assert.equal(calls, 3);
});
