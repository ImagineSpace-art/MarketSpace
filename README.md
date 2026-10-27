# MarketSpace

A standalone marketplace web app built with React, TypeScript, Vite, and Supabase.

## Setup

1. Copy `.env.example` to `.env.local` and add your Supabase project values:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PHONE_OTP_REQUIRED=false
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
VITE_STORE_DOMAIN=your-marketspace-domain.com
```

`VITE_PHONE_OTP_REQUIRED` is a browser-side development switch. The matching Edge
Function secret is `PHONE_OTP_REQUIRED`; set it to `false` locally and `true` in
production. Never place service-role, Turnstile-secret, encryption, or purge-job
secrets in a `VITE_*` variable.

For a new Supabase project, first apply the existing baseline schema in
`src/supabase_schema.sql` using the Supabase SQL editor. For an existing project,
preserve its current schema and apply the pending migrations. Link the CLI to the
intended project before pushing migrations.

2. Install dependencies:

```bash
npm install
```

3. Apply the store-registration migration and deploy its functions:

```bash
supabase db push
supabase functions deploy store-registration
supabase functions deploy account-deletion
supabase functions deploy purge-store-identity-images
```

The application also needs these Supabase Edge Function secrets:

- `STORE_ID_HASH_SECRET`: long random secret used to HMAC normalized government
  ID numbers, verified E.164 phone numbers, and rate-limit identifiers. Changing
  identifier normalization means existing ID/phone hashes created from
  non-canonical values will not match their newly normalized hashes; clear
  applicable test rows and re-register test accounts. Location-code hashing is
  unchanged.
- `STORE_PAYOUT_ENCRYPTION_KEY`: base64-encoded 32-byte AES-GCM key.
- `PHONE_OTP_REQUIRED`: `true` for production; `false` only for local development.
- `TURNSTILE_SECRET_KEY`: required to validate CAPTCHA tokens. `APP_ENV` defaults to
  `production` (fail-closed when this secret is missing); set it to `development`
  only for local/test environments where CAPTCHA is intentionally bypassed.
- `ALLOWED_ORIGIN`: deployed MarketSpace origin.
- `PROBATION_MAX_ORDER_VALUE_ZMW`: probation order cap; currently defaults to `5000`.
- `RESEND_API_KEY` and `EMAIL_FROM`: required for application, approval, and rejection emails. Configure a verified sender in Resend.
- `PURGE_JOB_SECRET`: random secret sent as the `x-purge-secret` header by the scheduled identity-image cleanup request.

Generate secrets outside the repository (for example, use a password manager or
`openssl rand -base64 32` for the encryption key). Do not commit them.

### Supabase project configuration

1. Enable email confirmation and configure Auth SMTP. Enable Cloudflare Turnstile
   CAPTCHA in Supabase Auth and use the matching site key in
   `VITE_TURNSTILE_SITE_KEY`. Auth's built-in signup rate limits remain enabled.
2. Configure Supabase Auth Phone authentication with an SMS provider. Add a test
   phone number and its fixed test OTP under Auth phone settings to exercise the
   flow without sending SMS. The wizard verifies an authenticated user's phone
   with `updateUser({ phone })` and `verifyOtp({ type: 'phone_change' })`.
3. Set `PHONE_OTP_REQUIRED=false` in both Vite and local Edge Function environment
   for development. Production must set it to `true`.
4. Add moderator user IDs to `public.store_admins` using the Supabase SQL editor.
   The migration intentionally provides no client-side way to grant moderator
   access.
5. Schedule `purge-store-identity-images` to run daily with the `x-purge-secret`
   header. Schedule `SELECT public.promote_trusted_stores();` daily using Supabase
   Cron. The cleanup function deletes verification photos 30 days after a review;
   reviewed store owners can delete them sooner from their store settings.
6. Replace the seller terms, return-policy wording, prohibited-items list, and
   policy version constants in `StoreRegistrationWizard.tsx` before launch.
7. Configure a wildcard `*.your-marketspace-domain.com` DNS record and matching
   hosting/custom-domain routing for store subdomains. Set `VITE_STORE_DOMAIN` to
   the platform's real domain; the app resolves a registered subdomain to its
   approved storefront. The project cannot provision DNS or hosting settings.

To schedule trusted-store promotion with `pg_cron`, first enable the extension
in the Supabase dashboard, then run:

```sql
-- Requires the pg_cron extension to be enabled in the Supabase dashboard.
-- Runs trusted-store promotion every day at 02:00 UTC.
SELECT cron.schedule(
  'promote-trusted-stores-daily',
  '0 2 * * *',
  $$SELECT public.promote_trusted_stores();$$
);
```

The profile's Delete Account action invokes the `account-deletion` Edge Function.
It prepares the caller's data through the service-role-only
`prepare_account_deletion(p_user_id)` RPC, recursively removes that user's
`store-private` files through the Storage API, and then deletes the Auth user.
The `202610260002_store_registration_fixes.sql` migration adds the
`prepare_account_deletion` RPC and is safe to rerun if the patch was previously
applied manually. Account deletion does not yet check open orders, unresolved
disputes, or pending payouts because those tables are not present in this schema.

The two client-side store upserts in `useMarketplaceApp.ts` write these columns:

- Store editor: `user_id`, `shop_name`, `description`, `category`, `address`,
  `whatsapp`, `logo`, `cover`, `accent_color`, `announcement_bar`, `collections`,
  `customer_care`, `catalog`, `ads`, and `theme_config`.
- Theme editor: `user_id`, `shop_name`, `theme_config`, and `accent_color`.

Neither upsert explicitly writes the protected status, verification, trust,
subdomain, store-type, or storefront-coordinate fields.

### Manual store-registration test

1. Create a test account, confirm its email, and choose **Open a store**.
2. With phone OTP required, use the configured Supabase test phone and fixed OTP;
   verify it without sending a real SMS. With the development flag off, continue
   without phone verification.
3. Complete each step, upload test ID/selfie/location images, check that progress
   resumes after a reload, and verify that a rejected/resubmitted draft retains
   its feedback.
4. Submit using a valid Turnstile challenge when configured. Confirm the store is
   not public until approved, and that the review queue shows only expiring signed
   image URLs and the automated-check results.
5. Add a moderator to `store_admins`, approve/reject the application with a reason,
   and verify the badge, audit event, owner email, and probation state.
6. Confirm owner privacy-photo deletion works after review and the scheduled purge
   removes expired media.

### Current platform limits

The existing app has no persisted orders/checkout, disputes, or payout execution
subsystem. Probation order limits are not checked at order creation, completed
order counts are not incremented, and payout holds are not applied when scheduling
payouts. The migration's `store_can_accept_order` helper and configured probation
fields are not wired into those flows. Trusted-store promotion reads
`completed_order_count`, which must be incremented by the eventual order-completion
workflow. These remain integration work when those flows exist; listing statuses
and the existing database-level active-listing limit are unchanged.

Run the development server:

```bash
npm run dev
```

Run the registration validation tests:

```bash
npm test
```

The full Supabase integration test is opt-in and creates/deletes an isolated test
account. Run it only against a local/test project after deploying the migration
and function, setting `PHONE_OTP_REQUIRED=false` and `APP_ENV=development`, and
providing the local project URL, anon key, and service-role key as
`STORE_REGISTRATION_TEST_URL`, `STORE_REGISTRATION_TEST_ANON_KEY`, and
`STORE_REGISTRATION_TEST_SERVICE_ROLE_KEY`. Then set
`STORE_REGISTRATION_INTEGRATION=1` and run `npm test`. Do not use production
credentials or production data for this test.

The account-deletion route integration test is also opt-in. Run it only against a
local/test project after applying the store-registration fixes patch and deploying
`account-deletion`; set `ACCOUNT_DELETION_INTEGRATION=1` and the same
`STORE_REGISTRATION_TEST_*` variables before running `npm test`. It creates two
temporary users, verifies the request cannot delete the other user, and confirms
the caller's private test image is removed.
