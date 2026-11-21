import assert from 'node:assert/strict';
const base = process.env.SEO_TEST_ORIGIN || 'http://127.0.0.1:21010';
const origin = 'https://dandsironworks.com';
const get = async path => { const r = await fetch(base + path); assert.equal(r.status, 200, path); return { html: await r.text(), headers: r.headers }; };
const json = html => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
let productsChecked = 0;
for (const [path, key] of [['/pre-made','premade-products'],['/shop','etsy-products']]) {
  const {html} = await get(path);
  const items = (await (await fetch(base + '/api/admin/content/' + key)).json()).content;
  const schemas = json(html);
  assert.equal(schemas.filter(s=>s['@type']==='WebSite').length,1);
  const collection = schemas.find(s=>s['@type']==='CollectionPage');
  assert.equal(collection.mainEntity.numberOfItems,items.length);
  assert.equal(collection.mainEntity.itemListElement.length,items.length);
  assert.ok(html.includes('rel="canonical" href="'+origin+path+'"'));
  assert.ok(html.includes('max-image-preview:large'));
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  for (const item of items) {
    const route = path+'/'+item.id;
    assert.ok(html.includes('href="'+route+'"'),route+' linked in initial HTML');
    const detail = (await get(route)).html;
    const breadcrumb=json(detail).find(s=>s['@type']==='BreadcrumbList');
    assert.equal(breadcrumb.itemListElement[1].item,origin+path);
    assert.equal(breadcrumb.itemListElement.at(-1).item,origin+route);
    assert.ok(detail.includes('aria-label="Breadcrumb"'));
    productsChecked++;
  }
}
for(const path of ['/services','/services/forged-railings','/contact','/projects/forged-stair-balcony-railings']) {
  const {html}=await get(path);const breadcrumb=json(html).find(s=>s['@type']==='BreadcrumbList');
  assert.ok(breadcrumb.itemListElement.length>=2);assert.equal(breadcrumb.itemListElement.at(-1).item,origin+path);
}
const index=await fetch(base+'/index.html?utm_source=check',{redirect:'manual'});
assert.equal(index.status,301);assert.equal(index.headers.get('location'),'/?utm_source=check');
const sitemap=(await get('/sitemap.xml')).html;
assert.ok(sitemap.includes('<loc>'+origin+'/pre-made</loc>'));assert.ok(sitemap.includes('<loc>'+origin+'/shop</loc>'));
assert.ok(!sitemap.includes('/classes'));
assert.ok(sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
assert.ok(sitemap.includes('<image:loc>https://dandsironworks.com/images/'));
for(const match of sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) assert.ok(match[1].startsWith(origin+'/'));
const home=(await get('/')).html;
const asset=home.match(/src="(\/assets\/[^"]+\.js)"/)[1];
assert.match((await get(asset)).headers.get('cache-control'),/max-age=31536000.*immutable/);
assert.ok(!home.includes('maximum-scale=1'));
const missing=await fetch(base+'/seo-missing-route-check');assert.equal(missing.status,404);
assert.match(missing.headers.get('x-robots-tag'),/noindex/);
console.log(JSON.stringify({ok:true,productsChecked,collectionsChecked:2,breadcrumbsChecked:productsChecked+6,indexRedirect:true,assetCache:true,classesExcluded:true},null,2));
