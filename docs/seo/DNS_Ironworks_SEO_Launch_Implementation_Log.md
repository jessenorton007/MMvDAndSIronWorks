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
