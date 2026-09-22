import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Explicitly opt into an isolated local fixture. Never writes a production API.
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const fixture = process.env.SEO_FIXTURE_FILE && path.resolve(process.env.SEO_FIXTURE_FILE);
const origin = process.env.SEO_TEST_ORIGIN ?? 'http://127.0.0.1:5189';
const localWork = path.resolve(repo, 'work') + path.sep;
assert.ok(fixture?.startsWith(localWork), 'Set SEO_FIXTURE_FILE to the isolated admin-content.json under this repository’s work directory.');
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(origin).hostname), 'Mutation verification is local-only.');
const original = fs.readFileSync(fixture, 'utf8');
const data = JSON.parse(original);
const write = () => fs.writeFileSync(fixture, JSON.stringify(data));
const get = async route => {
  const response = await fetch(`${origin}${route}`);
  return { status: response.status, body: await response.text() };
};
try {
  const items = data['premade-products'].payload;
  const regular = items.find(item => item.id === 'iron-rocket-stove');
  const xl = items.find(item => item.id === 'iron-rocket-xl');
  regular.description = 'A steel cooktop measuring 18 inches wide by 34 inches long. Rear griddle—18 inches wide by 20 inches long. The cooktop lifts completely off the base stove.';
  xl.description = 'A steel cooktop measuring 26 inches wide by 36 inches long. Rear griddle—26 inches wide by 24 inches long.';
  write();
  let page = await get('/pre-made/iron-rocket-stove');
  assert.equal(page.status, 200);
  assert.ok(page.body.includes('18 inches wide × 34 inches long'));
  assert.ok(page.body.includes('26 inches wide × 36 inches long'), 'Comparison must use the other saved product, not build defaults.');
  assert.ok(!page.body.includes('16 × 32') && !page.body.includes('22 × 32'));

  data['premade-products'].payload = [regular, { ...regular, id: 'seo-regression-test-item', title: 'Temporary local test product' }];
  regular.description = 'Contact Dallan for the current configuration.';
  write();
  page = await get('/pre-made/iron-rocket-stove');
  assert.ok(!page.body.includes('18 inches wide × 34 inches long'));
  assert.ok(!page.body.includes('href="/pre-made/iron-rocket-xl"'), 'Removed comparison product must not stay linked.');
  let sitemap = await get('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.ok(sitemap.body.includes('/pre-made/seo-regression-test-item</loc>'));
  assert.ok(!sitemap.body.includes('/pre-made/iron-rocket-xl</loc>'));
  assert.equal((await get('/pre-made/seo-regression-test-item')).status, 200);
  assert.equal((await get('/pre-made/iron-rocket-xl')).status, 404);

  data['premade-products'].payload = [];
  data['etsy-products'].payload = [];
  data.services.payload = [];
  write();
  sitemap = await get('/sitemap.xml');
  assert.ok(!sitemap.body.includes('/pre-made/') && !sitemap.body.includes('/shop/') && !sitemap.body.includes('/services/'));
  const urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.equal(new Set(urls).size, urls.length);
  assert.equal(urls.length, 4, 'Only the four permanent public pages should remain.');
  const contact = await get('/contact');
  for (const link of ['tel:+14354219033', 'sms:+14354219033', 'mailto:dandsiron@yahoo.com']) assert.ok(contact.body.includes(`href="${link}"`));
  assert.ok(contact.body.includes('"@type":"ContactPage"'));
  assert.ok(contact.body.includes('https://dandsironworks.com/#business'));
  console.log('PASS: current dimensions, cross-product comparison, removed links, new/removed sitemap URLs, empty collections, and contact HTML.');
} finally {
  fs.writeFileSync(fixture, original);
}
