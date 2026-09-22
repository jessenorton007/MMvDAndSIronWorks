import { readPublicProducts } from './product-content';
import { readPublicServices } from './service-content';
import source from './seo-source-data.json';

const origin = 'https://dandsironworks.com';
const validSegment = (value: string) => /^[a-z0-9_-]+$/i.test(value);

export async function publicSitemap() {
  const [services, preMade, etsy] = await Promise.all([
    readPublicServices(), readPublicProducts('premade-products'), readPublicProducts('etsy-products'),
  ]);
  const paths = new Set([
    '/', '/services', '/contact', source.railingProject.path,
    ...services.filter(item => validSegment(item.slug)).map(item => `/services/${item.slug}`),
    ...preMade.filter(item => validSegment(item.id)).map(item => `/pre-made/${item.id}`),
    ...etsy.filter(item => validSegment(item.id)).map(item => `/shop/${item.id}`),
  ]);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...paths].map(path => `  <url><loc>${origin}${path}</loc></url>`).join('\n')}\n</urlset>\n`;
}
