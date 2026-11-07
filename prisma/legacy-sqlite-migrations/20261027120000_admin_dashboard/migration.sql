CREATE TABLE "VisitorEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitorId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "visitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "VisitorEvent_visitedAt_idx" ON "VisitorEvent"("visitedAt");
CREATE INDEX "VisitorEvent_visitorId_idx" ON "VisitorEvent"("visitorId");

CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);
