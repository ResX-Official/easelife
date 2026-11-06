UPDATE "Listing"
SET "description" = REPLACE("description", 'EaseRent', 'Easelife'),
    "landlordName" = REPLACE("landlordName", 'EaseRent', 'Easelife'),
    "landlordEmail" = REPLACE("landlordEmail", 'demo@easerent.example', 'demo@easelife.example')
WHERE "isDemo" = 1;
