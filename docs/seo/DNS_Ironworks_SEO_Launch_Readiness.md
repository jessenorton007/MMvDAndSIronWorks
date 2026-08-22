# DNS Ironworks SEO Launch Readiness

**Prepared:** August 13, 2026
**Status:** Historical pre-implementation document. Current production results are maintained in `DNS_Ironworks_SEO_Launch_Implementation_Log.md`.

**Current status correction (August 21, 2026):** The public brand target is **D&S Iron Works**. Priorities are pre-made products, custom designs/custom projects, and custom furniture; the primary local SEO target is **Custom Designs / Custom Projects**. Search Console is established, GA4 is active as `G-QW2GMHN0GZ`, and an existing GBP is in verification. Replit production routing is fixed and the 53-route technical verification passes.

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
5. **Partially verified:** Priorities are pre-made products, custom designs/custom projects, and custom furniture. Identify the highest-value/best-fit job and customer from reliable business data.
6. **Missing:** For each priority service, is the work fabricated only, installed, delivered, shipped, or picked up?
7. **Missing:** Which licenses, insurance, certifications, affiliations, warranties, financing, safety, installation, and delivery claims are verified and approved for publication?
8. **Missing:** How many years of relevant business/craft experience may be claimed, and what maker/team biography facts are approved?
9. **Missing:** Which completed project can support the first case study? Provide approved location level, scope, process/materials, outcome, media, and customer permission.
10. **Missing:** Which genuine customer testimonials/reviews may be reused with permission?
11. **Missing:** Which businesses does the client consider direct competitors in the real service area?
12. **Missing:** Which actions define a qualified lead, and who will report lead quality/closed work monthly?
13. **Partially verified:** An existing Business Profile has been created and verification started. Confirm ownership, verification outcome, and whether any duplicate/suspension issue exists.

## 2. Minimum account-access requests

The client should retain ownership and never share passwords.

| System | Minimum access requested | Reason | Status |
|---|---|---|---|
| GitHub repository | Write access to the specific repository/implementation branch | Prepare approved code changes and submit commits | Existing local remote verified; collaborator permission not audited |
| Replit project | Project collaborator/developer access sufficient to view deployment settings/logs and deploy approved builds; no billing access | Validate production behavior and deploy approved launch corrections | Missing |
| DNS/domain provider | Narrow DNS edit access for `dandsironworks.com`, or have the client make supplied records/redirect configuration | Preferred-host correction and future DNS validation | Access not audited; both apex and `www` currently resolve |
| Search Console | Client remains verified owner; grant Mojave Marketing **Full user** if operational access is approved | View reports, confirm sitemap submission, inspect URLs, and validate fixes without user administration | Property established; account access/report data not verified in this task; [Google permission reference](https://support.google.com/webmasters/answer/7687615) |
| GA4 | **Editor** only while configuration is required; reduce to Viewer/Analyst afterward | Validate the connected stream and initial measurement; no user management | Connected as `G-QW2GMHN0GZ`; account access/report data not verified in this task; [Google role reference](https://support.google.com/analytics/answer/9305587) |
| Google Tag Manager, if used | Account **User** plus **Publish** on only the website container | Build, test, version, and publish initial tags without account administration | Missing; [Google GTM permission reference](https://support.google.com/tagmanager/answer/6107011) |
| Google Business Profile | **Manager**, only after the correct existing profile is confirmed | Edit profile content/posts/photos and respond to reviews; client retains primary ownership and user control | Existing profile; verification started; do not create a duplicate; [Google GBP role reference](https://support.google.com/business/answer/3403100) |
| First-party analytics/admin | Read-only reporting access where supported | Reconcile current form/click activity without changing products/content | Missing |

Use the existing Search Console, GA4, and Google Business Profile. Do not create duplicates. Where a one-time action requires higher privileges, the client should perform that action or grant temporary access and remove it afterward.

## 3. Prioritized SEO Launch implementation checklist

All items below belong to the one-time SEO Launch and do not consume a Local Essentials monthly improvement.

### Critical

- [x] Capture and archive the available pre-change technical baseline. Account metrics remain unavailable, not zero.
- [x] Implement route-specific titles, descriptions, canonicals, social metadata, and supported schema in the application server. Production is still bypassing that server.
- [x] Implement and verify real `404` handling in production.
- [x] Implement and verify `/admin` protection and server `noindex` for unauthenticated production requests.
- [x] Implement and verify the `/preview.html` permanent redirect in production.

### High

- [x] Implement and verify the preferred-apex redirect in production.
- [ ] Sitemap inventory and truthful dates are correct; confirm submission/status in the existing Search Console property.
- [x] Search Console is established. Property access and report data were not available in the August 21 verification task.
- [ ] GA4 and initial conversion events are installed as `G-QW2GMHN0GZ`; Realtime/DebugView validation and privacy approval remain.
- [x] Define intent versus completed-sale events so Etsy/QuickBooks clicks are never reported as confirmed orders.
- [x] Identify the existing GBP and begin verification. Confirm ownership/duplicates and do not create another profile.
- [ ] Technical baseline is recorded; Search Console, GA4, GBP, and reliable lead benchmarks require account/report access.

### Medium

- [x] Correct visible Markdown characters and paragraph/list rendering in rocket-stove descriptions.
- [x] Remove unreliable Etsy “people have this in their cart” copy and prevent volatile stock/cart claims from being shown publicly.
- [ ] Validate robots, structured data, rendered content, internal links, forms, mobile behavior, and key outbound links after changes.
- [x] Record deployment state and passing production test results.

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

- [ ] Obtain remaining client facts, especially location/service-area arrangement, hours, trust claims, and project-story approval. Public name and priorities are confirmed.
- [x] Search Console, GA4, and GBP already exist under client control; confirm only the minimum operational access needed.
- [ ] Complete verification and duplicate/ownership review for the existing GBP. Do not create another profile.
- [ ] Obtain minimum account permissions or assign named client actions where access will not be delegated.
- [ ] Secure written approval for the prioritized SEO Launch correction package and measurement/privacy approach.
- [ ] Capture every available pre-change baseline before deployment.
- [ ] Finalize the six-month roadmap with the Month 1 priority service and one candidate project story.
- [ ] Prepare the client-facing August 26 plan only after facts, scope allocation, and limitations are approved.

### Ideally completed, but report transparently if delayed

- [ ] Implement and validate the approved safe startup corrections.
- [ ] Confirm sitemap submission in the existing Search Console property and validate the priority URL set.
- [ ] Validate the installed GA4 events in Realtime/DebugView.
- [ ] Complete verification and optimization of the existing GBP; do not create another profile.

If account access or GBP verification is delayed, the meeting plan should identify the dependency, owner, and next date. It should not replace missing baselines with assumptions or delay unrelated approved technical launch work.
