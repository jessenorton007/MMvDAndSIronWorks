import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/analytics/ga4.ts', import.meta.url), 'utf8').replace('import.meta.env.VITE_GA4_MEASUREMENT_ID', 'undefined');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function load(hostname) {
  const scripts = [];
  const context = { exports: {}, window: { location: { hostname, pathname: '/pre-made/iron-rocket-stove' } }, document: { createElement: () => ({}), head: { appendChild: element => scripts.push(element) } } };
  vm.runInNewContext(code, context);
  return { ...context, scripts };
}
for (const host of ['127.0.0.1', 'localhost', 'preview.replit.dev']) {
  const test = load(host);
  assert.equal(test.exports.initGa4(), false);
  test.exports.trackGaEvent('generate_lead', { form_name: 'purchase_request' });
  assert.equal(test.scripts.length, 0);
  assert.equal(test.window.dataLayer, undefined);
}
for (const host of ['dandsironworks.com', 'www.dandsironworks.com']) {
  const test = load(host);
  assert.equal(test.exports.initGa4(), true);
  assert.equal(test.exports.initGa4(), false);
  assert.equal(test.scripts.length, 1);
  assert.equal(Object.prototype.toString.call(test.window.dataLayer[0]), '[object Arguments]');
  for (const event of ['begin_checkout', 'generate_lead', 'payment_redirect']) {
    test.exports.trackGaEvent(event, { product_id: 'iron-rocket-stove' });
    const args = Array.from(test.window.dataLayer.at(-1));
    assert.equal(args[0], 'event'); assert.equal(args[1], event);
    assert.equal(args[2].page_path, '/pre-made/iron-rocket-stove');
    assert.deepEqual(Object.keys(args[2]).sort(), ['page_path', 'product_id']);
  }
}
console.log('PASS: production GA4 queue, one initialization, event context, and preview exclusion.');
