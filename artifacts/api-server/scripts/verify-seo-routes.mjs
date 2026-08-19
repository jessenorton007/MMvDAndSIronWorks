import fs from "node:fs";
import http from "node:http";

const baseUrl = process.env.SEO_TEST_ORIGIN ?? "http://127.0.0.1:5189";
const sitemapPath = process.env.SEO_SITEMAP_PATH ?? "../../ironworks/public/sitemap.xml";
const expectedRouteCount = Number(process.env.SEO_EXPECTED_ROUTE_COUNT ?? 53);
const xml = fs.readFileSync(new URL(sitemapPath, import.meta.url), "utf8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const failures = [];
const canonicals = new Set();
const titles = new Set();

for (const url of urls) {
  const pathname = new URL(url).pathname;
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "manual" });
  const body = await response.text();
  const canonical = body.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const title = body.match(/<title>([^<]+)<\/title>/i)?.[1];

  if (response.status !== 200) failures.push(`${pathname}: status ${response.status}`);
  if (canonical !== url) failures.push(`${pathname}: canonical ${canonical ?? "missing"}`);
  if (!title) failures.push(`${pathname}: missing title`);
  if (!body.includes('id="seo-fallback"') || !/<h1>[^<]+<\/h1>/i.test(body)) {
    failures.push(`${pathname}: missing fallback H1`);
  }
  if (canonical) canonicals.add(canonical);
  if (title) titles.add(title);
}

const checks = [];
async function check(name, pathname, status, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    redirect: "manual",
    headers: options.headers,
  });
  const body = await response.text();
  const ok = response.status === status
    && (!options.location || response.headers.get("location") === options.location)
    && (!options.header || String(response.headers.get(options.header[0])).includes(options.header[1]))
    && (!options.body || body.includes(options.body));

  checks.push({
    name,
    ok,
    status: response.status,
    location: response.headers.get("location"),
    robots: response.headers.get("x-robots-tag"),
  });
  if (!ok) failures.push(`${name}: failed`);
}

await check("unknown 404", "/definitely-not-a-real-route", 404, {
  header: ["x-robots-tag", "noindex"],
});
await check("preview redirect", "/preview.html", 301, { location: "/" });
await check("trailing slash", "/services/", 301, { location: "/services" });
await check("admin unauthenticated", "/admin", 302, { location: "/" });

const password = process.env.ADMIN_PASSWORD ?? "seo-test-password";
const login = await fetch(`${baseUrl}/api/admin/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ password }),
});
const cookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
await check("admin authenticated", "/admin", 200, {
  headers: { cookie },
  header: ["x-robots-tag", "noindex"],
  body: "noindex, nofollow, noarchive",
});
const wwwRedirect = await new Promise((resolve, reject) => {
  const target = new URL(baseUrl);
  const request = http.request({
    hostname: target.hostname,
    port: target.port,
    path: "/services?x=1",
    method: "GET",
    headers: { host: "www.dandsironworks.com" },
  }, (response) => {
    response.resume();
    response.on("end", () => resolve({
      status: response.statusCode,
      location: response.headers.location,
    }));
  });
  request.on("error", reject);
  request.end();
});
const wwwRedirectOk = wwwRedirect.status === 301
  && wwwRedirect.location === "https://dandsironworks.com/services?x=1";
checks.push({ name: "www to apex", ok: wwwRedirectOk, ...wwwRedirect });
if (!wwwRedirectOk) failures.push("www to apex: failed");

const representativePaths = [
  "/",
  "/services/custom-ironwork-utah",
  "/pre-made/pre-built-fire-pits",
  "/contact",
];
const identities = [];
for (const pathname of representativePaths) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const body = await response.text();
  identities.push({
    path: pathname,
    title: body.match(/<title>([^<]+)<\/title>/i)?.[1],
    canonical: body.match(/<link rel="canonical" href="([^"]+)"/i)?.[1],
    heading: body.match(/id="seo-fallback"[\s\S]*?<h1>([^<]+)<\/h1>/i)?.[1],
  });
}

if (urls.length !== expectedRouteCount) {
  failures.push(`sitemap route count: expected ${expectedRouteCount}, received ${urls.length}`);
}
if (canonicals.size !== expectedRouteCount) {
  failures.push(`canonical count: expected ${expectedRouteCount}, received ${canonicals.size}`);
}

console.log(JSON.stringify({
  sitemapCount: urls.length,
  canonicalCount: canonicals.size,
  titleCount: titles.size,
  failures,
  checks,
  identities,
}, null, 2));

if (failures.length > 0) process.exit(1);
