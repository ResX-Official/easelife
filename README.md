# Easelife

Easelife is a property website for finding homes to buy, apartments to rent, and places to stay for a short break. You can list a property and send an enquiry directly from the site.

Escape Match lets a group of friends vote on places and choose a stay together.

Built with Next.js, Prisma, Supabase Postgres, and Supabase Storage.

## Set it up

Use Node.js 24. Create a free Supabase project, then copy `.env.example` to `.env` and fill in your values.

| Variable | What to use |
| --- | --- |
| `DATABASE_URL` | The transaction pooler URI from Supabase's Connect panel, on port 6543. Add `?sslmode=require` if it has no query string. |
| `DIRECT_URL` | The session pooler URI from the same panel, on port 5432. Add `?sslmode=require&schema=easelife` if it has no query string. This is used for migrations. |
| `SUPABASE_URL` | Your project's URL, such as `https://your-project.supabase.co`. |
| `SUPABASE_SECRET_KEY` | A secret API key from Supabase Settings → API Keys. A legacy `service_role` key also works. |
| `SUPABASE_STORAGE_BUCKET` | `listing-photos` |
| `ADMIN_USERNAME` | Choose an admin username. |
| `ADMIN_PASSWORD` | Choose a long, unique password. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, or your live HTTPS address. |
| `UPLOAD_STORAGE_LIMIT_MB` | `512`, or a smaller limit if you want. |
| `TRUSTED_CLIENT_IP_HEADER` | Leave blank locally. Vercel's own client-IP header is used automatically when deployed there. |

The Supabase database CA certificate is bundled in `prisma/certificates/supabase-root.crt`. The app verifies TLS certificates and hostnames; migrations use the same CA. Its source is `https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`.

Copy the actual connection strings from Supabase. The pooler host varies by project and region. Replace the password placeholder with your database password, URL-encoded if it contains special characters. The database password is separate from your API key and admin password.

Keep the secret key and database URLs on the server. They must never have a `NEXT_PUBLIC_` prefix or go into GitHub. This app doesn't need a browser-side Supabase key.

Run:

```bash
npm install
npx prisma generate
npm run db:migrate
npm run setup:storage
npm run dev
```

Open http://localhost:3000.

The setup command creates a private bucket that only accepts WebP images. The app checks and converts photos before uploading them, and serves them through `/uploads/[filename]`. Don't make the bucket public or add browser upload policies.

The database tables live in the private `easelife` schema and have row-level security enabled. Don't add this schema to Supabase's exposed Data API schemas. Prisma connects from the server using the database credentials.

For sample properties, run `npm run seed:demo`, or add them from Admin → Settings. They are marked as demos and can't receive enquiries. Running the seed again won't add duplicates or change your own listings.

## Pages

- `/listings?category=apartments` — apartments and penthouses.
- `/listings?category=staycation` — places for short stays.
- `/listings?type=sale` — homes for sale.
- `/list-property` — add a property.
- `/my-listings` — management links saved in your browser.
- `/admin` — manage properties, enquiries, rooms, site stats, the logo, and demos.
- `/escape` — plan a stay with friends.

Keep the private management link you get after adding a property. Anyone with that link can edit the property and read its enquiries. Share the public listing link with other people.

## Escape Match

One person creates a room and shares its link. Groups can have 2–12 people and compare stays of 1–14 nights. There must be at least two places that fit the group's choices. The app shows up to six options.

Everyone joins with a nickname and votes Skip, Maybe, or I'm in. Votes stay private until the results come out. Results show when the planned group finishes voting. The organiser can reveal early once at least two people have joined and everyone in the room has finished.

Daily prices are multiplied by the number of nights, and per-stay prices are charged once. The cost is split between the people taking part. Monthly and yearly rates aren't used. Travel and extras aren't included.

Rooms last for 30 days. Return in the same browser to keep your access. Escape Match helps people choose a place and send an enquiry; booking and availability still need to be confirmed with the owner.

## Deploy to Vercel

Run `npm run db:migrate` and `npm run setup:storage` locally with your Supabase values before the first deployment. Run migrations again when a later release adds one. The build doesn't apply migrations or add demo data.

Push the code, import the GitHub repo into Vercel, choose Next.js and Node.js 24, and use `npm run build` as the build command. Add the environment variables above to the Production environment. Use your final Vercel URL for `NEXT_PUBLIC_SITE_URL`; change it and redeploy if the assigned address is different. If you use Preview deployments, give them a separate Supabase project so previews don't change production data.

On Vercel, `DIRECT_URL` is only needed if you intend to run migration commands there. Keep it in your local `.env` for the usual setup flow.

You can add up to 15 photos to a listing, with a limit of 3 MB per photo. They start uploading when you pick them, so you can keep filling in the form. Up to three upload at a time. If one fails, click publish to retry without starting over.

Listing details are saved as a draft in the same browser. If you come back, you can resume or discard them. Photos need to be added again. The draft is cleared after publishing.

People can open all the photos on a listing, swipe on a phone, or use the arrow keys. Press Escape to close the gallery.

Once the photos are ready, publishing saves the details and opens your management page. The server checks the images, removes their metadata, and saves the listing and its photos together. Unused uploads older than an hour are cleared during later uploads.

Deleting a listing removes it from the site first. Its photos are marked for cleanup in the same database update, then removed from storage in the background. If storage is temporarily unavailable, cleanup is retried later. You don't have to wait for it to finish.

After deploying, add a property and photo, send an enquiry, check the owner inbox, and test the admin login. Redeploy once and confirm the data is still there.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Postgres integration tests need `TEST_DATABASE_URL` pointing to a separate local test server whose user can create databases. Each test creates and removes its own temporary database. Without that variable, those tests are reported as skipped.

```bash
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres npm test
```

With the app running and Google Chrome installed:

```bash
npm run test:browser
npm run test:browser -- --owner-only --origin=http://127.0.0.1:3000
npm run test:browser -- --owner-only --many-photos --origin=http://127.0.0.1:3000
npm run test:browser -- --security-only --origin=http://127.0.0.1:3000
```

Use a test Supabase project for browser checks. They create temporary records and photos, then remove them. Screenshots go in `/tmp/easelife-smoke`. The general catalogue checks expect demo listings and a monthly apartment sample.

## Existing local data

Old SQLite migrations are kept in `prisma/legacy-sqlite-migrations` for reference. Existing local database files and uploaded photos are left untouched. They aren't copied into Supabase automatically. Use a new, empty Supabase project for this migration. If you need the old data online, transfer the records and photos before switching the live app over.
