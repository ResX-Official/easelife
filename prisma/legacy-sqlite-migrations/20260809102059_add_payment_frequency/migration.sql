-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "managementToken" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentFrequency" TEXT NOT NULL DEFAULT 'monthly',
    "propertyType" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "landlordName" TEXT NOT NULL,
    "landlordEmail" TEXT NOT NULL,
    "landlordPhone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Listing" ("address", "bathrooms", "bedrooms", "city", "createdAt", "currency", "description", "id", "landlordEmail", "landlordName", "landlordPhone", "managementToken", "price", "propertyType", "state", "title", "updatedAt") SELECT "address", "bathrooms", "bedrooms", "city", "createdAt", "currency", "description", "id", "landlordEmail", "landlordName", "landlordPhone", "managementToken", "price", "propertyType", "state", "title", "updatedAt" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE UNIQUE INDEX "Listing_managementToken_key" ON "Listing"("managementToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
