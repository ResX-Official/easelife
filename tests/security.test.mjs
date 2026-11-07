import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { hasMatchingOrigin } from "../lib/request-origin.ts";
import { signSession, verifySession, safeEqual } from "../lib/admin-session.ts";
import { validateListingFields, validateMessage } from "../lib/listing-validation.ts";
import { preparePhotos, uploadFilename, MAX_PHOTO_BYTES } from "../lib/photo-storage.ts";

const secret = "test-secret-only-not-a-real-password";

function listing(overrides = {}) {
  const data = new FormData();
  const values = { title: "Test home", description: "A home for testing.", price: "120000", currency: "NGN", paymentFrequency: "daily", listingCategory: "staycation", maxGuests: "4", vibe: "calm", propertyType: "Apartment", bedrooms: "2", bathrooms: "2", city: "Lagos", state: "Lagos", address: "Test address", landlordName: "Test owner", landlordEmail: "owner@example.test", landlordPhone: "+2348000000000", ...overrides };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("admin sessions reject forgery, expiry, malformed tokens, and password changes", () => {
  const token = signSession(2000, secret);
  assert.equal(verifySession(token, secret, 1000), true);
  assert.equal(verifySession(token, secret, 2000), false);
  assert.equal(verifySession(token, "changed-password", 1000), false);
  assert.equal(verifySession(token.replace("2000", "9000"), secret, 1000), false);
  for (const value of ["", "2000", "2000.bad", `${token}.extra`, "x".repeat(1000)]) assert.equal(verifySession(value, secret, 1000), false);
  assert.equal(verifySession(token, "", 1000), false);
  assert.equal(safeEqual("same", "same"), true);
  assert.equal(safeEqual("short", "a longer value"), false);
});

test("listing validation rejects invalid enums, missing numbers, oversized text, and fractional rooms", () => {
  assert.ok(validateListingFields(listing()).fields);
  for (const overrides of [{ currency: "FAKE" }, { propertyType: "Unknown" }, { listingCategory: "invalid" }, { paymentFrequency: "weekly" }, { price: "Infinity" }, { price: "" }, { bedrooms: "1.5" }, { bathrooms: "" }, { maxGuests: "101" }, { title: "x".repeat(151) }, { description: "x".repeat(10001) }, { landlordEmail: "not-an-email" }, { landlordPhone: "123" }]) assert.ok(validateListingFields(listing(overrides)).error, JSON.stringify(overrides).slice(0, 100));
});

test("enquiry validation bounds messages and contact details", () => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ senderName: "Guest", senderEmail: "guest@example.test", senderPhone: "08000000000", body: "Is this available?" })) data.set(key, value);
  assert.ok(validateMessage(data).fields);
  data.set("body", "x".repeat(5001));
  assert.ok(validateMessage(data).error);
  data.set("body", "Hello");
  data.set("senderPhone", "not a phone number");
  assert.ok(validateMessage(data).error);
});

test("photos are decoded, resized, and stored as WebP regardless of claimed MIME", async () => {
  const png = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: "red" } }).png().toBuffer();
  const [result] = await preparePhotos([new File([png], "wrong.txt", { type: "text/plain" })]);
  const metadata = await sharp(result).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 1920);
  assert.equal(metadata.height, 960);
  assert.equal(metadata.exif, undefined);
});

test("photos reject fake images, SVG, corrupt data, large files, and excess counts", async () => {
  for (const value of ["not an image", '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>']) await assert.rejects(preparePhotos([new File([value], "fake.png", { type: "image/png" })]));
  await assert.rejects(preparePhotos([new File([new Uint8Array(MAX_PHOTO_BYTES + 1)], "large.png")]));
  await assert.rejects(preparePhotos([new File(["x"], "photo.png")], 15));
  const large = await sharp({ create: { width: 5000, height: 5000, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(preparePhotos([new File([large], "huge.png")]));
});

test("photo paths reject traversal and external URLs", () => {
  assert.equal(uploadFilename("/uploads/test.webp"), "test.webp");
  for (const url of ["/uploads/../keep.txt", "https://example.test/photo.png", "/uploads/folder/photo.webp", "/uploads/%2e%2e.webp"]) assert.equal(uploadFilename(url), undefined);
});

test("origin checks use the incoming host when Next.js has an internal request URL", () => {
  const request = (origin) => new Request("http://localhost:3011/api/visit", { headers: { host: "127.0.0.1:3011", origin } });
  assert.equal(hasMatchingOrigin(request("http://127.0.0.1:3011")), true);
  assert.equal(hasMatchingOrigin(request("http://other.example")), false);
  assert.equal(hasMatchingOrigin(request("invalid")), false);
  assert.equal(hasMatchingOrigin(new Request("http://localhost/api/visit")), true);
});

test("Supabase connections always verify the bundled CA and reject disabled TLS", async () => {
  const { databaseConnectionOptions } = await import("../lib/database-ssl.ts");
  const options = databaseConnectionOptions("postgresql://user:password@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=disable&sslrootcert=/untrusted.crt");
  assert.equal(options.ssl.rejectUnauthorized, true);
  assert.match(options.ssl.ca, /BEGIN CERTIFICATE/);
  assert.equal(new URL(options.connectionString).searchParams.has("sslmode"), false);
  assert.equal(new URL(options.connectionString).searchParams.has("sslrootcert"), false);
  assert.deepEqual(databaseConnectionOptions("postgresql://localhost/test"), { connectionString: "postgresql://localhost/test" });
});
