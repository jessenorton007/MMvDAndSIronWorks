# Classes development

## Included

- `/classes` directory with category filters and `/classes/:slug` detail pages.
- Classes & Waivers tab in the existing authenticated admin panel.
- Draft/published classes, descriptions, prices per participant, ordered photo uploads, dates, capacity, and closed sessions.
- Adult self-registration with a typed signature and explicit electronic-signature consent.
- Exact waiver text, version, consent, signature, server timestamp, class, session, and quoted price saved per registration.
- Private registration roster with pending, confirmed, and cancelled states, search, and downloadable signed-waiver text.
- Public HTML metadata, correct detail-page status codes, and dynamic sitemap entries.

## Payment boundary

New registrations reuse the contact form's SMTP transport and `SMTP_*` settings. The owner receives a notification and the participant receives a request acknowledgment, explicitly stating that no seat is reserved and no payment is collected. Recipient selection is `CLASS_NOTIFICATION_TO`, then the existing `ORDER_NOTIFICATION_TO` / `CONTACT_NOTIFICATION_TO`, then the existing business fallback. Signed waiver text is kept in the private admin roster rather than emailed.

Email runs after the registration is saved. SMTP failures are logged without rolling back the signup; no automatic mail retry is implemented. Replaying a registration request does not send duplicate emails. Local sample previews (`CLASSES_PREVIEW=true`) do not send mail. Integration tests use a local fake SMTP server and cover delivery, duplicate suppression, and failed delivery without losing the registration.

Neither payment provider is connected. Registrations have `paymentStatus: not_connected`; a redirect or registration submission never counts as payment. Pending requests do not hold seats. The owner must arrange payment separately and confirm a seat manually. Status changes do not send email. Displayed availability subtracts confirmed seats only.

When selecting a provider, add server-side checkout creation and verified payment reconciliation against registration IDs. Implement expiring seat holds and transactional confirmation before advertising instant booking. Preserve existing pre-made-item QuickBooks behavior. Recurring memberships, automated receipts/confirmation emails, refunds, and subscription lifecycle handling are not implemented by this classes release.

## Waiver setup

The production catalog starts empty and registration is disabled until the owner saves approved waiver wording, a version, and enables registration. Wording changes require a new version; previously signed copies are preserved. This implementation records typed signatures; it does not independently verify identity or certify legal enforceability. Confirm the business's required waiver process before launch.

This release is for adults signing for themselves. Each date-night participant registers separately at the per-person price. Paired booking/checkout and parent/guardian signing are not included. Add those flows if needed before opening classes to minors or selling couples-only packages.

## Storage and privacy

Production uses the existing PostgreSQL `admin_content` table with the private key `private-classes-state`. It is intentionally NOT allowed by the generic public content endpoints. Catalog edits and confirmations lock the row in a transaction, so concurrent confirmations cannot exceed capacity. Optimistic catalog revision checks prevent stale edits overwriting newer ones. Sessions with registrations cannot be removed/rescheduled; hide the class or close its session instead. Signed copies remain intact on cancellation.

Local development uses a separate atomic `classes.json` file in `IRONWORKS_DATA_DIR`; a process-local queue serializes writes. This local mode is not a multi-process production store. Production refuses to operate without `DATABASE_URL`. Image uploads reuse the existing authenticated storage service. Take normal database backups and define waiver/contact-data retention before launch. The public signup throttle is per process; use an edge/shared rate limiter for a multi-instance deployment.

## Validation

Run workspace type checks, frontend build, API build, then:

```sh
node artifacts/api-server/scripts/test-classes.mjs
```

The integration suite starts an isolated local API server with temporary test storage and checks authentication, record privacy, duplicate/retried submissions, signature validation, changed waivers, concurrent last-seat confirmations, cancellation, protected sessions, and persistence after restart. It does not access production data.

## Local preview

Use `NODE_ENV=development`, a dedicated `IRONWORKS_DATA_DIR`, development-only admin credentials, and `IRONWORKS_APP_STORAGE=false`. Build the frontend with `PORT` and `BASE_PATH=/`, build the API, then launch the API with `PORT`. Set `CLASSES_PREVIEW=true` for the visible demo banner when using sample data. This flag is ignored in production; no sample classes or waiver are seeded by application code.

## Remaining launch inputs

Real class descriptions, project photos, dates, capacity, location, duration, pricing, approved waiver, cancellation policy, payment provider/account configuration, and the final registration/confirmation workflow. Do not deploy the local sample catalog.
