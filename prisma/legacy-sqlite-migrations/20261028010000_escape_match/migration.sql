ALTER TABLE "Listing" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN "maxGuests" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Listing" ADD COLUMN "vibe" TEXT NOT NULL DEFAULT 'calm';
CREATE TABLE "EscapeRoom" (
  "id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "hostHash" TEXT NOT NULL,
  "location" TEXT NOT NULL DEFAULT '', "vibe" TEXT NOT NULL DEFAULT 'any',
  "currency" TEXT NOT NULL DEFAULT 'NGN', "budget" REAL, "groupSize" INTEGER NOT NULL,
  "nights" INTEGER NOT NULL DEFAULT 1, "startDate" TEXT, "status" TEXT NOT NULL DEFAULT 'voting',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "EscapeOption" (
  "id" TEXT NOT NULL PRIMARY KEY, "roomId" TEXT NOT NULL, "listingId" TEXT NOT NULL,
  CONSTRAINT "EscapeOption_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "EscapeRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EscapeOption_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EscapeOption_roomId_listingId_key" ON "EscapeOption"("roomId", "listingId");
CREATE TABLE "EscapeMember" (
  "id" TEXT NOT NULL PRIMARY KEY, "roomId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EscapeMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "EscapeRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EscapeMember_tokenHash_key" ON "EscapeMember"("tokenHash");
CREATE INDEX "EscapeMember_roomId_idx" ON "EscapeMember"("roomId");
CREATE TABLE "EscapeVote" (
  "id" TEXT NOT NULL PRIMARY KEY, "memberId" TEXT NOT NULL, "optionId" TEXT NOT NULL, "value" INTEGER NOT NULL,
  CONSTRAINT "EscapeVote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "EscapeMember"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EscapeVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "EscapeOption"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EscapeVote_memberId_optionId_key" ON "EscapeVote"("memberId", "optionId");
