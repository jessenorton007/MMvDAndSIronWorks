# Classes development

## Included

- `/classes` directory with category filters and `/classes/:slug` detail pages.
- Classes & Waivers tab in the existing authenticated admin panel.
- Draft/published classes, descriptions, prices per participant, ordered photo uploads, dates, capacity, and closed sessions.
- Adult self-registration with a typed signature and explicit electronic-signature consent.
- Exact waiver text, version, consent, signature, server timestamp, class, session, and quoted price saved per registration.
- Private registration roster with pending, confirmed, and cancelled states, search, and downloadable signed-waiver text.
- Public HTML metadata, correct detail-page status codes, and dynamic sitemap entries.

## Prerequisites and attendance

Beginner and Date Night require no prerequisite. Intermediate requires completed Beginner attendance; Advanced requires completed Intermediate attendance. The owner marks a confirmed registration completed after its session has started and after verifying actual attendance. The category is snapshotted on new registrations; classes with registrations cannot change category.

Restricted requests remain pending until the owner verifies a matching name/email completion record and explicitly approves eligibility. Server-side confirmation checks require that approval and its qualifying completion record. Payment and confirmed attendance alone never qualify. Customers do not need accounts; the owner is responsible for checking identity, especially shared emails or name changes. Historical students without website attendance records currently need their earlier attendance recorded through a future migration workflow before this automated evidence check can approve them.

After approval the owner creates and sends an individual invoice in QuickBooks, verifies payment there, then confirms the seat here. Approval itself sends no invoice or email and reserves no seat. Reusable restricted-class payment links are not exposed. This release does not create QuickBooks invoices or reconcile payments automatically. Completed attendance is protected from ordinary status changes.

## Payment handling

New registrations reuse the contact form's SMTP transport and `SMTP_*` settings. The owner receives a notification and the participant receives a request acknowledgment, explicitly stating that no seat is reserved and no payment is collected. Recipient selection is `CLASS_NOTIFICATION_TO`, then the existing `ORDER_NOTIFICATION_TO` / `CONTACT_NOTIFICATION_TO`, then the existing business fallback. Signed waiver text is kept in the private admin roster rather than emailed.

Email runs after the registration is saved. SMTP failures are logged without rolling back the signup; no automatic mail retry is implemented. Replaying a registration request does not send duplicate emails. Local sample previews (`CLASSES_PREVIEW=true`) do not send mail. Integration tests use a local fake SMTP server and cover delivery, duplicate suppression, and failed delivery without losing the registration.

QuickBooks hosted payment links are connected for Beginner and Date Night after signup. All four supplied URLs are retained in docs/class-payment-links.json and are editable per class in the admin panel; Intermediate and Advanced links remain private and are never returned to public signup responses. The owner sends individual invoices for those restricted classes. There is no automated payment reconciliation. Registrations have `paymentStatus: not_connected`; a redirect or registration submission never counts as payment. Pending requests do not hold seats. The owner must arrange payment separately and confirm a seat manually. Status changes do not send email. Displayed availability subtracts confirmed seats only.

When selecting a provider, add server-side checkout creation and verified payment reconciliation against registration IDs. Implement expiring seat holds and transactional confirmation before advertising instant booking. Preserve existing pre-made-item QuickBooks behavior. Recurring memberships, automated receipts/confirmation emails, refunds, and subscription lifecycle handling are not implemented by this classes release.

## Waiver setup

On November 17, 2026 the owner supplied `DandS_Ironworks_Adult_Blacksmithing_Waiver.pages`. All ten sections were extracted without rewriting into `docs/waivers/adult-2026-11-17.txt` and the launch catalog, version `2026-11-17-draft`. The original footer labels it a draft. The user explicitly requested keeping it staged: registration remains disabled. No real dates have been provided; draft classes may have no sessions, and the owner can add dates later in admin. New sessions default to five participants, or four people (two couples) for Date Night, with editable capacity.

The staged waiver enables the optional adult-information form: date of birth (age calculated at signing), address, city/state/ZIP, required phone, emergency contact name/phone, medical conditions, and medications. The server validates required fields and adult age. These fields are stored only with the private registration and included in the private signed-waiver view/download, never in notification emails or public responses. Changing whether these fields are required needs a new waiver version. Previously signed records remain unchanged. The class/session, participant name, typed signature, and signing timestamp supply the document's corresponding blanks.

The production catalog starts empty and registration is disabled until the owner saves approved waiver wording, a version, and enables registration. Wording changes require a new version; previously signed copies are preserved. This implementation records typed signatures; it does not independently verify identity or certify legal enforceability. Confirm the business's required waiver process before launch.

This release is for adults signing for themselves. Date Night is $210 per couple. All four hosted QuickBooks pages were read on October 30, 2026: Beginner $85, Intermediate $120, Advanced $160, and Date Night $210. These are the displayed payment amounts; no payment was made. Website price edits do not change the hosted checkout amount.

The first adult registers and receives the single payment link; the second enters that registration reference for the same session and signs independently. The second registration has no additional charge or checkout link. Only two active participants can share the reference. Both adults must sign before the owner can confirm the first registration, which reserves both seats in one transaction after verifying payment. If only one seat remains, neither is confirmed. Partners may share an email address but must each use their own name and signature. Cancel or mark the partner pending before changing the first participant's confirmed status. Classes with registrations cannot switch between individual and couple pricing. Parent/guardian signing is not included.

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

Final class descriptions, project photos, dates, capacity, location, duration, approved waiver, and cancellation policy. Checkout prices have been verified. Do not deploy the local sample catalog.

## Production setup and release verification

The current live site still returns 404 for /classes and /api/classes as of October 30, 2026. This branch has not been deployed.

1. Build the frontend and API using the existing production build. Keep the current production database and image bucket; do not copy work/classes-preview-data or use preview admin credentials.
2. The server requires NODE_ENV=production, DATABASE_URL with the existing admin_content table, ADMIN_PASSWORD, ADMIN_SESSION_SECRET, and DEFAULT_OBJECT_STORAGE_BUCKET_ID. Retain the existing SMTP_HOST, SMTP_PORT, SMTP_FROM (or ORDER_NOTIFICATION_FROM), SMTP_USER, SMTP_PASS, and transport settings. No new database table is required.
3. In Admin → Classes & Waivers, an empty catalog offers “Add Beginner, Intermediate, Advanced, and Date Night drafts.” This imports docs/classes-launch-catalog.json with verified prices and supplied links. It cannot overwrite existing classes, registrations, or waiver text. All listings start hidden, without dates, and registration disabled.
4. Add the client's final class details and photos, actual dates and participant capacity, and approved waiver wording/version. Date Night capacity counts people, not couples. Include the client's cancellation policy in the description or approved terms.
5. Open Launch checks in admin. The authenticated readiness endpoint checks configured database, photo-storage and SMTP settings and missing published-catalog inputs; it does not certify actual mail delivery, legal wording, or payment settlement.
6. Verify admin edits and an uploaded image persist after a restart, public listing/detail routes and sitemap work, unpublished classes remain hidden, and signed waivers/rosters remain private. Test live email delivery with the owner's authorized test addresses before opening public registration. Recheck checkout amounts if the client changes the links.
7. Review pending requests, verify payment in QuickBooks, then confirm seats and contact the customer. For Intermediate/Advanced, approve completed prerequisite attendance first and send an individual invoice. For Date Night, confirm both seats from the first registration after both waivers are present.

Local verification passed: frontend/API type checks, frontend/API production builds, and 10 integration tests. Tests use isolated local persistence and a fake SMTP server; production PostgreSQL, live App Storage, and actual inbox delivery remain deployment checks. The Vite build retains an existing non-blocking tooltip sourcemap warning.
