import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const siteArg = process.argv.find((arg) => arg.startsWith('--site='));
const rawSiteUrl = siteArg?.replace('--site=', '') || process.env.SITE_URL;

if (!rawSiteUrl) {
  throw new Error('Missing site URL. Run with --site=https://yourdomain.com after the custom domain is connected.');
}

const siteUrl = rawSiteUrl.replace(/\/$/, '');

const productData = readFileSync(resolve('src', 'data', 'etsy-products.ts'), 'utf8');
const etsyProductRoutes = [...productData.matchAll(/id: '([^']+)'/g)]
  .map((match) => `/shop/${match[1]}`);

const routes = [
  '/',
  '/services',
  '/services/custom-ironwork-utah',
  '/services/custom-fire-pits',
  '/services/forged-railings',
  '/services/hand-forged-knives',
  '/services/custom-metal-signs',
  '/services/forged-metal-art',
  '/services/blacksmith-commissions',
  '/pre-made/pre-built-fire-pits',
  '/pre-made/iron-rocket-stove',
  '/pre-made/iron-rocket-xl',
  '/contact',
  ...etsyProductRoutes,
];

const urls = routes.map((route) => `  <url>
    <loc>${siteUrl}${route}</loc>
  </url>`).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(resolve('public', 'sitemap.xml'), xml);
console.log(`Generated public/sitemap.xml for ${siteUrl}`);
