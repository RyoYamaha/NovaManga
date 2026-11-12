# Backend API

## Run locally

1. Start PostgreSQL from the repository root:

   ```powershell
   docker.exe compose --env-file Backend/.env up -d postgres
   ```

   Confirm the engine and PostgreSQL are ready with `docker.exe version` and
   `docker.exe compose ps`.

2. Copy `.env.example` to `.env`. For local PostgreSQL, keep the example URLs
   and ensure `POSTGRES_PASSWORD` matches the password in both connection URLs.

3. Install dependencies and apply the Prisma migration:

   ```powershell
   cd Backend
   npm install
   npx prisma migrate deploy
   npm run start:dev
   ```

The API runs at `http://localhost:3000`.

## Backend structure

Feature modules are grouped under `modules/` by domain:

- `modules/identity`: authentication.
- `modules/content`: content catalog, chapters, Manga, Novel, authors, and publishers.
- `modules/reading`: bookmarks, favorites, ratings, reading progress, and unlocks.
- `modules/commerce`: wallet, payments, payouts, and revenue.
- `modules/community`: comments, notifications, reports, and tickets.
- `modules/admin`, `modules/ai`, and `modules/health`: administration, AI, and health checks.
- `common/`, `prisma/`, and `generated/` remain at the backend root for shared code,
  database configuration, and generated Prisma Client.
- `scripts/` contains standalone database/seed utilities; start them from `Backend`
  so they continue to load the backend `.env`.

## Supabase PostgreSQL

1. Create a Supabase project and copy its connection strings from **Connect**.
2. Set `DATABASE_URL` to the **Transaction pooler** URL (port `6543`) for the
   running API. Set `DIRECT_URL` to the **Direct connection** URL for Prisma
   migrations. URL-encode special characters in the database password. Keep both
   values private and set them as backend deployment secrets.
3. Apply the PostgreSQL baseline and future migrations from `Backend`:

   ```powershell
   npx prisma migrate deploy
   ```

The PostgreSQL migration history is stored in `prisma/migrations-postgresql`.
This creates the schema in an empty PostgreSQL database; it does not copy data
from the previous SQL Server database. Back up and migrate any needed data
separately before switching production traffic.

## First Postman checks

### Health

`GET http://localhost:3000/health`

Expected response:

```json
{"status":"ok","database":"connected"}
```

### Register

`POST http://localhost:3000/auth/register`

Body, raw JSON:

```json
{
  "username": "reader01",
  "email": "reader01@example.com",
  "password": "Password123"
}
```

### Login

`POST http://localhost:3000/auth/login`

Body, raw JSON:

```json
{
  "usernameOrEmail": "reader01",
  "password": "Password123"
}
```

Copy `accessToken` from the response and send it as `Authorization: Bearer <accessToken>` for guarded services.

## SePay coin deposits

1. Set `SEPAY_WEBHOOK_API_KEY` in `.env` to the API key configured for the SePay webhook.
2. Sign in as an Admin and configure the receiving bank account:

   `PATCH /admin/payment-settings`

   ```json
   {
     "bankName": "Vietcombank",
     "bankBin": "970436",
     "bankAccountNumber": "0123456789",
     "bankAccountName": "NGUYEN VAN A"
   }
   ```

3. Configure SePay to send incoming bank-transaction webhooks to `POST /payments/webhook/sepay`
   with the `Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>` header.
   The API key must be set to the same secret in `Backend/.env` and in SePay's
   webhook security settings. Restart the backend after changing the environment
   variable. Do not expose or commit this key.
   SePay must be able to reach the backend over the public internet; `localhost`
   and a private Docker/network address will not work. For local testing, expose
   the backend through a secure HTTPS tunnel and use that public URL in SePay.
   Use SePay's test-webhook feature and webhook log to verify the endpoint returns
   HTTP 200 with `{"success":true}`.
4. An authenticated user creates a deposit using `POST /payments/deposits` with
   `{"amountVnd": 50000}`. The backend returns a VietQR image URL and a unique
   transfer code. Deposit amounts must be multiples of 1,000 VND.
5. The user can poll `GET /payments/:id` for status. A valid incoming webhook
   credits coins from the amount actually received (1 coin per 1,000 VND), even if
   it is less or more than requested. The received amount must be a multiple of
   1,000 VND; otherwise it is recorded as `NeedsReview` and does not credit coins.
   Replayed SePay transaction IDs do not credit coins twice.

The backend stores bank account settings in `SystemSetting`; the SePay API key is
kept in the environment and is never returned by the settings API. Expired pending
orders are reported as expired but are still accepted if a matching transfer arrives.
When a SePay payload includes `accountNumber`, it must match the receiving account
stored on the matched deposit order or the transaction is marked `WrongAccount`.

Admins can review pending deposits with `GET /admin/payments/orders?page=1&limit=20`
and incoming bank transactions with
`GET /admin/payments/bank-transactions?page=1&limit=20`. The bank-transaction
endpoint includes unmatched, review-required, wrong-account, and already-paid
transactions. An unmatched incoming transaction can be linked to a pending order
with `PATCH /admin/payments/bank-transactions/:id/assign`, including a required
reason. If no webhook transaction was recorded, an Admin can confirm a pending
order with `POST /admin/payments/orders/:id/confirm`, providing the bank statement
transaction ID, amount actually received, and reason. Both Admin actions share
the same atomic order, wallet, ledger, and bank-transaction update logic as the
SePay webhook. The supplied bank transaction ID is unique, preventing a later
webhook for that same transfer from crediting the wallet again.

## Content pricing and community translations

Authors and verified Publishers can set `pricingType`, `purchaseMode`,
`priceCoins`, and `freeChapters` when creating or updating their content.
Pricing values are `free` and `paid`; paid content must have a positive integer
coin price, while free content is always stored at zero coins. `purchaseMode`
is `whole` (the default) or `chapter_pack`. Chapter-pack sales use fixed ranges
of 10 chapters (1–10, 11–20, and so on); `priceCoins` is the price per pack.
Whole-content purchases already made continue to grant access to the full story.
`freeChapters` defaults to 3.
Apply the `20261112150000_chapter_pack_purchases` migration before deploying
the updated backend.

Example fields in an Author/Publisher content request:

```json
{
  "pricingType": "paid",
  "purchaseMode": "chapter_pack",
  "priceCoins": 50,
  "freeChapters": 3,
  "allowCommunityTranslation": false
}
```

When `pricingType` is `free`, the backend stores `priceCoins` as zero. The
Author/Publisher chooses the catalogue price in coins; purchase requests always
use this server-stored price. For `purchaseMode: "chapter_pack"`, that is the
price for each 10-chapter pack. A purchase stores the price charged at the time
of sale and grants access only to that pack, while a prior whole-content purchase
continues to grant access to all chapters.

Fan Translations are always stored as free with a zero price. They can only be
created from a published Licensed title when its Publisher has enabled
`allowCommunityTranslation` while the title is free. Only Licensed titles can
enable this option; switching a title to paid automatically disables it.
Existing Fan Translations stay public for 14 days after the title changes to
paid, then disappear from public content, ranking, manga-page, and novel-reading
endpoints. Authors can update these fields through their existing
`PATCH /author/content/:id` endpoint, and Publishers through
`PATCH /publisher/content/:id`.

Verified Publishers can review community translations for a Licensed title
they own with `GET /publisher/content/:id/translations`. They can hide or
restore a published translation with
`PATCH /publisher/content/:id/translations/:translationId/visibility` and a
JSON body such as `{"hidden":true,"reason":"Nội dung chưa phù hợp"}`.
The reason is optional. This Publisher visibility is separate from Admin
moderation: hidden translations are omitted from Reader-facing catalog,
recommendation, detail, and chapter-reading endpoints, while the Author can
still access their work and receives a notification. Apply the
`20261110160000_publisher_translation_visibility` migration before using these
endpoints.

## Buying and reading paid content

An authenticated reader can check ownership with `GET /unlock/content/:contentId`
and buy a published paid whole title with `POST /unlock/content/:contentId/purchase`.
For a chapter-pack title, the reader buys the pack containing a published chapter
with `POST /unlock/content/:contentId/chapters/:chapterNumber/purchase-pack`.
The server charges the current `priceCoins` and records the purchase, wallet
ledger entry, and creator revenue in the same database transaction. Repeating a
purchase for an already-owned title or pack does not charge again.

The first `freeChapters` chapters of a paid title are readable without purchase.
Reading a later chapter requires login and ownership. A whole-title purchase
unlocks all current and future chapters; a chapter-pack purchase unlocks only
its fixed range of 10 chapters. Existing purchases retain their access if the
author later changes the title's purchase mode or price.
Free titles and Fan Translations remain readable without purchase. Public
chapter-reading endpoints accept an optional Bearer token so anonymous readers
can still access free chapters.

## Wallet

Authenticated users can check their coin balance with `GET /wallet/balance` and
their paginated coin ledger with `GET /wallet/transactions?page=1&limit=20`.
The transaction endpoint returns `items`, `page`, `limit`, `total`, and
`totalPages`; `limit` is capped at 100. A user without a wallet yet has a balance
of zero and an empty transaction history. Both endpoints are scoped to the user
identified by the JWT.

## Creator revenue and payouts

When a paid `Original` title is purchased, the uploader receives 60% of the
sale in creator earnings. When a paid `Licensed` title is purchased, its
verified Publisher receives 80%. The creator share is rounded down to a whole
coin; the remaining coins are recorded as the platform share. The revenue
allocation is committed in the same transaction as the buyer debit, purchase,
and wallet ledger entry.

Authors and Publishers can view their earnings at `GET /revenue/me` and
paginated sale history at `GET /revenue/me/history?page=1&limit=20`.
These endpoints only return revenue belonging to the authenticated creator.

Creators save or update their payout bank profile with `PUT /payout/profile`
and view it with `GET /payout/profile`. `POST /payout/requests` creates a payout
request for at least the configured `payout.minimumCoins` amount (default 10).
Pending requests reserve earnings immediately; rejecting a request releases
that reservation, and marking it Paid records completion. The bank details are
copied into each request so later profile edits do not change an existing
payout destination. The default `payout.holdDays` setting is 0.

The Admin payout screen generates a VietQR transfer for each pending request.
Payout conversion is 1 coin = 1,000 VND; the QR includes the snapshotted bank
account, converted VND amount, and a unique `NOVAPAY-...` transfer reference.
Admins should confirm the request as Paid only after the bank reports a
successful transfer.

Administrators can list pending payouts at `GET /admin/payout/requests`, mark a
manual bank transfer Paid with `PATCH /admin/payout/requests/:id/paid`, reject
with `PATCH /admin/payout/requests/:id/reject`, update the minimum using
`PATCH /admin/payout/settings`, and block or unblock a creator with
`PATCH /admin/payout/users/:userId/block`.

## Common problems

- `P1001`: confirm PostgreSQL is running and `DATABASE_URL` (or `DIRECT_URL` for migrations) has the correct host and credentials.
- `P3005` or migration errors: confirm Prisma is using the PostgreSQL migration history in `prisma/migrations-postgresql` and that `DIRECT_URL` points to the intended database.
- `401 Unauthorized`: login first and use the returned access token in the Bearer header.
- Cloudinary variables are only needed when testing upload endpoints.