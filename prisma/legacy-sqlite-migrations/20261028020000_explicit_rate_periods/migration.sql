-- Older staycation records used monthly/yearly as aliases for night/stay.
-- Convert those records only; monthly apartment rentals keep their monthly rate.
UPDATE "Listing" SET "paymentFrequency" = 'daily' WHERE "listingCategory" = 'staycation' AND "paymentFrequency" = 'monthly';
UPDATE "Listing" SET "paymentFrequency" = 'per_stay' WHERE "listingCategory" = 'staycation' AND "paymentFrequency" = 'yearly';
