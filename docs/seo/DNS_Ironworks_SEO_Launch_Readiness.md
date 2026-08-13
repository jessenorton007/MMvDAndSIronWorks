# DNS Ironworks SEO Launch Readiness

**Prepared:** August 13, 2026
**Status:** Internal pre-implementation document. No website, DNS, Google account, analytics, or Business Profile changes were made.

## Evidence status

- **Verified:** Directly observed in the repository, live site, rendered page, or public search result.
- **Inferred:** Reasonable from verified evidence but not confirmed by client/account data.
- **Missing or requires access:** Must be supplied or verified before related work proceeds.

## 1. Concise client questions

These questions omit the already verified website phone, website email, displayed services, products, Facebook link, Etsy link, and public site brand.

1. **Missing:** Is the legal business name different from the public brand **D&S Iron Works**, and is “DNS Ironworks” only campaign shorthand?
2. **Missing:** What is the legitimate business base, and do customers visit it during posted hours, or is the company strictly a service-area business?
3. **Missing:** Which cities/counties are actually served for fabrication, installation, delivery, and pickup, and what is the practical maximum travel radius?
4. **Missing:** What public business hours and response-time statement are accurate?
5. **Missing:** Rank the top three services by priority and identify the highest-value/best-fit job and customer.
6. **Missing:** For each priority service, is the work fabricated only, installed, delivered, shipped, or picked up?
7. **Missing:** Which licenses, insurance, certifications, affiliations, warranties, financing, safety, installation, and delivery claims are verified and approved for publication?
8. **Missing:** How many years of relevant business/craft experience may be claimed, and what maker/team biography facts are approved?
9. **Missing:** Which completed project can support the first case study? Provide approved location level, scope, process/materials, outcome, media, and customer permission.
10. **Missing:** Which genuine customer testimonials/reviews may be reused with permission?
11. **Missing:** Which businesses does the client consider direct competitors in the real service area?
12. **Missing:** Which actions define a qualified lead, and who will report lead quality/closed work monthly?
13. **Missing:** Does any client Google account show a Business Profile, ownership request, verification attempt, suspension, or duplicate for this business?

## 2. Minimum account-access requests

The client should retain ownership and never share passwords.

| System | Minimum access requested | Reason | Status |
|---|---|---|---|
| GitHub repository | Write access to the specific repository/implementation branch | Prepare approved code changes and submit commits | Existing local remote verified; collaborator permission not audited |
| Replit project | Project collaborator/developer access sufficient to view deployment settings/logs and deploy approved builds; no billing access | Validate production behavior and deploy approved launch corrections | Missing |
| DNS/domain provider | Narrow DNS edit access for `dandsironworks.com`, or have the client make supplied records/redirect configuration | Search Console domain verification and preferred-host setup | Missing |
| Search Console | Client remains verified owner; grant Mojave Marketing **Full user** after property verification | View all reports, submit/test sitemap, inspect URLs, and validate fixes without user administration | Missing; [Google permission reference](https://support.google.com/webmasters/answer/7687615) |
| GA4 | **Editor** at the specific property during setup; reduce to Viewer/Analyst later if no configuration work remains | Configure data stream/settings and initial measurement; no user management | Missing; [Google role reference](https://support.google.com/analytics/answer/9305587) |
| Google Tag Manager, if used | Account **User** plus **Publish** on only the website container | Build, test, version, and publish initial tags without account administration | Missing; [Google GTM permission reference](https://support.google.com/tagmanager/answer/6107011) |
| Google Business Profile | **Manager**, only after the correct existing/eligible profile is confirmed | Edit profile content/posts/photos and respond to reviews; client retains primary ownership and user control | Missing; [Google GBP role reference](https://support.google.com/business/answer/3403100) |
| First-party analytics/admin | Read-only reporting access where supported | Reconcile current form/click activity without changing products/content | Missing |

If no GA4/GTM/Search Console property exists, create it under a client-owned Google account and invite Mojave Marketing with the minimum role above. Where a one-time action requires higher privileges, the client should perform that action or grant temporary access and remove it afterward.

## 3. Prioritized SEO Launch implementation checklist

All items below belong to the one-time SEO Launch and do not consume a Local Essentials monthly improvement.

### Critical

- [ ] Capture and archive the pre-change measurement baseline in Section 4.
- [ ] Deliver route-specific titles, descriptions, canonicals, social metadata, and supported schema in initial server HTML for all intended public templates.
- [ ] Return a real `404` status and useful not-found page for unknown/removed routes; use `410` only when intentionally appropriate.
- [ ] Protect `/admin` operationally and deliver `noindex` on any reachable admin response; do not rely only on `robots.txt`.
- [ ] Redirect or remove `/preview.html` so it cannot operate as a duplicate homepage.

### High

- [ ] Establish the preferred apex host and permanently redirect `www` to `https://dandsironworks.com/` after DNS approval.
- [ ] Reconcile sitemap URLs with actual indexable routes, use truthful `lastmod` values, and submit/test the sitemap in Search Console.
- [ ] Verify Search Console under client ownership and document property/access status.
- [ ] Install/configure GA4 and initial conversion events with privacy approval; validate in DebugView/realtime and document event definitions.
- [ ] Define intent versus completed-sale events so Etsy/QuickBooks clicks are never reported as confirmed orders.
- [ ] Review Google/Maps and client accounts for an existing, duplicate, hidden, suspended, or unverified profile; set up an eligible profile only if none valid exists and facts are confirmed.
- [ ] Record initial Search Console, GA4, GBP, technical, and first-party benchmarks.

### Medium

- [ ] Correct visible Markdown characters and paragraph/list rendering in rocket-stove descriptions.
- [ ] Remove unreliable Etsy “people have this in their cart” copy and prevent volatile stock/cart claims from being imported.
- [ ] Validate robots, structured data, rendered content, internal links, forms, mobile behavior, and key outbound links after changes.
- [ ] Record deployment commit, test results, approval, and rollback path.

## 4. Proposed pre-change measurement baseline

Record the retrieval date/time, source, date range, property/account, and “unavailable” status for every field. Never convert unavailable data to zero.

### Technical and indexability

- Git commit and production build identifier.
- Status, redirect chain, final URL, title, description, canonical, robots directive, H1, and indexable text for each route template and a sample of every route group.
- Results for `/`, HTTP apex, HTTPS `www`, `/preview.html`, `/admin`, and at least two nonexistent URLs.
- `robots.txt` body/status; sitemap status, URL count, URL inventory, `lastmod`, and sitemap-to-route reconciliation.
- Raw versus rendered metadata/schema for homepage, services hub, one service, one pre-made product, one shop product, contact, admin, preview, and not-found.
- Broken internal/outbound links and image failures discovered in a crawl.
- Mobile screenshots/functional checks at a documented viewport.
- Lighthouse lab diagnostics for homepage, priority service, product, and contact; record device/profile/tool version. Keep lab data separate from field data.
- Search Console Core Web Vitals/CrUX field status if available.

### Search Console

- Property type, verified owner, access date, sitemap status, indexed/not-indexed totals and reasons, crawl/security/manual-action status.
- Performance for the last 28 days and the longest meaningful comparison available: total clicks, impressions, CTR, and average position.
- Top queries and pages with clicks/impressions/CTR/position; device and country breakdown.
- Branded versus non-branded classification documented by query rules.
- URL Inspection for the main route templates: indexed URL, Google-selected canonical, last crawl, rendered status, and enhancements.

### GA4 and initial conversions

- Property/data-stream IDs, timezone, currency, tag status, internal-traffic configuration, referral exclusions, data retention, and consent/privacy decision.
- Last 28 days and available comparison: users, sessions, organic users/sessions, engaged sessions, engagement rate, and top organic landing pages.
- Existing events/key events with counts and their definitions.
- Test result for contact success, phone, text, email, quote/pre-made intent, QuickBooks outbound, Etsy shop outbound, and Etsy product outbound.
- Document which events represent intent, submitted leads, or externally completed transactions.

### Google Business Profile

- Public-search result and exact search terms/date.
- Client-account ownership/verification/duplicate/suspension status.
- If a valid profile exists: profile URL/place ID, public name, primary/secondary categories, address visibility/service area, hours, phone, website, services/products, description, photo count, review count/rating, latest review/date, posts, and profile completeness observations.
- Available GBP performance for the longest comparable period: views/searches, calls, website clicks, messages, bookings/directions where applicable. Record unavailable metrics explicitly.

### Leads and business outcomes

- First-party form submissions by type and date range.
- Phone/text/email/QuickBooks/Etsy click counts where reliably available.
- Client-reported qualified leads and closed work, with source confidence and limitations.
- Current response workflow, responsible person, and lead-quality definition.

### Public visibility

- Record limited manual branded/name/phone searches only as discovery checks, not as a ranking report.
- If local rank-grid software is approved separately, record tool, coordinates, query, date, and settings; otherwise do not manufacture a rank baseline.
- Record known citation/name-phone-site inconsistencies found from reliable public sources.

## 5. Startup corrections safe after approval

### Ready after technical/content approval; no missing business facts required

1. Correct real 404 behavior.
2. Redirect/remove `/preview.html`.
3. Protect/noindex `/admin` without disrupting authenticated use.
4. Deliver current, already-approved route metadata/canonicals in server HTML.
5. Correct visible Markdown rendering without rewriting factual product claims.
6. Remove Etsy cart-count strings and prevent future volatile imports.
7. Reconcile sitemap mechanics and truthful modification dates.
8. Add initial intent-event definitions that do not claim external sales, subject to privacy approval.

### Requires access or client facts before execution

1. `www` DNS/redirect setup requires DNS access or client action.
2. Search Console verification/sitemap submission requires client-owned property and access.
3. GA4/GTM publication requires account access and privacy/measurement approval.
4. GBP setup requires business name/base/service-area/category facts, account/duplicate review, eligibility, and client verification.
5. LocalBusiness schema expansion requires verified base/service area, hours, and approved facts.

## 6. Corrections to the existing audit and roadmap

- **Corrected:** All listed technical corrections, Search Console/sitemap, GA4/initial conversions, initial GBP review/setup, visible Markdown, Etsy cart-count cleanup, and benchmark documentation are explicitly SEO Launch work.
- **Corrected:** The audit no longer suggests that route-delivery architecture may be separately scoped; the approved route-specific server metadata/canonical and 404 work is allocated to SEO Launch.
- **Corrected:** Month 3 is ongoing local trust, GBP content, and genuine-review guidance, not initial GBP setup.
- **Corrected:** Month 6 may strengthen the best-performing organic page when that is more evidence-based than conversion-path work.
- **Corrected:** GBP status now records the limited public investigation: no matching public result found, while account-only/hidden/duplicate status remains unknown.
- **Clarified:** Search Console Full user, GA4 Editor, GTM container Publish, and GBP Manager are the minimum operational roles; the client retains ownership/user administration.
- **Still valid:** Competitors and local keyword targets remain provisional until the legitimate service market is confirmed.

## 7. Required before the August 26 client meeting

### Must be completed

- [ ] Obtain answers to the concise client questions, especially name, location/service-area arrangement, priority services, hours, and GBP history.
- [ ] Confirm which client-owned Google account will own Search Console, GA4/GTM if used, and GBP.
- [ ] Complete the client-account GBP/duplicate check and document the result; do not create a profile prematurely.
- [ ] Obtain minimum account permissions or assign named client actions where access will not be delegated.
- [ ] Secure written approval for the prioritized SEO Launch correction package and measurement/privacy approach.
- [ ] Capture every available pre-change baseline before deployment.
- [ ] Finalize the six-month roadmap with the Month 1 priority service and one candidate project story.
- [ ] Prepare the client-facing August 26 plan only after facts, scope allocation, and limitations are approved.

### Ideally completed, but report transparently if delayed

- [ ] Implement and validate the approved safe startup corrections.
- [ ] Verify Search Console, submit sitemap, and validate key templates.
- [ ] Configure/test GA4 and initial conversion events.
- [ ] Complete initial GBP setup only if no valid profile exists, eligibility is confirmed, and the client can complete verification.

If account access or GBP verification is delayed, the meeting plan should identify the dependency, owner, and next date. It should not replace missing baselines with assumptions or delay unrelated approved technical launch work.
