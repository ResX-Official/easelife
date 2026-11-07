import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { createDatabaseClient } from "../lib/database.ts";

export const databaseTest = { skip: process.env.TEST_DATABASE_URL ? false : "Set TEST_DATABASE_URL to run PostgreSQL integration tests." };

export async function testDatabase() {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (!connectionString) throw new Error("TEST_DATABASE_URL is required.");
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  const name = `easelife_test_${randomUUID().replaceAll("-", "")}`;
  await admin.query(`CREATE DATABASE "${name}"`);
  const url = new URL(connectionString);
  url.pathname = `/${name}`;
  const setup = new pg.Client({ connectionString: url.toString() });
  await setup.connect();
  try {
    const migration = await readFile(new URL("../prisma/migrations/20261106020000_postgres/migration.sql", import.meta.url), "utf8");
    await setup.query(migration);
  } finally {
    await setup.end();
  }
  const db = createDatabaseClient(url.toString());
  return {
    db,
    async close() {
      await db.$disconnect();
      await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
      await admin.end();
    },
  };
}
