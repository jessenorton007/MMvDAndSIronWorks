import { readPublicProducts } from './product-content';
import { readPublicServices } from './service-content';
import source from './seo-source-data.json';

const origin = 'https://dandsironworks.com';
const validSegment = (value: string) => /^[a-z0-9_-]+$/i.test(value);

const xml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function imageEntries(values: (string | undefined)[]) {
  const urls = new Set(values.flatMap(value => {
    if (!value) return [];
    try { const url = new URL(value, origin); return url.origin === origin && !url.hash ? [url.href] : []; } catch { return []; }
  }));
  return [...urls].slice(0, 1000).map(url => `<image:image><image:loc>${xml(url)}</image:loc></image:image>`).join('');
}
export async function publicSitemap() {
  const [services, preMade, etsy] = await Promise.all([
    readPublicServices(), readPublicProducts('premade-products'), readPublicProducts('etsy-products'),
  ]);
  const paths = new Set([
    '/', '/services', '/contact', '/pre-made', '/shop', source.railingProject.path,
    ...services.filter(item => validSegment(item.slug)).map(item => `/services/${item.slug}`),
    ...preMade.filter(item => validSegment(item.id)).map(item => `/pre-made/${item.id}`),
    ...etsy.filter(item => validSegment(item.id)).map(item => `/shop/${item.id}`),
  ]);
  const images = new Map<string, (string | undefined)[]>([
    ['/', ['/opengraph.jpg']],
    [source.railingProject.path, source.railingProject.sections.map(section => section.image)],
    ...services.map(item => [`/services/${item.slug}`, [item.heroImage, ...(item.gallery ?? []).map(image => image.src)]] as [string, string[]]),
    ...preMade.map(item => [`/pre-made/${item.id}`, [item.image, ...(item.gallery ?? []).map(image => image.src)]] as [string, string[]]),
    ...etsy.map(item => [`/shop/${item.id}`, [item.image]] as [string, string[]]),
  ]);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${[...paths].map(path => `  <url><loc>${origin}${path}</loc>${imageEntries(images.get(path) ?? [])}</url>`).join('\n')}\n</urlset>\n`;
}
