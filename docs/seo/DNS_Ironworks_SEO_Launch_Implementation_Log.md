# D&S Iron Works SEO Launch Implementation Log

**Implementation date:** August 19, 2026  
**Repository:** `jessenorton007/MMvDAndSIronWorks`  
**Preferred origin:** `https://dandsironworks.com/`  
**Status:** Technical implementation and production routing verified complete on August 21, 2026. Search Console, GA4 account validation, and GBP verification remain client/account actions.

## Evidence labels

- **Verified:** Observed in source, a completed test, the August 13 baseline, or the August 21 production closeout.
- **Inferred:** Reasonable conclusion that still needs production confirmation.
- **External action:** Requires deployment, DNS, client account access, or a third-party account.

## Current confirmed campaign facts

- Public brand target: **D&S Iron Works**.
- Business priorities: **1. pre-made products; 2. custom designs/custom projects; 3. custom furniture**.
- Primary local SEO target: **Custom Designs / Custom Projects**.
- Search Console: an existing property is established; account reports and sitemap-submission status were not available during this verification.
- GA4: active with Measurement ID `G-QW2GMHN0GZ`.
- Google Business Profile: an existing profile has been created and verification has started. Do not create a duplicate.

## Pre-change baseline

The August 13, 2026 audit remains the pre-change live baseline:

| Baseline item | Recorded result |
|---|---|
| Intended public URLs | 53 URLs in the XML sitemap |
| Raw HTML route identity | All 53 sitemap URLs returned the same 2,569-byte homepage shell, homepage title, and homepage canonical |
| Unknown route | Returned `200` with the homepage shell instead of `404` |
| `/preview.html` | Returned `200` as a duplicate homepage |
| `/admin` | Returned the public app shell; robots blocked crawling but the source directive was `index, follow` |
| Preferred scheme | HTTP apex redirected to HTTPS apex |
| `www` host | Did not resolve during the August 13 audit |
| Sitemap dates | Every URL carried the same unverified `lastmod` date |
| GA4/GTM | At the August 13 pre-change baseline, no implementation or measurement ID was found; GA4 is now connected as documented below |
| Search Console | At the August 13 pre-change baseline, verification/account data was unavailable; an existing property is now confirmed |
| GBP | The August 13 limited public check was inconclusive; an existing profile is now confirmed and verification has started |
| Conversion definitions | No governed GA4 definitions; first-party event collection existed |
| Mobile performance | No field baseline available; media load was identified only as a possible issue, not a measured failure |

On August 19, source and repository state were reverified before implementation. A fresh live fetch was attempted, but the local Windows TLS client could not establish credentials for the domain. The August 13 live responses are therefore retained as the documented before-state; production verification is required immediately after deployment.

## Technical launch changes

### Route delivery and status codes

- Added a server route registry for the homepage, services hub, seven service pages, three pre-made products, contact page, 40 Etsy product pages, and admin route.
- Each known public route now receives its own server-delivered title, description, canonical, Open Graph data, Twitter data, crawlable H1/summary fallback, and supported JSON-LD where applicable.
- Unknown non-API routes now return an HTML response with HTTP `404`, `noindex, nofollow`, and an `X-Robots-Tag` header.
- `/preview.html` now permanently redirects to `/`.
- Trailing-slash variants now permanently redirect to their canonical no-trailing-slash URL, except the root URL.
- Requests for `www.dandsironworks.com` now permanently redirect to the apex origin when DNS sends them to the application.

### Admin controls

- `/admin` now requires a valid server admin session before its HTML is served; unauthenticated requests redirect to `/`.
- Authenticated admin HTML receives `noindex, nofollow, noarchive` in both meta robots and `X-Robots-Tag`.
- `robots.txt` no longer blocks `/admin`, allowing crawlers to receive the noindex response. Authentication remains the security control.
- Existing admin API write routes continue to require the signed admin session cookie.

### Sitemap and robots

- The sitemap remains limited to the 53 canonical, intended public routes.
- Unreliable `lastmod`, `changefreq`, and `priority` declarations were removed.
- The production build now regenerates the sitemap against `https://dandsironworks.com`.
- `robots.txt` allows public crawling and references the apex sitemap.

### Structured data

- Server HTML now delivers LocalBusiness on the homepage, Service on service routes, and Product on pre-made/Etsy product routes.
- Unsupported review/rating claims were not added.
- Unverified product availability was removed from Product offers.

## Content and page changes

- Selected `/services/custom-ironwork-utah` as the Month 1 priority page because it already consolidates custom furniture, architectural ironwork, fire pits, signs, and art without creating duplicate city pages.
- Updated its title, description, H1, introduction, real project gallery, three-step project process, Southern/central Utah service context, related-service links, and request-a-quote path.
- Used only confirmed service areas supplied by the client, with a short representative set rather than repetitive city lists.
- Added contextual links to railings, custom fire pits, metal signs, forged metal art, and commission pages.
- Added a safe description formatter for paragraphs, simple bullet lists, and bold Markdown so saved product copy no longer exposes `**` or `*` markers.
- Removed volatile Etsy cart-count badges from public product grids and product pages, and filtered volatile stock/cart notes from public details.

## Measurement implementation

GA4 was activated on August 19, 2026, using Measurement ID `G-QW2GMHN0GZ`. The ID is the production default, and `VITE_GA4_MEASUREMENT_ID` can override it for a different deployment when needed.

| Event | Meaning | Trigger |
|---|---|---|
| `generate_lead` | Submitted lead | Contact form has been successfully saved |
| `contact_intent` | Contact intent | Phone, email, SMS, or marked quote/contact CTA click |
| `shopping_intent` | Shopping intent | Outbound Etsy click |

These events do not claim an Etsy sale, QuickBooks payment, or completed order. Existing first-party analytics remains separate.

## Performance sanity check

- Existing videos on product/process areas use deferred loading (`preload="none"`) and posters.
- The implementation did not introduce a new font, library, large image, autoplay video, or city-page bundle.
- The production build showed that admin analytics code was included in the public entry chunk. The authenticated admin route is now lazy-loaded: the main minified JavaScript chunk fell from 692.90 KB (205.44 KB gzip) to 614.21 KB (188.85 KB gzip), with the 79.35 KB admin chunk loaded only when needed.
- The main chunk still exceeds Vite's 500 KB advisory threshold. No broad media or route rewrite was made because field data has not identified the highest-impact visitor bottleneck. That work remains the Month 5 measured improvement.

## Local verification results

- Frontend TypeScript check: passed.
- API TypeScript check: passed.
- Frontend production build: passed.
- API production build: passed.
- Sitemap check: 53 routes, 53 unique canonicals, zero non-200 responses, zero missing titles, and zero canonical mismatches against the local production server.
- Redirect/status checks: unknown route `404`; `/preview.html` `301`; trailing slash `301`; unauthenticated `/admin` `302`; authenticated `/admin` `200` with meta and header noindex; `www` host `301` to apex.
- Automated in-app visual inspection could not be completed because the local browser-control runtime rejected its own trusted dependency path. No production browser or deployment was substituted. Mobile visual review remains a post-deployment check.

## Production verification closeout - August 21, 2026

**Repository state during closeout:** GitHub `main` at `e8ad654`; live response behavior was verified directly against `https://dandsironworks.com`.

| Check | Production closeout result |
|---|---|
| Sitemap inventory | 53 URLs, 53 unique URLs, no admin, no preview, no fabricated `lastmod` values |
| Intended route statuses | All 53 intended routes returned `200` |
| Server-delivered canonicals | Passed: 53 exact, unique apex canonicals; zero homepage canonical leakage |
| Server-delivered titles | Passed: every route has a title and no non-home route receives the homepage title. There are 49 distinct strings because six Etsy routes share three listing names. |
| Crawlable fallback/H1 | Passed on all 53 intended routes |
| Unknown route | Passed: `404` with header and HTML `noindex, nofollow` |
| `/preview.html` | Passed: `301` to `/` |
| `/admin` | Passed unauthenticated production check: `302` to `/` with `X-Robots-Tag: noindex, nofollow, noarchive`. Authenticated HTML was not tested because no production password was used. |
| `www` host | Passed: direct HTTPS request returned `301` to the matching apex URL and preserved the query string |
| `robots.txt` | Passed: public crawling allowed and the apex sitemap is referenced |
| Structured data | Passed JSON parsing and expected type checks for representative LocalBusiness, Service, and Product pages |
| GA4 production implementation | Active as `G-QW2GMHN0GZ`; Realtime/DebugView and event/key-event validation remain account actions |
| Contact API | The live API responds; a real form submission/email was not generated during this read-only verification |

### Resolved Replit routing issue

Replit now sends public HTML routes through the SEO-aware Express application. The prior static frontend catch-all no longer controls production route identity. The production verifier now reads the live sitemap, tests all 53 live URLs, checks route identity and indexing controls, calls `www` directly, and validates representative JSON-LD.

## Post-deployment verification checklist

- [x] Confirm all 53 intended routes return route-specific source titles, exact canonicals, and crawlable H1 summaries.
- [x] Confirm a random unknown route returns `404` and `X-Robots-Tag: noindex, nofollow`.
- [x] Confirm `/preview.html` returns `301` to `/`.
- [x] Confirm an unauthenticated `/admin` request redirects with a server noindex header. Authenticated verification remains optional and requires a production credential.
- [x] Confirm `www` resolves and returns `301` to apex.
- [x] Validate `robots.txt`, live sitemap inventory, and all sitemap URLs in production.
- [x] Parse representative LocalBusiness, Service, and Product JSON-LD in production.
- [ ] Run Rich Results Test on the homepage, priority service page, and representative product pages.
- [ ] Inspect the priority page and contact flow at mobile and desktop widths.
- [ ] Test contact form storage/email delivery without exposing credentials.

## External actions still required

1. In the existing Search Console property, submit or reconfirm `https://dandsironworks.com/sitemap.xml`, inspect the priority URL set below, and request indexing only after each inspection reports the intended canonical.
2. Validate GA4 `G-QW2GMHN0GZ` in Realtime/DebugView and mark only the approved lead/intent events as key events.
3. Continue verification of the existing Google Business Profile. Do not create another profile.
4. Record Search Console, GA4, GBP, and qualified-lead baselines when account access exists. Unavailable data must remain labeled unavailable.

## Current measurement baseline availability

| Source | Current baseline |
|---|---|
| Production technical | 53-route production PASS captured in the August 21 closeout table above |
| Search Console clicks, impressions, CTR, position, queries, pages, indexing | Existing property confirmed; metrics unavailable in this task, not zero |
| GA4 users, sessions, organic traffic, landing pages, lead events | Production tag confirmed; account metrics unavailable in this task, not zero |
| Accurate GA4 measurement start | Production implementation confirmed on August 21; first received-event date must be read from GA4 |
| GBP name/category/reviews/rating/service areas/photos/performance | Existing profile and verification attempt confirmed; details unavailable in this task, not zero |
| Reliable lead and closed-job totals | Unavailable in this task, not zero |

## Search Console submission set

After production verification, inspect and request indexing only after Search Console reports the intended response and user-declared canonical:

- `https://dandsironworks.com/`
- `https://dandsironworks.com/services`
- `https://dandsironworks.com/services/custom-ironwork-utah`
- `https://dandsironworks.com/services/forged-railings`
- `https://dandsironworks.com/pre-made/pre-built-fire-pits`
- `https://dandsironworks.com/pre-made/iron-rocket-stove`
- `https://dandsironworks.com/contact`

Submit the sitemap once; do not manually request all 53 URLs unless Search Console evidence shows a specific indexing problem.

## September 21, 2026 — Service content and crawlable links

Continued from the D and S Ironworks task after its context window was exhausted. Starting local and fetched GitHub main: 8881b7f7f894b77ede770603d6a7dec2d3101c56. Production routing baseline remains PASS across 53 URLs.

Implemented:
- Initial HTML now includes full service summaries, details, examples, existing photo galleries, process steps, service-area notes, and related links. The services directory exposes all seven service links before JavaScript executes.
- Added nine visible questions/answers and three quote checklists across custom fire pits, forged railings, and custom metal signs. Added a custom-to-pre-built fire pit comparison link and nine additional related-service links (14 total).
- Replaced service directory cards, related-service buttons, All Services navigation, and service quote CTAs with actual links.
- Service HTML and metadata now read the existing admin service collection, matching the client rather than serving stale build-time wording. Missing fields inherit defaults; existing values and explicit empty arrays remain authoritative. No production data was overwritten.
- Added IRONWORKS_ANALYTICS_FILE for isolated preview analytics. Production defaults are unchanged.
- Added scripts/verify-service-content.mjs alongside the existing route verifier.

Validation:
- Frontend and API TypeScript: PASS.
- Frontend and API production builds: PASS. The Windows build used a local, ignored esbuild-wasm 0.27.3 adapter because native esbuild could not enumerate a parent directory. Production manifests and lockfile are unchanged. Existing large bundle warning remains; Vite also emitted a non-fatal tooltip sourcemap warning.
- Existing production site: 53 routes, canonicals, redirects, public admin protection/noindex, robots, sitemap, and representative schema PASS. Production authenticated admin was not tested.
- Fresh built local server with a read-only copy of live public service collection version 48: all 53 routes PASS, including authenticated local admin/noindex.
- New service-content verifier: 7 services, 9 questions, 14 related-service links PASS.
- Local fixture checks: edited service title honored; markup escaped; explicit empty FAQ/link arrays honored; removed service returns 404. Fixture restored afterward.
- Browser: railing page renders quote checklist, answers, gallery, and related links in the existing design.

Measurement and next work:
- No ranking, organic traffic, lead, or AI citation increase has been measured or promised. Search Console/GA4 account baselines remain unavailable in this task.
- Google documents the same core SEO requirements for AI Overviews and AI Mode; useful text and internal links support eligibility, but inclusion is not guaranteed: https://developers.google.com/search/docs/appearance/ai-features
- Deploy frontend and API together through the established Replit application workflow; this task has not deployed production. After deployment, run both verifiers with SEO_TEST_ORIGIN=https://dandsironworks.com. Omit ADMIN_PASSWORD unless explicitly validating authenticated production admin.
- Record the deployment date, then compare Search Console page/query data and organic leads across comparable 28-day periods, accounting for indexing time and seasonality. Verify GBP status and collect approved real project facts/specifications before adding claims, lead times, prices, locations, or testimonials.
- Repository remains C:\Users\jesse\Documents\Codex\2026-06-01\identify-my-forge-design-project-and\Forge-Design-Studio. Local preview for this batch: http://127.0.0.1:5189/services/forged-railings ; preview data and analytics live under ignored work/seo-preview.

Publishing status: normal Git push could not complete; gh auth status reports an invalid saved token. The connected GitHub integration authenticated successfully but create_tree returned HTTP 403 Resource not accessible by integration. No remote branch was changed and no deployment occurred. Refresh GitHub CLI authentication with repository write access, then run a normal fetch/integration and push; never force-push. Local main holds the verified changes.

## September 22, 2026 — Product answers, project evidence, images, and measurement

Implemented in the local repository; production has not been deployed:

- Added eight more service questions, quote checklists, and related links. Together with the previous batch: seven services, 17 visible answers, and 22 related-service links.
- Added three pre-made product guides with nine buying questions, regular/XL cooking-surface comparisons, and six related links. Dimensions are transcribed from the public saved product descriptions (premade-products version 8), not inferred from photos. Update `src/data/product-guides.ts` whenever those specifications change, then regenerate server data/build both artifacts.
- Added `/projects/forged-stair-balcony-railings`, based on the existing shop and installed railing photos. No invented client, town, project date, cost, testimonial, or outcome. Facebook could not be read in this session. The project is linked from the home and railing pages and included in the 54-route sitemap.
- Server-rendered product HTML and Product/Offer metadata now use the saved public product collections, matching current browser content. Exact numeric prices only; no guessed stock status, reviews, ratings, shipping charges, or price ranges. Shared pure helpers keep client/server metadata consistent. Obvious test-only feature filler is excluded from public views without altering the stored data.
- Homepage product/service cards and primary navigation expose real links. Initial homepage HTML also links to all saved public services and products. Canonicals remain on https://dandsironworks.com. Missing client-side detail routes retain noindex and their own URL.
- Created responsive WebP variants for 50 repository photos, with original-image fallback and original full-size lightbox assets retained. Large variants total 12,558,576 bytes versus 51,266,126 bytes for originals (75.5% smaller). This is a file-size comparison, not measured page-speed or ranking improvement. Admin uploads remain untouched. Regeneration: `python artifacts/ironworks/scripts/optimize-images.py` with Pillow installed.
- Images below the first viewport load lazily; main service/product images receive high priority. Mobile and reduced-motion users receive a still homepage background without mounting/downloading the desktop autoplay video.
- Public routes load in separate JavaScript chunks. Main entry decreased from 618.96 kB (190.13 kB gzip) to approximately 452.04 kB (147.57 kB gzip). Each page also loads its own/shared chunks, so entry size is not the total transfer size. Route scroll handling waits for the lazy route to mount.
- Fixed GA4's command queue shape, excluded localhost/preview domains, added page context and named CTA context. Pre-made purchase opening emits `begin_checkout`; a saved purchase request emits `generate_lead`; an external payment handoff emits `payment_redirect`. These are not confirmed payments. Existing successful contact-form lead tracking remains. No customer form fields are added to GA4 events.

Validation:

- Frontend/API TypeScript and production builds: PASS. The same ignored Windows esbuild-wasm adapter was necessary. A pre-existing nonfatal tooltip sourcemap warning remains.
- Route verifier: all 54 routes/canonicals pass, plus redirects, robots, sitemap, unknown-route 404, and isolated authenticated/unauthenticated admin checks. There are 50 distinct titles because four existing Etsy variants share product names; product identities were preserved.
- Service verifier: seven services, 17 answers, 22 related links PASS.
- Product verifier: 43 saved products, nine product answers, project content, exact-price parsing, public feature filtering, and all responsive image assets PASS.
- Local-only fixture changes: edited product heading and price respected; markup escaped; empty feature/gallery arrays respected; deleted product returns 404 and disappears from initial homepage links. Fixture restored afterward. No production records were edited.
- GA4 unit verification: proper arguments queue, one initialization, production hosts, event page context, and preview exclusion PASS. This does not confirm receipt in GA4 reporting.
- Mobile browser: homepage, railing service, project, and regular stove render within the viewport; menu and project navigation work; purchase form opens. Homepage has zero hero video elements on mobile, selects the 640px image variant, and does not insert a GA4 script on localhost. No real contact, purchase, or payment was submitted.
- Chrome DevTools performance tools are unavailable, so no Lighthouse/Core Web Vitals trace or score is claimed.

External follow-up and release:

1. GitHub CLI authentication remains invalid. Refresh it with access to jessenorton007/MMvDAndSIronWorks, fetch, integrate any new changes, and use a normal push. Do not force-push. The previous GitHub connector write attempt was also denied by repository integration permissions.
2. Deploy frontend and API together through the established Replit workflow. Do not replace or seed the production admin database with the preview fixtures.
3. Run `verify-seo-routes.mjs`, `verify-service-content.mjs`, and `verify-product-content.mjs` with `SEO_TEST_ORIGIN=https://dandsironworks.com` after deployment. Confirm the project URL and current product prices in both HTML and browser.
4. The signed-in Search Console account has no access to the dandsironworks.com property. Switch to its owner account before querying impressions, clicks, queries, indexing, or submitting the updated sitemap. Unavailable is not zero. Inspect the new project and key changed pages after deployment; don't request indexing for every URL without evidence.
5. In the correct GA4 property, verify contact/purchase leads and contact/Etsy intent events with a deliberate test, confirm `generate_lead` as a key event, and compare organic landing pages/leads over comparable 28-day periods. Phone/SMS/Etsy clicks indicate intent, not completed jobs. No ranking, AI citation, organic traffic, or revenue improvement has yet been measured.
