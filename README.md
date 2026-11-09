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

`VITE_STORE_DOMAIN` is the base hostname only, without a store slug. For a local
subdomain demo, use `localhost`; store links will carry over the Vite port (for
example, `shop.localhost:5173`). Storefront links use a registered store's
subdomain when available and fall back to its `/store/<user-id>` route otherwise.

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
supabase functions deploy store-template-save
supabase functions deploy store-report
supabase functions deploy seller-verification
```

After applying `202611020005_seller_verification_image_retention.sql`, redeploy
`purge-store-identity-images` so the existing scheduled cleanup also removes
individual-seller ID and selfie images 30 days after a review decision. Seller
verification uses the existing private `store-private` bucket and
`STORE_ID_HASH_SECRET`; no additional Edge Function secret is required. Migration
`202611020007` records the timestamp when the seller accepts the identity privacy
notice, and the Edge Function rejects submissions without that consent.
Individual sellers can submit or check verification from **Settings → Account**
or the **Create listing** page. Store owners continue to use store verification.

For an existing linked project, inspect pending migrations before deploying:

```bash
supabase migration list
supabase db push
supabase functions deploy seller-verification
supabase functions deploy purge-store-identity-images
```

`supabase db push` applies all migrations not yet recorded on the linked project,
including the individual-seller migrations `202611020004` through `202611020007`
when they are pending. Do not use it until the CLI is linked to the intended
project and the migration list has been reviewed.

The individual seller phone-verification requirement is enforced by the
database policy row, not the Edge Function environment. It defaults to enabled.
For local development only, disable it with:

```sql
UPDATE public.individual_seller_policy
SET phone_otp_required = FALSE
WHERE singleton = TRUE;
```

Set it back to `TRUE` before production use.

The application also needs these Supabase Edge Function secrets:

- `STORE_ID_HASH_SECRET`: long random secret used to HMAC normalized government
  ID numbers, verified E.164 phone numbers, and rate-limit identifiers. Changing
  identifier normalization means existing ID/phone hashes created from
  non-canonical values will not match their newly normalized hashes; clear
  applicable test rows and re-register test accounts.
- `PHONE_OTP_REQUIRED`: `true` for production; `false` only for local development.
- `TURNSTILE_SECRET_KEY`: required to validate CAPTCHA tokens. `APP_ENV` defaults to
  `production` (fail-closed when this secret is missing); set it to `development`
  only for local/test environments where CAPTCHA is intentionally bypassed.
- `ALLOWED_ORIGIN`: deployed MarketSpace origin.
- `RESEND_API_KEY` and `EMAIL_FROM`: required for application, approval, and rejection emails. Configure a verified sender in Resend.
- `PURGE_JOB_SECRET`: random secret sent as the `x-purge-secret` header by the scheduled identity-image cleanup request.

Generate secrets outside the repository (for example, use a password manager or
`openssl rand -base64 32` for the encryption key). Do not commit them.

The store-template migration creates the public-read `store-assets` bucket.
It accepts JPEG, PNG, and WebP files up to 5 MB; authenticated uploads must be
inside the caller's `{user_id}/` folder. Template images are compressed to WebP
and resized in the browser to a maximum 1600 px longest side. Store only the
returned storage path in template content, not a base64 data URL. Apply the
migration with `supabase db push` before deploying `store-template-save`.
An approved seller can open **Store dashboard → Customize Theme** to choose
between **Boutique Grid** and **Storefront Landing**. The live storefront is
selected by its saved `template_id`; legacy theme presets are no longer rendered
or editable. Stores with a missing or unsupported template ID render as
**Boutique Grid** without changing the saved ID or resetting the six-month
template-change cooldown.

Phase 3 departments reuse the existing `stores.collections` JSON array and
add `listings.collection_ids` JSONB for multi-department assignments.
Redeploy `store-template-save` for department validation and persistence.
preserving `collection_id` for compatibility. Apply
`202610290003_store_departments.sql` with `supabase db push`. Boutique Grid
shows only departments that have listings, and deleting a department does not
delete its listings; those listings remain accessible under their other
departments or the uncategorized catalog. Department management is saved through
`store-template-save`, while listing assignment fields are written by the listing
form.

Store template changes are limited to one every six months. Apply
`202611010001_profile_covers_and_template_cooldown.sql` before deploying the
updated `store-template-save` function. The database trigger enforces the limit
for every write path; the editor also disables the alternate template while the
cooldown is active.

Store reports use `202610290002_store_reports.sql` and the `store-report` Edge
Function. Apply the migration and deploy the function before enabling the
storefront report action or moderator queue. Reports require a confirmed email,
allow one open report per user/store, and are limited to five submissions per
user per day. Add moderator user IDs to `public.store_admins`; report decisions
are recorded in `store_review_audit_log`.

The report workflow currently supports reports about stores only. It does not
apply strikes, suspend stores automatically, report individual listings, or send
report emails.

Listing approval uses `202610310003_listing_moderation.sql` and the
`listing-review` Edge Function. Apply the migration, then deploy the function:

```bash
supabase db push
supabase functions deploy listing-review
```

`202611090001_store_probation_listing_threshold.sql` graduates a probation store
after five distinct listings receive moderator approval. Apply this migration
and redeploy `store-registration` so new store applications no longer write the
removed order-value cap field.

The migration backfills existing listings as approved. New listings are assigned
to the caller's approved store by a database trigger; any client-provided
`store_id` is ignored. Listings from sellers without an approved store, stores
in probation, and sellers with any upheld store report enter the pending queue.
New listings from trusted stores without upheld reports are auto-approved.
After five distinct listings have been approved by moderators, a probation
store becomes trusted and can publish up to the database's maximum listing cap.
Stores with upheld reports still require moderation regardless of trust state.
Public listing queries are restricted by RLS; owners and moderators may also
read listings awaiting review. Editing an approved listing's title, description,
price, category, images, or type sends it back to review. Moderation decisions,
audit records, seller notifications, probation graduation, listing limits, and
expiration are handled server-side.

Notification and inbox actions use
`202610310004_notification_and_chat_actions.sql`. Apply pending migrations with
`supabase db push` before using individual read/unread, pin, and delete controls.
Notification pins and broadcast read/deleted state are stored per user; personal
notification reads remain on the notification row. Pinned notifications and
chats must be unpinned before they can be deleted. Selecting an unread chat
marks it read, and pinned chats are ordered before other inbox threads.
Only users listed in `public.store_admins` can publish notifications, through
the protected `send_moderator_notification` function. In `/admin/store-review`,
moderators can send to everyone or select up to 500 recipients by username.
Direct notification inserts are revoked from browser clients.

Add moderator user IDs to `public.store_admins` using the Supabase SQL editor.
Phase 4 adds the `role` column and places the moderator workspace at `/admin`.
The first admin must be assigned manually; moderator assignment changes remain
SQL-only, and database guards prevent removing or demoting the last admin. The
workspace uses a separate Supabase auth storage key from the shopper session
and blocks access when both sessions belong to the same Auth user. Use distinct
accounts for moderator and shopper activity.
After reviewing and applying the new migrations, deploy the updated review and
authentication functions with `supabase functions deploy listing-review` and
`supabase functions deploy admin-auth`.
Create the first administrator from an already-created, email-confirmed Auth
user in the SQL editor:

```sql
INSERT INTO public.store_admins (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(email) = lower('owner@example.com')
  AND email_confirmed_at IS NOT NULL;
```

Moderators open `/admin/login` to establish the isolated moderator session.
If a moderator or admin signs in through the regular marketplace login, MarketSpace
signs out that shopper session and redirects them to `/admin/login`. The shopper
Shell does not provide an admin-workspace shortcut. Admin routes require a valid
moderator session and no active shopper session. Completing moderator sign-in
ends any shopper session; entering the admin route while a shopper session is
active clears the moderator session and requires moderator sign-in again.

For a confirmed account already in `auth.users`, grant temporary moderator
access for a sign-in test with:

```sql
INSERT INTO public.store_admins (user_id, role)
SELECT id, 'moderator'
FROM auth.users
WHERE lower(email) = lower('owner@example.com')
  AND email_confirmed_at IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
```

Use the project owner's own confirmed email address in place of the example.
The Supabase built-in mailer can be used only for eligible project-team
addresses and is suitable for this limited test. For broader delivery, configure
a verified SMTP sender in Supabase Dashboard → Authentication → SMTP Settings;
the Edge Function delegates delivery to Supabase Auth and does not store SMTP
credentials. Set the Supabase Auth email OTP expiry to 600 seconds and its code
length to six digits, and use `{{ .Token }}` in the email template. Configure
`VITE_TURNSTILE_SITE_KEY` for the frontend and the `TURNSTILE_SECRET_KEY`,
`ADMIN_AUTH_HASH_SECRET`, and exact frontend `ALLOWED_ORIGIN` Edge Function
secrets before testing. The hash secret must be a random, private value; it is
used only to hash rate-limit identifiers. Shopper and moderator sessions cannot
be active at the same time.
If the built-in mailer cannot deliver to the owner's address, configure SMTP
before testing. Remove a temporary moderator row with SQL after the test; do
not remove the last account assigned the `admin` role.

To run the optional database integration tests, use a disposable local Supabase
project, apply the migration, deploy/serve `listing-review`, then set
`LISTING_MODERATION_INTEGRATION=1` and the `LISTING_MODERATION_TEST_URL`,
`LISTING_MODERATION_TEST_ANON_KEY`, and
`LISTING_MODERATION_TEST_SERVICE_ROLE_KEY` variables before running:

```bash
npx vitest run supabase/tests/listing-moderation.integration.test.ts
```

The tests create and remove temporary users and listings. They intentionally
avoid reviewing items so the append-only moderation audit log is not polluted.

The previous probation-limit trigger skipped listing inserts with a null
`store_id`, which the client currently omits. The migration assigns stores on
new inserts and backfills existing listings for approved stores. It does not
silently delist legacy listings if a probation store is already above its cap;
check and resolve those listings before expecting additional approvals:

```sql
SELECT s.id, s.shop_name, s.active_listing_limit, COUNT(l.id) AS active_approved_listings
FROM public.stores s
JOIN public.listings l ON l.store_id = s.id
WHERE s.status = 'approved'
  AND s.probation_state = 'probation'
  AND l.moderation_status = 'approved'
  AND lower(COALESCE(l.status, '')) IN ('available', 'active')
GROUP BY s.id, s.shop_name, s.active_listing_limit
HAVING COUNT(l.id) > s.active_listing_limit;
```

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
   header. The cleanup function deletes verification photos 30 days after a
   review; reviewed store owners can delete them sooner from their store settings.
6. Publish legally reviewed MarketSpace terms from the admin terms page and
   review the prohibited-items list before launch. Store owners define their own
   customer-facing policies during registration and can edit them in store setup;
   existing delivery and return policy text is preserved as editable policies.
7. Configure a wildcard `*.your-marketspace-domain.com` DNS record and matching
   hosting/custom-domain routing for store subdomains. Set `VITE_STORE_DOMAIN` to
   the platform's real domain; the app resolves a registered subdomain to its
   approved storefront. The project cannot provision DNS or hosting settings.

The profile's Delete Account action invokes the `account-deletion` Edge Function.
It prepares the caller's data through the service-role-only
`prepare_account_deletion(p_user_id)` RPC, recursively removes that user's
`store-private` files through the Storage API, and then deletes the Auth user.
The `202610260002_store_registration_fixes.sql` migration adds the
`prepare_account_deletion` RPC and is safe to rerun if the patch was previously
applied manually. Account deletion does not yet check open orders, unresolved
disputes, because those tables are not present in this schema.

The two client-side store upserts in `useMarketplaceApp.ts` write these columns:

- Store editor: `user_id`, `shop_name`, `description`, `category`, `address`,
  `logo`, `cover`, `accent_color`, `announcement_bar`, `collections`,
  `customer_care`, `catalog`, `ads`, and `theme_config`.
- Theme editor: `user_id`, `shop_name`, `theme_config`, and `accent_color`.

Neither upsert explicitly writes the protected status, verification, trust,
subdomain, store-type, or storefront-coordinate fields.
Store support phone numbers are stored in `customer_care.phone`; the
`202611050001_remove_whatsapp.sql` migration preserves existing support numbers,
cleans saved contact settings, and removes the old store contact column.
The store dashboard's `stores.cover` value is the shared storefront banner.
Saving a Boutique Grid template synchronizes its banner image to `stores.cover`,
and the dashboard uses the saved template banner when no dashboard cover exists.

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
7. As an administrator, publish a new version of MarketSpace Terms of Service.
   Confirm the full text appears in seller onboarding and account legal settings,
   and that a seller must accept the latest version before submitting.

### Current platform limits

The existing app has no persisted orders/checkout or disputes, so probation
graduation does not depend on buyer transactions or optional ratings. Stores
graduate after five distinct listings are approved by moderators. Listings
from sellers with upheld store reports continue to require moderation.

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

The store-report integration test is opt-in. Run it only against a local/test
project after applying `202610290002_store_reports.sql` and deploying
`store-report`; set `STORE_REPORT_INTEGRATION=1` and the same
`STORE_REGISTRATION_TEST_*` variables before running `npm test`. It checks
report-row privacy, reporter identity enforcement, duplicate prevention, and the
five-per-day function rate limit. Do not use production credentials or data.

The individual seller verification integration test is opt-in. Run it only
against a disposable local/test project after applying the individual seller
migrations and serving or deploying `seller-verification`. Configure
`STORE_ID_HASH_SECRET` for that function, then set
`SELLER_VERIFICATION_INTEGRATION=1` and
`SELLER_VERIFICATION_TEST_URL`, `SELLER_VERIFICATION_TEST_ANON_KEY`, and
`SELLER_VERIFICATION_TEST_SERVICE_ROLE_KEY` before running:

```bash
npx vitest run supabase/tests/seller-verification.integration.test.ts
```

It creates and removes a temporary account and verifies submission state,
owner-only database access, and safe cleanup behavior. Never use production
credentials or data.
