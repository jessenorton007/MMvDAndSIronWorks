// Shared by the browser and initial HTML renderer.
export const origin = 'https://dandsironworks.com';
export const websiteSchema = {
  '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${origin}/#website`,
  url: `${origin}/`, name: 'D&S Iron Works', alternateName: 'D and S Iron Works', inLanguage: 'en-US',
  publisher: { '@id': `${origin}/#business` },
};
export const collections = {
  '/pre-made': {
    title: 'Pre-Built Fire Pits & Rocket Stoves | D&S Iron Works', heading: 'Pre-Built Fire Pits & Rocket Stoves',
    description: 'Compare pre-built steel fire pits, Iron Rocket Stove and Iron Rocket XL outdoor cooking stoves from D&S Iron Works. View photos, prices and specifications.',
    intro: 'Explore existing steel designs from D&S Iron Works, from fire pits for outdoor gatherings to Iron Rocket cooking stoves. Compare the current photos, prices and specifications, then talk with Dallan about availability and pickup or delivery before ordering.',
    adviceTitle: 'Choosing an existing design or a custom build',
    advice: 'Start with a pre-built design when its size and features suit your plans. If you need personalized cutouts, lettering or a different size, discuss a custom fire pit with Dallan. For an Iron Rocket stove, compare the cooking surface and included components on each product page.',
    relatedPath: '/services/custom-fire-pits', relatedLabel: 'Explore custom fire pits',
  },
  '/shop': {
    title: 'Hand-Forged Iron Gifts & Jewelry | D&S Iron Works', heading: 'Hand-Forged Iron Goods & Gifts',
    description: 'Browse D&S Iron Works handmade iron jewelry, pendants, bells, ornaments and gifts. Explore product details and follow each listing to Etsy to confirm options.',
    intro: 'Browse hand-forged and handmade pieces from D&S Iron Works. Explore pendants, jewelry, ornaments, bells and other iron goods, then open the Etsy listing to confirm the current price, options and availability before purchasing.',
    adviceTitle: 'Finding a handmade gift',
    advice: 'Look through the photos and description for the materials, dimensions and design details that matter to you. Etsy handles purchases for these listings. For a personalized piece or a project beyond the listed designs, contact Dallan to discuss a blacksmith commission.',
    relatedPath: '/services/blacksmith-commissions', relatedLabel: 'Discuss a custom blacksmith commission',
  },
} as const;
export type Breadcrumb = { name: string; path: string };
export function breadcrumbsFor(path: string, title: string): Breadcrumb[] {
  if (path === '/' || path.startsWith('/admin')) return [];
  const items: Breadcrumb[] = [{ name: 'Home', path: '/' }];
  if (path.startsWith('/services/')) items.push({ name: 'Services', path: '/services' });
  if (path.startsWith('/pre-made/')) items.push({ name: 'Pre-Made', path: '/pre-made' });
  if (path.startsWith('/shop/')) items.push({ name: 'Shop', path: '/shop' });
  if (path.startsWith('/projects/')) items.push({ name: 'Forged Railings', path: '/services/forged-railings' });
  items.push({ name: title.split(' | ')[0], path });
  return items;
}
export function breadcrumbSchema(path: string, title: string) {
  const items = breadcrumbsFor(path, title);
  return items.length < 2 ? undefined : {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: `${origin}${item.path}` })),
  };
}
export function collectionSchema(path: keyof typeof collections, products: { id: string; title: string }[]) {
  return {
    '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${origin}${path}#collection`,
    name: collections[path].heading, description: collections[path].description, url: `${origin}${path}`,
    isPartOf: { '@id': `${origin}/#website` },
    mainEntity: { '@type': 'ItemList', numberOfItems: products.length, itemListElement: products.map((item, i) => ({
      '@type': 'ListItem', position: i + 1, name: item.title, url: `${origin}${path}/${item.id}`,
    })) },
  };
}
