import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const helper = fs.readFileSync(new URL('../src/lib/product-seo.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(helper, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { productSchema, productDescription, publicFeatures, numericPrice, plainText } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const guideCode = ts.transpileModule(fs.readFileSync(new URL('../src/lib/product-guides.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { resolveProductGuide } = await import(`data:text/javascript;base64,${Buffer.from(guideCode).toString('base64')}`);

const origin = process.env.SEO_TEST_ORIGIN ?? 'http://127.0.0.1:5189';
const source = JSON.parse(fs.readFileSync(new URL('../src/lib/seo-source-data.json', import.meta.url), 'utf8'));
const escaped = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const home = await (await fetch(origin)).text();
let products = 0;
let questions = 0;
assert.equal(numericPrice('$1,250.00'), '1250.00');
for (const value of ['From $100', '$100–$200', 'Call for quote', '100 USD', '$1,00']) assert.equal(numericPrice(value), undefined);
assert.deepEqual(publicFeatures(['Test', 'Te test', 'test test', 'Tested steel', 'Pack-flat']), ['Tested steel', 'Pack-flat']);
for (const [key, prefix, fallback] of [['premade-products', '/pre-made/', source.preMadeItems], ['etsy-products', '/shop/', source.defaultEtsyProducts]]) {
  const response = await fetch(`${origin}/api/admin/content/${key}`);
  assert.equal(response.status, 200);
  const items = (await response.json()).content ?? fallback;
  for (const item of items) {
    const path = `${prefix}${item.id}`;
    const page = await fetch(`${origin}${path}`);
    assert.equal(page.status, 200, path);
    const html = await page.text();
    const schema = JSON.parse(html.match(/<script id="route-json-ld" type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? 'null');
    assert.deepEqual(schema, productSchema(item, path, item.etsyUrl), `${path}: visible data and schema differ`);
    assert.ok(html.includes(`<h1>${escaped(item.title)}</h1>`), path);
    assert.ok(html.includes(`content="${escaped(productDescription(item.description))}"`), path);
    assert.ok(html.includes(escaped(item.priceLabel)), `${path}: price missing`);
    assert.ok(home.includes(`href="${path}"`), `${path}: home link missing`);
    for (const paragraph of item.description.split(/\n\s*\n/)) assert.ok(html.includes(escaped(plainText(paragraph))), `${path}: description missing`);
    if (key === 'premade-products') {
      for (const feature of publicFeatures(item.features)) assert.ok(html.includes(escaped(feature)), path);
      for (const faq of resolveProductGuide(item.id, items)?.faqs ?? []) {
        assert.ok(html.includes(escaped(faq.question)) && html.includes(escaped(plainText(faq.answer))), path);
        questions++;
      }
    }
    products++;
  }
}
const project = await fetch(`${origin}${source.railingProject.path}`);
assert.equal(project.status, 200);
const projectHtml = await project.text();
for (const section of source.railingProject.sections) assert.ok(projectHtml.includes(escaped(section.text)));
for (const variants of Object.values(source.optimizedImages)) {
  for (const image of variants) {
    const response = await fetch(`${origin}${image.src}`, { method: 'HEAD' });
    assert.equal(response.status, 200, image.src);
    assert.match(response.headers.get('content-type'), /image\/webp/);
  }
}
console.log(JSON.stringify({ passed: true, products, questions, project: source.railingProject.path, responsiveImages: Object.keys(source.optimizedImages).length }, null, 2));
