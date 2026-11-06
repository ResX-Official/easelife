# Easelife

Easelife is a property website for finding homes to buy, apartments to rent, and places to stay for a short break. You can list a property and send an enquiry directly from the site.

It also has Escape Match, where a group of friends can pick a place to stay together.

Built with Next.js, Prisma, and SQLite.

## Run it locally

You need Node.js 24 or newer.

Create a `.env` file in the project folder:

```dotenv
DATABASE_URL="file:./dev.db"
ADMIN_USERNAME="your-admin-username"
ADMIN_PASSWORD="a-long-unique-password"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Install the packages and set up the database:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

If you want some sample properties to try out:

```bash
npm run seed:demo
```

Then start the app:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

The sample properties are marked as demos, and you can't send enquiries for them. Running the seed again won't add duplicates or change your own listings. You can also add or remove the demos from Settings in the admin page.

## What's in the app

- `/listings?category=apartments` — apartments and penthouses.
- `/listings?category=staycation` — places for short stays, with filters for location, price, bedrooms, and more.
- `/listings?type=sale` — homes for sale.
- `/list-property` — add a property.
- `/my-listings` — find the management links saved in your browser.
- `/admin` — manage listings, enquiries, Escape Match rooms, site stats, and the site logo.
- `/escape` — plan a stay with friends.

When you add a property, you'll get a private link to manage it. Keep that link safe. The links on `/my-listings` are saved in the browser you used.

## How Escape Match works

One person creates a room, chooses the group size, number of nights, budget, and the kind of place they want. They then share the room link with their friends.

Rooms support 2–12 people and stays of 1–14 nights. There need to be at least two places that fit the choices. The app shows up to six options with enough space for the group.

Everyone joins with a nickname and votes Skip, Maybe, or I'm in. People can only see their own votes until the results come out.

Results show when the full group has joined and finished voting. The person who made the room can also show results early once at least two people have joined and everyone in the room has finished. After that, nobody else can join or vote.

If everyone picks I'm in for a place, it's a group match. Otherwise, the app shows the places with the most points. If everyone skips everything, there's no match.

The cost shown is the accommodation price split between the people taking part. Daily prices are multiplied by the number of nights, and per-stay prices are charged once. Places with monthly or yearly prices aren't used here. Travel and other extras aren't included.

Rooms last for 30 days. Use the same browser to return to your room, since that's where your access is saved. Sharing a room link doesn't give someone control of the room.

Escape Match helps the group choose a place and send an enquiry. You'll still need to confirm availability and booking details with the owner. Sharing is up to you; the app doesn't send messages on its own.

## Checks

Run these before pushing changes:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

There's also a browser check. Start the app first and make sure Google Chrome is installed:

```bash
npm run test:browser
```

It checks the group voting flow, privacy, room limits, saved progress, and layouts on different screen sizes. It also checks admin pages if you've set up the admin login. Screenshots go in `/tmp/easelife-smoke`, and the test room is removed when it's done.

To check adding, editing, and deleting a property, uploads, and enquiries against a production server:

```bash
npm run test:browser -- --owner-only --origin=http://127.0.0.1:3000
```

This creates a test listing and removes it and its uploaded photo afterward.

## Hosting

Use a Node.js host that keeps the SQLite database and `public/uploads` between releases. New uploads are served from `/uploads/[filename]` and don't need a server restart.

Run `prisma migrate deploy` before starting a new release. Set your admin username and password, enable HTTPS, and change `NEXT_PUBLIC_SITE_URL` to your live site address so shared links have the right preview images.

The production build doesn't add demo properties automatically.

Before starting an updated version, run `npx prisma migrate deploy`. This also creates the table used to limit repeated requests. Limits are saved in SQLite and survive restarts.

By default, requests share a limit because the app doesn't trust IP headers sent by a browser. If your reverse proxy removes incoming copies and sets a header with the real client IP, set `TRUSTED_CLIENT_IP_HEADER` to that header name. It must contain one IP address, not a list. Keep the app behind that proxy so visitors can't bypass it.

Uploads are limited to 5 MB per photo, 10 MB per request, and 15 photos per listing. The server checks and converts images to WebP, removes metadata, and limits image dimensions. `UPLOAD_STORAGE_LIMIT_MB` sets the total upload storage limit; the default is 1024 MB. Deleted listings also have their uploaded photos removed.
