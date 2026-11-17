# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Commerce env:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASS` — sends contact and purchase notifications through SMTP
  - `ORDER_NOTIFICATION_TO` or `CONTACT_NOTIFICATION_TO` — recipient for submitted contact/purchase details, defaults to `dandsiron@yahoo.com`
  - `QUICKBOOKS_PAYMENT_URL` — optional hosted QuickBooks payment link used after a pre-made item purchase request is created
  - Full QuickBooks API charging still requires Intuit OAuth/payment credentials before live card processing should be enabled

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

D&S Iron Works website for custom ironwork, pre-made fire pits, pre-made rocket stoves, Etsy products, contact requests, analytics, and backend-backed purchase requests.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do not collect raw card details in the React app. QuickBooks payment should happen through a hosted/authorized QuickBooks payment flow.
- Contact and purchase forms fall back to local browser storage in preview if the API is unavailable, but production should run the API server so SMTP notifications are sent.

## Analytics investigation — November 17, 2026

The on-site dashboard is a separate first-party tracker, not a GA4 reporting integration. The live client uses measurement ID G-QW2GMHN0GZ. Its downloaded Google tag configuration enables history pageviews, while the original tracker also sent manual route pageviews; the manual duplicate has been removed. Keep enhanced history pageviews enabled for this Google stream. The client's Google email was unavailable, so an exact report-to-report reconciliation has not been performed.

The original API held traffic in process memory and saved a local JSON file five seconds after the last event, silently ignoring write failures. Autoscale instances/redeployments can fragment or lose this data. Analytics now uses the existing PostgreSQL admin_content table under private-analytics-state, with transactional row locking and acknowledged writes. Local development uses serialized atomic file writes. Production requires DATABASE_URL; it will report failure instead of presenting an empty replacement store.

Before deployment, preserve any surviving analytics-data.json from the current live instance (or IRONWORKS_ANALYTICS_FILE if set). A surviving file is imported only when the private database row is first created; a redeployment that removes the old file cannot recover it. Do not copy local demo analytics into production. Multiple old instances may have different files; reconcile those backups before initializing production if applicable. Lost history cannot be reconstructed from this tracker. The deployment/database path still requires live verification.

Dashboard, visitor lists, and timelines now require the existing admin session, with no-store responses. The live endpoints were reachable without login during the audit; this remains a live issue until the fix is deployed. Public content routes cannot read the private analytics key. Admin activity, copied text, and class-waiver form identification are excluded from new collection.

New/returning counts use distinct visitors instead of session counts. New means first observed within the report period; returning means first observed before it. Reports include activity from sessions that began before the period. Missing lead, product-click, total-click, referrer and scroll metrics are now returned. Date presets use Mountain calendar days, custom end dates are inclusive, and DST boundaries are tested. Sessions expire after 30 minutes without events; short visits flush immediately and on hiding, failed batches retain IDs for retry, and the server deduplicates retries. GA4 metrics may still differ because their definitions, identity, consent and filtering differ.

The dashboard no longer substitutes this browser's visits when the API fails. It labels its data source and date range and discloses the 50,000-event history limit. Preview figures are explicitly labeled as development data. Form events are lead signals, not confirmed sales.

Validation: frontend/API type checks and builds; scripts/test-analytics.mjs in api-server (auth, counts, missing metrics, deduplication, concurrent writes, restart persistence, DST, and storage failure); scripts/test-analytics-tracker.mjs in ironworks (failed delivery/retry, session expiry, admin exclusion, single GA pageview source, blocked storage); existing class tests. No synthetic events or payments were sent to the live site, and no email was sent.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

### Analytics second verification pass — November 17, 2026

Fixed additional edge cases: browser storage getters throwing in privacy mode, reporting timers stopping after Back/Forward Cache navigation, refreshes overwriting original acquisition source, out-of-order events overwriting the exit page, and inherited-object names being accepted as visitor/session identifiers. Added regression coverage for each.

Validation: analytics API suite passes 9 tests (including its parent test); tracker suite passes 5 tests. Both TypeScript checks pass. API build passes. Live read-only checks returned 200 for homepage, health endpoint, and the Google tag. An empty event batch was rejected with 400 and created no traffic. Google tag still enables automatic history pageviews. Live dashboard still returns 200 without authentication and has no new report metadata; live bundle remains index-Bi1xgm4I.js, confirming these fixes are not deployed. Live counts at inspection were 5 visitors and 8 pageviews for seven days; no synthetic visits were inserted.

The connected Replit account lists MMvDAndSIronWorks and confirms its current deployment is successful at https://dandsironworks.com. This does not establish that the local fixes have been uploaded or that the production database migration has run. Do not simply republish the unchanged remote app. Before release: back up surviving production analytics JSON, apply the analytics-only patch, verify DATABASE_URL and admin_content schema on the deployment, then build and deploy. After release, verify unauthenticated analytics is 401, authenticated dashboard reports the new source/range metadata, and a controlled visit persists across restart. Confirm receipt in GA4 Realtime/DebugView with account access. Production database writes and GA4 account-side receipt are not yet verified; local persistence tests use the local-file path.
