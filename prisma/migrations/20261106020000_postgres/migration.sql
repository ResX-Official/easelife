CREATE SCHEMA IF NOT EXISTS "easelife";

CREATE TABLE "easelife"."Listing" (
    "id" TEXT NOT NULL,
    "managementToken" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentFrequency" TEXT NOT NULL DEFAULT 'monthly',
    "listingCategory" TEXT NOT NULL DEFAULT 'rent',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "maxGuests" INTEGER NOT NULL DEFAULT 2,
    "vibe" TEXT NOT NULL DEFAULT 'calm',
    "propertyType" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "landlordName" TEXT NOT NULL,
    "landlordEmail" TEXT NOT NULL,
    "landlordPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "easelife"."Photo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "easelife"."Message" (
    "id" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "senderPhone" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "easelife"."VisitorEvent" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "easelife"."SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "easelife"."EscapeRoom" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hostHash" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "vibe" TEXT NOT NULL DEFAULT 'any',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "budget" DOUBLE PRECISION,
    "groupSize" INTEGER NOT NULL,
    "nights" INTEGER NOT NULL DEFAULT 1,
    "startDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'voting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscapeRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "easelife"."EscapeOption" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "EscapeOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "easelife"."EscapeMember" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscapeMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "easelife"."EscapeVote" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "EscapeVote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "easelife"."RequestLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" INTEGER NOT NULL,

    CONSTRAINT "RequestLimit_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "easelife"."StoredPhoto" (
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredPhoto_pkey" PRIMARY KEY ("filename")
);

CREATE UNIQUE INDEX "Listing_managementToken_key" ON "easelife"."Listing"("managementToken");

CREATE INDEX "VisitorEvent_visitedAt_idx" ON "easelife"."VisitorEvent"("visitedAt");

CREATE INDEX "VisitorEvent_visitorId_idx" ON "easelife"."VisitorEvent"("visitorId");

CREATE UNIQUE INDEX "EscapeOption_roomId_listingId_key" ON "easelife"."EscapeOption"("roomId", "listingId");

CREATE UNIQUE INDEX "EscapeMember_tokenHash_key" ON "easelife"."EscapeMember"("tokenHash");

CREATE INDEX "EscapeMember_roomId_idx" ON "easelife"."EscapeMember"("roomId");

CREATE UNIQUE INDEX "EscapeVote_memberId_optionId_key" ON "easelife"."EscapeVote"("memberId", "optionId");

CREATE INDEX "RequestLimit_expiresAt_idx" ON "easelife"."RequestLimit"("expiresAt");

CREATE INDEX "StoredPhoto_status_createdAt_idx" ON "easelife"."StoredPhoto"("status", "createdAt");

ALTER TABLE "easelife"."Photo" ADD CONSTRAINT "Photo_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "easelife"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "easelife"."Message" ADD CONSTRAINT "Message_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "easelife"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "easelife"."EscapeOption" ADD CONSTRAINT "EscapeOption_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "easelife"."EscapeRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "easelife"."EscapeOption" ADD CONSTRAINT "EscapeOption_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "easelife"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "easelife"."EscapeMember" ADD CONSTRAINT "EscapeMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "easelife"."EscapeRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "easelife"."EscapeVote" ADD CONSTRAINT "EscapeVote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "easelife"."EscapeMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "easelife"."EscapeVote" ADD CONSTRAINT "EscapeVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "easelife"."EscapeOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

REVOKE ALL ON SCHEMA "easelife" FROM PUBLIC;
ALTER TABLE "easelife"."Listing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "easelife"."Photo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "easelife"."Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "easelife"."VisitorEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "easelife"."SiteSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "easelife"."EscapeRoom" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "easelife"."EscapeOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "easelife"."EscapeMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "easelife"."EscapeVote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "easelife"."RequestLimit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "easelife"."StoredPhoto" ENABLE ROW LEVEL SECURITY;
