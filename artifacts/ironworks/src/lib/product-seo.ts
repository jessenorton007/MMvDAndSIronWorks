// Pure helpers shared with the server by generate-seo-data.mjs.
export const SITE_ORIGIN = 'https://dandsironworks.com';
export const absoluteSiteUrl = (value: string) => new URL(value, SITE_ORIGIN).toString();
export function plainText(value: string) {
  return value.replace(/\*+/g, '').replace(/^\s*[-#]\s+/gm, '').replace(/\s+/g, ' ').trim();
}
export function productDescription(value: string) {
  const text = plainText(value);
  return text.length <= 165 ? text : `${text.slice(0, 162).replace(/\s+\S*$/, '')}…`;
}
export function numericPrice(value: string) {
  const match = value.trim().match(/^\$?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?)$/);
  return match ? match[1].replaceAll(',', '') : undefined;
}
export const publicFeatures = (values: string[]) => values.filter(value => !/^(?:(?:te\s+)?test)(?:\s+test)*[.!]?$/i.test(value.trim()));
export const reliableProductDetails = (values: string[] = []) => values.filter(value => !/\b(available|left|in stock|low stock|people have this in their cart)\b/i.test(value));
export function productSchema(item: { title: string; description: string; image: string; priceLabel: string }, path: string, offerUrl = absoluteSiteUrl(path)) {
  const price = numericPrice(item.priceLabel);
  return {
    '@context': 'https://schema.org', '@type': 'Product',
    '@id': `${absoluteSiteUrl(path)}#product`, url: absoluteSiteUrl(path),
    name: item.title, description: plainText(item.description),
    image: absoluteSiteUrl(item.image), brand: { '@type': 'Brand', name: 'D&S Iron Works' },
    ...(price ? { offers: { '@type': 'Offer', priceCurrency: 'USD', price, url: offerUrl } } : {}),
  };
}
