CREATE TABLE "RequestLimit" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" INTEGER NOT NULL
);
CREATE INDEX "RequestLimit_expiresAt_idx" ON "RequestLimit"("expiresAt");
