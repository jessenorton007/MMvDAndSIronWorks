import assert from "node:assert/strict";
import fs from "node:fs";

const origin = process.env.SEO_TEST_ORIGIN ?? "http://127.0.0.1:5189";
const defaults = JSON.parse(fs.readFileSync(new URL("../src/lib/seo-source-data.json", import.meta.url), "utf8")).services;
const response = await fetch(`${origin}/api/admin/content/services`);
assert.equal(response.status, 200, "Public service content must load");
const saved = (await response.json()).content;
const services = saved === null ? defaults : saved.map(item => ({ ...defaults.find(service => service.slug === item.slug), ...item }));
const escaped = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const directory = await (await fetch(`${origin}/services`)).text();
let questions = 0;
let relatedLinks = 0;
for (const service of services) {
  const path = `/services/${service.slug}`;
  assert.ok(directory.includes(`href="${path}"`), `Directory link missing: ${path}`);
  const page = await fetch(`${origin}${path}`);
  assert.equal(page.status, 200, path);
  const html = await page.text();
  assert.ok(html.includes(`<h1>${escaped(service.title)}</h1>`), `${path}: saved heading missing`);
  for (const text of [service.summary, ...service.details, ...service.examples, ...(service.quoteChecklist ?? []), ...(service.process ?? []).flatMap(step => [step.title, step.description]), ...(service.localServiceNote ? [service.localServiceNote] : [])]) {
    assert.ok(html.includes(escaped(text)), `${path}: initial HTML missing ${text}`);
  }
  for (const faq of service.faqs ?? []) {
    assert.ok(html.includes(`<h3>${escaped(faq.question)}</h3><p>${escaped(faq.answer)}</p>`), `${path}: missing question/answer`);
    questions++;
  }
  for (const photo of service.gallery ?? []) {
    assert.ok(html.includes(`alt="${escaped(photo.alt)}"`), `${path}: gallery missing`);
  }
  for (const slug of service.relatedSlugs ?? []) {
    if (!services.some(item => item.slug === slug)) continue;
    assert.ok(html.includes(`href="/services/${slug}"`), `${path}: related service link missing`);
    relatedLinks++;
  }
  for (const product of service.relatedProducts ?? []) {
    assert.ok(html.includes(`href="${product.path}"`), `${path}: related product missing`);
    assert.equal((await fetch(`${origin}${product.path}`)).status, 200, product.path);
  }
  const schema = JSON.parse(html.match(/<script id="route-json-ld" type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "null");
  assert.equal(schema?.name, service.title, `${path}: schema and visible title differ`);
}
console.log(JSON.stringify({ passed: true, services: services.length, questions, relatedLinks }, null, 2));
