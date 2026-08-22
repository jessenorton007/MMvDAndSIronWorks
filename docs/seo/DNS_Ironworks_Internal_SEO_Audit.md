# DNS Ironworks Internal SEO Audit

**Prepared for:** Mojave Marketing
**Audit date:** August 13, 2026
**Campaign:** SEO Launch plus 26-week Local Essentials
**Status:** Historical pre-change audit. See `DNS_Ironworks_SEO_Launch_Implementation_Log.md` for the current August 21 production result.

**Current status correction (August 21, 2026):** The public brand target is **D&S Iron Works**. Priorities are pre-made products, custom designs/custom projects, and custom furniture; the primary local SEO target is **Custom Designs / Custom Projects**. Search Console is established, GA4 is connected as `G-QW2GMHN0GZ`, and an existing Google Business Profile is in verification. The route-delivery problem described below remains visible in production because Replit is serving a static frontend catch-all instead of the SEO-aware application server.

## Evidence labels

- **Verified:** Directly observed in the repository, live HTTP response, rendered live page, or cited public source.
- **Inferred:** A reasonable conclusion from verified evidence, but not proven by account data or client confirmation.
- **Missing or requires access:** Cannot be established reliably from the repository and public website.

## 1. Executive summary

The site has a stronger starting foundation than a typical launch-stage local business site: it uses HTTPS, has a crawlable robots file, a 53-URL sitemap, dedicated service and product routes, descriptive page content, genuine-looking project media, tap-to-call actions, contact forms, and LocalBusiness, Service, Product, and ItemList JSON-LD in the React application. The repository type-checks successfully.

The highest-risk issue is route delivery. Every tested sitemap URL and a nonexistent URL return the same `200 OK`, the same 2,569-byte HTML shell, homepage title, homepage canonical, and empty React root before JavaScript executes. Google can render JavaScript, but this implementation gives crawlers and non-rendering clients conflicting first-response signals and creates a soft-404 risk. The public `/preview.html` route is a duplicate homepage, and `/admin` lacks a server-delivered `noindex` response.

The next major limitation at the time of the audit was local relevance and measurement. The public site identified the company as D&S Iron Works by Dallan Goff, with a Utah-wide service statement, phone, email, Facebook page, and Etsy shop. It did not establish a verified city/base, legitimate service-area cities, hours, credentials, or warranties. Since the audit, Search Console has been established, GA4 has been connected, and an existing Google Business Profile has entered verification; account metrics and remaining business facts still require access or client confirmation.

The one-time SEO Launch includes the initial technical corrections, Search Console/sitemap setup, GA4 and initial conversion tracking, initial Google Business Profile review/setup when eligible, content-format corrections, and benchmark documentation. None of those setup items consumes a Local Essentials monthly improvement. Local Essentials then provides one focused improvement per month and adapts to evidence.

## 2. Verified business facts

| Fact | Status | Evidence |
|---|---|---|
| Public brand is **D&S Iron Works** | Verified | Homepage title/body/footer and `artifacts/ironworks/index.html` |
| Dallan Goff is publicly named as the maker/contact | Verified | Homepage copy and `artifacts/ironworks/src/pages/Home.tsx`; Etsy public listing identifies Dallan as shop owner |
| Phone is `(435) 421-9033` | Verified on website | Live homepage/contact actions; `Home.tsx`; `ContactPage.tsx`; `index.html` JSON-LD |
| Website email is `dandsiron@yahoo.com` | Verified on website | Live footer/contact page; `ContactPage.tsx`; `index.html` JSON-LD |
| Website claims a Utah service area | Verified as a website claim | Homepage copy and `areaServed: "Utah"` in `index.html` and `Home.tsx` |
| Services shown are custom ironwork, fire pits, railings, hand-forged knives, metal signs, forged metal art, and blacksmith commissions | Verified on website | `artifacts/ironworks/src/data/services.ts` and live homepage/services UI |
| Pre-made products are a fire pit, Iron Rocket Stove, and Iron Rocket XL | Verified on website | `artifacts/ironworks/src/data/premade-items.ts` and live homepage |
| The website links to a Facebook page and Etsy shop | Verified | Live footer and `sameAs` in JSON-LD |
| Etsy provides independent evidence of active handmade goods and customer feedback | Verified publicly, limited | Public Etsy listing for the shop owner and a product with customer reviews; this does not verify local custom-service reviews |

**Naming status:** Use **D&S Iron Works** as the public brand target. The exact legal entity name still requires confirmation before legal or citation work.

## 3. Missing business information

The following items are **Missing or require client/account access**:

- Legal business name and confirmation that “D&S Iron Works” is the correct public name.
- Physical base and whether customers are received there; if not, the legitimate service-area-business arrangement.
- Exact cities/counties served and practical maximum travel distance.
- Highest-value work, typical customer, and geographic focus. Current priorities are pre-made products, custom designs/custom projects, and custom furniture.
- Business hours and response-time wording approval.
- Years in business/experience and any team information.
- Licenses, insurance, certifications, affiliations, warranties, delivery/install terms, and financing claims.
- Google Business Profile verification completion, ownership/access, categories, service area, reviews, and performance. An existing profile is already in verification.
- Search Console and GA4 reporting/configuration access and baseline metrics. The properties themselves already exist.
- Confirmed lead destinations and which actions count as qualified conversions.
- Permission to publish project details, customer testimonials, locations, and before/after images.

## 4. Website and page inventory

### Platform and hosting

- **Verified:** React 19 and Vite frontend with Wouter client routing; Express API/static server; pnpm workspace. Evidence: root `package.json`, `artifacts/ironworks/package.json`, `artifacts/ironworks/src/App.tsx`, and `artifacts/api-server/src/app.ts`.
- **Verified:** Replit configuration targets autoscale deployment with application routing and PostgreSQL available. Evidence: `.replit`.
- **Verified:** `pnpm run typecheck` passed on August 13, 2026.
- **Verified:** The live deployment's initial HTML and hashed asset names agree with the current repository structure and branding. This is reasonable deployment agreement, not proof that every database value matches the repository.

### Public route inventory

| Route group | Count | Index intent | Notes |
|---|---:|---|---|
| Homepage | 1 | Index | Main local/business page |
| Services hub | 1 | Index | Lists service categories |
| Service details | 7 | Index | Dedicated pages for the seven verified service categories |
| Pre-made product details | 3 | Index | Fire pit and two rocket-stove pages |
| Contact | 1 | Index | Lead form, call, email, and text actions |
| Shop product details | 40 | Index | Etsy-linked goods |
| `/preview.html` | 1 | No index/redirect | Duplicate homepage route, absent from sitemap |
| `/admin` | 1 | No index and access-controlled | Disallowed in robots but publicly returns the app shell |
| Unknown URLs | Unlimited | 404/410 | Currently return the SPA shell with `200` |

The sitemap contains 53 intended indexable URLs, exactly matching 1 homepage + 1 services hub + 7 services + 3 pre-made products + 1 contact page + 40 shop products.

### Navigation and internal linking

- **Verified:** Desktop navigation exposes Custom, Pre-Made, Services, Shop, and Contact; rendered mobile navigation collapses to a menu button. Evidence: rendered live DOM at desktop and 390x844.
- **Verified:** Homepage cards link into all seven service categories and three pre-made products. The services hub links to service details.
- **Verified:** Calls to action include direct phone, SMS, contact form, commission inquiry, product details, QuickBooks purchase flows, and Etsy.
- **Inferred:** The long single-page homepage puts substantial content and approximately 40 shop cards into one rendered document, which can dilute focus and increase media/interaction load. Field data is required before treating this as a measured performance problem.

### Page-level optimization inventory

| Page/template | Current purpose and verified state | Main evidence-based opportunity |
|---|---|---|
| `/` | Local brand, custom-work portfolio, pre-made products, process videos, shop, and contact paths; one H1 and substantial rendered content | Add verified base/service-area clarity and customer/project proof; reduce stale marketplace strings and measured media bottlenecks |
| `/services` | Service-discovery hub with ItemList JSON-LD and seven linked categories | Strengthen brief introductory decision context and route-specific server metadata |
| `/services/custom-ironwork-utah` | Broad custom-ironwork commercial page | Replace statewide generality with confirmed market and specific project/process proof |
| `/services/custom-fire-pits` | Custom fire-pit commercial page with inclusion/project labels | Add verified options, process, delivery/install area, proof, and customer questions |
| `/services/forged-railings` | Railing service page | Confirm whether design, fabrication, installation, code/licensing, finishes, and geography may be claimed |
| `/services/hand-forged-knives` | Custom blade/commission page | Confirm intended use, process, ordering constraints, safety/shipping facts, and representative projects |
| `/services/custom-metal-signs` | Personalized/ranch/address sign page | Add verified design workflow, materials/finishes, mounting or delivery facts, and project proof |
| `/services/forged-metal-art` | Sculptural/decorative ironwork page | Add commission process, scale/use examples, and real project narrative |
| `/services/blacksmith-commissions` | General commission-intent page | Explain fit, inquiry information needed, timeline only if verified, and links to relevant examples |
| `/pre-made/pre-built-fire-pits` | Product detail with price, gallery, features, and purchase intent | Confirm dimensions/material/safety/fulfillment/availability facts; retain accurate Product markup |
| `/pre-made/iron-rocket-stove` | Product detail with specifications, gallery, price, and purchase intent | Correct visible Markdown formatting; confirm safety, fuel, fulfillment, warranty, and availability statements |
| `/pre-made/iron-rocket-xl` | XL product detail with specifications, gallery, price, and purchase intent | Same as regular model; clearly differentiate verified dimensions/use case |
| `/contact` | Call, text, email, Facebook, and inquiry form | Confirm service area/hours and add privacy disclosure through approved legal process |
| `/shop/:id` (40 URLs) | Local detail pages for Etsy-linked products with Product JSON-LD | Keep Etsy title/price/link/image data synchronized; remove volatile cart-count language; ensure out-of-stock/removed items return an appropriate outcome |

All rows are **Verified** as route/content observations. Opportunities involving business facts remain **Missing or require client confirmation**.

## 5. Technical SEO findings

### Critical/high findings

1. **All SPA routes receive homepage source signals — Verified.** All 53 sitemap URLs returned `200`, 2,569 bytes, the homepage title, and `https://dandsironworks.com/` canonical in raw HTML. `artifacts/api-server/src/app.ts:43-48` serves the same `index.html` fallback for every non-API path. Client-side `useSeo` later changes metadata. Google recommends making canonical signals clear in source HTML, especially with client rendering. [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
2. **Unknown URLs return `200` — Verified.** `https://dandsironworks.com/not-a-real-page` returned the same shell and homepage signals. This creates a soft-404 risk. Google recommends a real `404`/`410` for unavailable content. [Google soft-404 guidance](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors)
3. **Duplicate/staging route is public — Verified.** `/preview.html` renders the homepage, returns `200`, has homepage source canonical, and is not disallowed. It should redirect to `/` or receive a server-delivered `noindex` if still operationally required.
4. **Admin indexing control is incomplete — Verified.** `robots.txt` disallows `/admin`, but the raw HTML says `index, follow`; `useSeo` has no admin override. A robots block is not a reliable removal/noindex mechanism because a blocked page cannot have its meta directive processed. Access control is the primary protection; server-side `noindex` is defense in depth.

### Foundations

- **Verified:** HTTP apex redirects `301` to HTTPS apex.
- **Verified:** `https://www.dandsironworks.com/` did not resolve during the audit. This is not automatically harmful if apex-only is intentional, but the preferred-host policy should be explicit. Configure `www` and permanently redirect it to apex, or document apex-only DNS intentionally.
- **Verified:** `robots.txt` is available, allows public crawling, disallows `/admin`, and references the sitemap.
- **Verified:** `sitemap.xml` is available and uses absolute HTTPS apex URLs.
- **Verified:** All sitemap entries use the same `lastmod` date (`2026-07-29`) and declared frequencies/priorities. Whether the date reflects meaningful page changes is **Missing**. Only use accurate modification dates.
- **Verified:** Route-specific titles, descriptions, canonicals, Open Graph data, and structured data are applied after JavaScript runs through `artifacts/ironworks/src/lib/seo.ts`.
- **Inferred:** Google may render and index route content, but first-response conflicts create avoidable uncertainty for crawlers, social previews, link unfurlers, and auditing tools.

### Structured data

- **Verified:** Static homepage source contains `LocalBusiness` JSON-LD with name, URL, image, phone, email, statewide `areaServed`, Facebook, and Etsy. Evidence: `artifacts/ironworks/index.html`.
- **Verified:** Rendered React routes define LocalBusiness (home/contact), ItemList (services), Service (service details), and Product (shop/pre-made details). Evidence: page-level `useSeo` calls and `artifacts/ironworks/src/lib/seo.ts`.
- **Verified:** Unsupported aggregate ratings/review markup was not found in the inspected schema.
- **Missing:** A Rich Results Test and Search Console enhancement report for deployed route-specific markup; no eligibility/result claim is made.
- **High recommendation:** After business facts are confirmed, use one stable organization/local-business identity and add only accurate recommended properties. Add BreadcrumbList where visible breadcrumbs are implemented. Do not add FAQ or review schema unless matching visible, eligible, supported content. Google requires structured data to represent the visible page and does not guarantee a rich result. [Google structured-data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

## 6. On-page and content findings

### Strengths

- **Verified:** Homepage has one descriptive H1 (“Custom Ironwork”), service/category headings, real calls to action, and substantial product/project content.
- **Verified:** Service pages have unique H1s, summaries, “What This Includes,” “Common Projects,” and call/contact actions.
- **Verified:** Route-specific title/description definitions exist for the homepage, service hub/details, pre-made products, shop products, and contact page.
- **Verified:** Rendered images generally have descriptive alternative text; service and product imagery is tied to the visible subject.
- **Verified:** Product and service details use distinct URLs rather than only homepage anchors.

### Opportunities and risks

- **Verified:** Local copy generally targets only “Utah”; no verified city/county service language is present. This is too broad for a grounded local map until the client confirms the real market.
- **Verified:** Several service pages are brief. The custom-fire-pits page, for example, has a summary, three included items, and four common-project labels but no process, material/finish choices, service geography, proof project, FAQs, or qualification details. Do not pad it; strengthen the priority page with verified decision-helping information.
- **Verified:** Live rocket-stove descriptions expose Markdown characters such as `**` and `*` and compress list content into paragraphs. This is a presentation/content-quality issue visible in the rendered DOM.
- **Verified:** The live homepage includes volatile Etsy merchandising strings such as “people have this in their cart.” They are not reliable inventory claims and may become stale when copied into the local site.
- **Verified:** No visible customer testimonial section or privacy-policy route was found in inspected source/rendered pages.
- **Inferred:** Project-specific pages/case studies could strengthen trust and long-tail relevance, but only after real project details, locations, and publication permission are supplied. Creating multiple thin location pages is not recommended.
- **Missing:** Search Console query/page data and search-volume data; therefore page priority and keyword opportunity remain directional.

### Initial keyword map (directional, not volume-ranked)

| Intent | Initial theme | Best current page | Dependency |
|---|---|---|---|
| Commercial local | custom ironwork + confirmed city/region | `/services/custom-ironwork-utah` | Confirm geography |
| Commercial local | custom fire pits + confirmed city/region | `/services/custom-fire-pits` | Confirm service/delivery area |
| Commercial local | custom metal railings/handrails + confirmed city/region | `/services/forged-railings` | Confirm installation scope/licensing |
| Commercial local | custom metal signs + confirmed city/region | `/services/custom-metal-signs` | Confirm priority/customer types |
| Commercial | blacksmith commissions Utah | `/services/blacksmith-commissions` | Confirm commission types |
| Product | portable steel fire pit / pack-flat fire pit | `/pre-made/pre-built-fire-pits` | Confirm shipping/pickup terms |
| Product | rocket stove with griddle / outdoor cooking stove | rocket-stove pages | Confirm fulfillment and specifications |
| Informational | how a custom fire pit is made; choosing steel/finish | Future proof-led guide or expanded service page | Client expertise and approval |
| Informational | rocket stove cooking/fuel/use guidance | Future product-support content | Safety-approved facts required |

## 7. Local SEO findings

- **Verified:** Name, phone, email, owner/maker, services, Utah claim, Facebook, and Etsy are consistent within the inspected website.
- **Missing:** The legitimate base and service-area cities. Until confirmed, competitor and local-keyword targeting are provisional.
- **Missing:** Hours, verified credentials, warranty, insurance, affiliations, and real local customer testimonials.
- **Verified:** Genuine project media and process videos provide useful craft evidence.
- **Verified:** Public exact-name/phone searches returned sparse business-specific results during this limited audit. This is not a ranking report or complete citation audit.
- **Inferred:** The site has a local trust gap rather than a product-detail gap: visitors can see what is made, but not clearly where service is available, which projects were completed locally, or which verified business assurances apply.

## 8. Google Business Profile requirements

**Public review result — Verified, limited:** On August 13, 2026, exact-name Google web searches and Google Maps searches for D&S Iron Works in Utah did not surface a matching listing. Maps searches using the website phone number and Dallan Goff's name also did not surface a matching profile. The broad name search returned unrelated Utah and out-of-state ironwork businesses, not a D&S profile matching the website phone or owner.

**Current status requires account access:** An existing profile has since been created and verification started. Confirm ownership, verification outcome, and any duplicate/suspension issue in the client's Google account. Do not create another profile.

Required launch work after client confirmation/access:

1. Confirm the exact real-world public name, eligible physical base, and whether it is a storefront, hybrid, or service-area business.
2. Have the client search the Google account(s) that may own the profile and provide any profile URL, ownership prompt, suspension notice, or prior verification email. Check for duplicates before recommending creation.
3. If a valid profile exists, retain client primary ownership and add Mojave Marketing only as Manager. If no profile exists after the account/duplicate check and the business is eligible, setup belongs to the one-time SEO Launch.
4. Use an accurate address/service area. Google says service-area businesses should hide a residential address when customers are not served there and generally keep service areas within a practical operating radius. [Google business representation guidelines](https://support.google.com/business/answer/3038177)
5. Select the closest accurate primary category and only relevant secondary categories; do not use categories as keyword fields.
6. Add verified services, hours, phone, website, description, and real photos.
7. Create a genuine review request workflow after profile eligibility/verification. Never incentivize reviews. [Google review guidance](https://support.google.com/business/answer/3474122)

If GBP verification is delayed, continue the Replit routing correction, validation of the existing Search Console/GA4 setup, business-fact collection, and project proof. Do not create a duplicate profile.

## 9. Analytics and conversion-tracking status

- **Historical audit observation:** On August 13, no GA4 tag, Google Tag Manager container, or Google site-verification tag was found in the inspected repository. GA4 is now connected and Search Console is established.
- **Missing:** GA4/Search Console accounts, ownership, historical data, and whether verification occurs outside the codebase (for example, DNS).
- **Verified:** A custom analytics implementation records visitors, sessions, events, and identified name/email/phone data. Evidence: `artifacts/api-server/src/routes/analytics.ts` and the frontend analytics/admin components.
- **Verified:** Contact and purchase-intent submissions are sent to backend commerce routes and persisted through database helpers; SMTP is used for notifications. Evidence: `ContactPage.tsx`, `PreMadePurchaseModal.tsx`, and `artifacts/api-server/src/routes/commerce.ts`.
- **Inferred:** Custom analytics can support operational review but should not be treated as the organic-search source of truth. Search Console is needed for queries, impressions, clicks, indexing, and Core Web Vitals; GA4 or another governed analytics tool is needed for acquisition and conversion reporting.
- **Verified risk:** No public privacy-policy route was found even though the site collects contact information and uses persistent visitor analytics. A privacy/legal review is client responsibility or separately scoped; this audit is not legal advice.

Recommended conversion events after approval: successful contact submission, tap-to-call, tap-to-text, email click, pre-made purchase-intent completion, outbound QuickBooks payment click, and outbound Etsy product click. Distinguish intent events from completed sales because Etsy/QuickBooks confirmation may be unavailable.

## 10. Performance and usability findings

- **Verified:** Desktop and 390x844 mobile rendered DOM tests completed; primary headings, navigation/menu trigger, cards, call actions, and content were present. This was a functional inspection, not a full accessibility certification.
- **Verified:** The production JavaScript is 687,059 bytes and CSS is 134,800 bytes by live `Content-Length`; both were served with `Cache-Control: private` during the audit.
- **Verified:** Repository media includes very large files: six process videos are approximately 11.6-16.9 MB, and multiple images exceed 1 MB. The largest file is `portable-fire-pit-assembly.mp4` at 16.88 MB.
- **Inferred:** The media-heavy homepage and private cache policy can increase repeat-transfer and LCP/network risk, especially on mobile. Network waterfalls and field data are required to identify actual transfer behavior because videos may be lazy-loaded.
- **Missing:** Reliable CrUX/Core Web Vitals field data. Google PageSpeed Insights returned HTTP 429 during the audit, so no Lighthouse score is claimed.
- **Verified:** Google defines good Core Web Vitals as LCP within 2.5 s, INP under 200 ms, and CLS under 0.1 at the 75th percentile. [Google Core Web Vitals guidance](https://developers.google.com/search/docs/appearance/core-web-vitals)

## 11. Search and competitor findings

Because the legitimate service geography is missing, this is a **provisional category competitor set**, not a final direct-local competitor list. A limited manual search is not a ranking report.

| Competitor | Verified public overlap | Visible strengths | Limitation |
|---|---|---|---|
| [Central Utah Metal Buildings](https://cumetalbuildings.com/residential-buildings/) | Central Utah; custom gates/handrails, fire pits, grills, benches | Explicit region, service list, past-project gallery | Broader building company; direct overlap depends on D&S service area |
| [Liston Metalworks](https://www.listonmetalworks.com/our-services/) | Southern Utah; custom railings, fire pits, signs, plasma cutouts | Detailed service coverage and product customization | Ivins market may not overlap |
| [Lightning Forge](https://www.lightning-forge.com/) | Utah custom ironwork, railings, fireplaces, fixtures | Years-in-business claim, testimonials, gallery, local positioning | Salt Lake Valley, not necessarily direct geography |
| [Edmonds Railing](https://www.edmondsrailings.com/services) | Utah custom railings/metal fabrication | Dedicated service content and experience claim | Railing-focused and Utah County |
| [JP Superior Backyards](https://www.jpsuperiorbackyards.com/) | Utah custom metal fire pits | Dedicated fire-pit positioning, hours, phone, license claim | Sandy/Salt Lake focus and narrower service mix |

**Realistic gaps:** verified local geography, project stories tied to allowed locations, customer proof, credentials, hours, and service decision information. D&S already has stronger craft/process visuals and a broader product catalog than several competitors.

## 12. Review, citation, and authority findings

- **Verified:** The website provides Facebook and Etsy identity links; public Etsy product reviews offer product-market trust, but should not be republished as local-service reviews without permission and policy review.
- **Missing:** Google reviews, citation inventory, Chamber/trade memberships, supplier/manufacturer relationships, event participation, and local press.
- **Included guidance:** establish one accurate business-data sheet; claim/standardize only legitimate core profiles; request genuine Google reviews from completed customers; respond professionally; document project-photo/testimonial permission.
- **Separately scoped:** extensive citation cleanup, manual directory campaigns, active backlink outreach, sponsorships, PR, photography, and organization membership fees.
- **Potential authority categories, subject to eligibility:** local Chamber of Commerce, Utah maker/arts organizations, blacksmith associations, local home-builder/remodeler networks, suppliers, and community events. No link is promised.

## 13. Risks and limitations

- At the August 13 audit, no Search Console, GA4, GBP, call tracking, CRM, sales, ranking-platform, or backlink-tool access was available. Search Console, GA4, and an existing GBP are now confirmed, but their reporting data was not available in the August 21 verification task.
- Service geography and official business identity were not confirmed.
- Manual search results vary by user, location, and time; they were used only for qualitative public evidence.
- PageSpeed Insights was rate-limited (HTTP 429), so no lab score or field metric is reported.
- Client-rendered metadata was observed in a browser, but Google's actual indexed canonical and rendered URL inspection require Search Console.
- Dynamic product/admin/database values can differ from repository defaults.
- This is not legal, privacy, tax, safety, licensing, or accessibility-compliance advice.

## 14. Recommended priorities

| Action | Priority | Evidence | Expected benefit | Effort | Scope | Approval/access |
|---|---|---|---|---|---|---|
| Return route-specific HTML metadata/canonicals and real 404s | Critical | All 53 URLs and unknown URL return same source shell/canonical | Clearer indexation, canonical consolidation, correct previews, fewer soft 404s | High | SEO Launch | Website approval and deployment access |
| Redirect or noindex `/preview.html`; harden/noindex `/admin` | High | Public 200 routes; admin robots-only control | Removes duplicate/utility URLs from search risk | Low-Medium | SEO Launch | Approval; preserve admin operation |
| Confirm preferred hostname and redirect `www` to apex | High | HTTPS apex works; `www` does not resolve | Consistent access and canonical signals | Low | SEO Launch | DNS access/approval |
| Confirm business name, base/service area, priority services, and hours | Critical | Site only says Utah; brief/site naming mismatch | Enables accurate local targeting and GBP work | Low client effort | Client responsibility | Client input required |
| Establish Search Console, submit sitemap, set up GA4/initial conversions, and document benchmarks | High | No tags/verification found; no account data | Reliable acquisition, index, and lead measurement | Medium | SEO Launch | Account ownership/access and privacy approval |
| Complete verification and duplicate/ownership review for the existing GBP | High | Existing profile confirmed; verification started | Accurate Local Search/Maps foundation without duplicate risk | Medium | SEO Launch | Client facts, account access, ownership, and verification |
| Improve one priority service page with verified local/project proof | High | Service pages are brief and generic geographically | Better intent match and conversion confidence | Medium | Local Essentials Month 1 | Priority/geography/project facts required |
| Correct raw Markdown/stale merchandising claims | Medium | Visible rocket-stove formatting and Etsy cart counts | Cleaner customer experience and content accuracy | Low | SEO Launch correction | Content approval |
| Optimize media delivery and caching after measurement | Medium | 11.6-16.9 MB videos; private cache headers | Potential mobile speed and repeat-load improvements | Medium-High | Local Essentials monthly improvement; CDN/architecture may be separate | Performance baseline and deployment approval |
| Add compliant privacy disclosure/process | High risk-management priority | Personal data and visitor analytics; no policy route found | Transparency and risk reduction | Medium | Client/legal responsibility or separate scope | Qualified legal/privacy approval |
| Build genuine review request workflow | Medium | No visible local-service testimonials; GBP unknown | Ongoing local trust evidence | Low | Local Essentials guidance | Verified GBP and customer participation |
| Add project case study only when evidence is available | Medium | Strong media, little project context | Local relevance, proof, long-tail coverage | Medium | One monthly improvement; extra pages beyond one focus may be separate | Photos, facts, permission |

## Official guidance used

- [Google: JavaScript search problems and SPA soft 404s](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript)
- [Google: canonical URL methods](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: LocalBusiness structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [Google: structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: meta descriptions/snippets](https://developers.google.com/search/docs/appearance/snippet)
- [Google: Business Profile representation guidelines](https://support.google.com/business/answer/3038177)
- [Google: genuine review guidance](https://support.google.com/business/answer/3474122)
- [Google: Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
